// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { canSupervise } from '../agent/agentProfile.ts'
import { asSoftphoneError } from '../ports/SoftphoneError.ts'
import { canStartCall } from '../registration/registrationMachine.ts'
import { applyAgentPresence, applyCallUpdate } from '../supervision/supervisionOverview.ts'

import type { EngineState } from './EngineState.ts'
import type { BackendApi } from '../ports/BackendApi.ts'
import type { CancelTask, Clock } from '../ports/Clock.ts'
import type { Unsubscribe } from '../ports/events.ts'
import type { Logger } from '../ports/Logger.ts'
import type { AgentStatusChange, CallOffer, RealtimeChannel } from '../ports/RealtimeChannel.ts'
import type { SupervisionCallUpdate } from '../supervision/supervisionOverview.ts'

// Lo que el teléfono sabe de la llamada que va a escuchar.
export interface MonitoredCall {
  callId: string
  customer: string
  agentName: string | null
}

export interface SupervisionControllerDependencies {
  state: EngineState
  backend: BackendApi
  realtime: RealtimeChannel
  clock: Clock
  logger: Logger
  // Contesta la llamada de escucha (CallController.answerMonitor).
  answerMonitor: (monitored: MonitoredCall) => void
  // Una entrante que al final no era la escucha suena como cualquier otra
  // (CallController.handleIncoming).
  ringIncoming: (from: string) => void
}

// Si la entrante de Twilio llega antes que el `call.offered` del hub, se espera el aviso este tiempo
// sin que suene; después se trata como una entrante normal (DECISIONES.md, supervisión #6).
export const MONITOR_OFFER_WAIT_MS = 5_000

// Si One-Desk aceptó la escucha pero la llamada no llega (por ejemplo, Twilio no la pudo hacer), se
// deja de esperarla pasado este tiempo, algo más que el timbre de One-Desk (20 s), para poder pedir
// otra.
export const MONITOR_ANSWER_WAIT_MS = 30_000

interface PendingMonitor {
  callId: string
  // Llega con `call.offered`.
  legCallSid: string | null
  customer: string | null
}

interface DeferredIncoming {
  callSid: string | null
  from: string
  cancel: CancelTask
}

// Supervisión en la pestaña líder (R4): mantiene la vista general al día con el hub y lleva la
// escucha de una llamada (endpoints 13, 14 y 16 de One-Desk).
//
// Escuchar es una llamada entrante más: One-Desk la hace a este teléfono y avisa por el hub con su
// CallSid (`call.offered`, `kind = "monitor"`). Esa entrante se contesta sola, sin timbre. Las demás
// siguen su camino: mientras el supervisor escucha está `on_call` y One-Desk no le ofrece otras.
export class SupervisionController {
  private readonly deps: SupervisionControllerDependencies
  private readonly subscriptions: Unsubscribe[]
  private pending: PendingMonitor | null = null
  private cancelPendingExpiry: CancelTask | null = null
  private deferred: DeferredIncoming | null = null
  // Una carga atrasada (de antes de Salir o de otra conexión) no pisa la más reciente.
  private loadCycle = 0

  constructor(deps: SupervisionControllerDependencies) {
    this.deps = deps
    this.subscriptions = [
      deps.realtime.on('supervisionCallUpdated', (update) => this.handleCallUpdate(update)),
      deps.realtime.on('agentStatusChanged', (change) => this.handleAgentStatus(change)),
      deps.realtime.on('callOffered', (offer) => this.handleOffer(offer)),
    ]
  }

  // Carga la vista general si el agente supervisa. Se llama cada vez que conecta el hub: lo que
  // cambió mientras estaba caído no llega por él.
  async load(): Promise<void> {
    const { session } = this.deps.state.snapshot
    if (session.status !== 'active' || !canSupervise(session.agent.role)) return
    this.loadCycle += 1
    const cycle = this.loadCycle
    try {
      const overview = await this.deps.backend.getSupervisionOverview()
      if (cycle === this.loadCycle) this.deps.state.patch({ supervision: overview })
    } catch (error) {
      // El panel se queda con lo que tenía; se vuelve a cargar con la siguiente conexión del hub.
      this.deps.logger.warn('Supervision overview unavailable', {
        code: asSoftphoneError(error, 'backend').code,
      })
    }
  }

  // Salir o dejar de ser líder.
  clear(): void {
    this.loadCycle += 1
    this.forgetPending()
    this.dropDeferred()
    this.deps.state.patch({ supervision: null })
  }

  dispose(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe()
    this.forgetPending()
    this.dropDeferred()
  }

  // Botón Escuchar del panel. Solo con el teléfono libre y registrado, y una escucha a la vez.
  async startMonitoring(callId: string): Promise<void> {
    const { session, call, registration } = this.deps.state.snapshot
    if (session.status !== 'active' || !canSupervise(session.agent.role)) return
    if (call.status !== 'idle' || !canStartCall(registration) || this.pending !== null) return

    const pending: PendingMonitor = { callId, legCallSid: null, customer: null }
    this.pending = pending
    this.deps.state.patch({ pendingMonitor: callId })
    try {
      await this.deps.backend.startMonitoring(callId)
      if (this.pending === pending) {
        this.cancelPendingExpiry = this.deps.clock.schedule(MONITOR_ANSWER_WAIT_MS, () => {
          this.deps.logger.warn('Monitor call did not arrive', { callId })
          this.forgetPending()
        })
      }
    } catch (error) {
      if (this.pending !== pending) return
      this.forgetPending()
      const failure = asSoftphoneError(error, 'backend')
      this.deps.state.patch({ error: { code: failure.code, problem: failure.problem } })
      this.releaseDeferred()
    }
  }

  // Entrante del proveedor. Devuelve true si es la escucha pedida (y ya se ha contestado) o si puede
  // serlo y se espera al `call.offered`; false si es una entrante normal.
  claimIncoming(callSid: string | null, from: string): boolean {
    const { pending } = this
    if (pending === null) return false

    if (pending.legCallSid !== null) {
      // Un proveedor que no da el CallSid: con la escucha pedida, la entrante es la escucha.
      if (callSid !== null && callSid !== pending.legCallSid) return false
      this.answer(pending)
      return true
    }

    this.dropDeferred()
    this.deferred = {
      callSid,
      from,
      cancel: this.deps.clock.schedule(MONITOR_OFFER_WAIT_MS, () => {
        this.deps.logger.warn('Monitor offer did not arrive', { callId: pending.callId })
        this.deferred = null
        this.forgetPending()
        this.deps.ringIncoming(from)
      }),
    }
    return true
  }

  // La entrante que esperaba el aviso se ha cancelado (`cancelled` del proveedor).
  handleIncomingEnded(): void {
    this.dropDeferred()
  }

  private handleOffer(offer: CallOffer): void {
    const { pending } = this
    if (offer.kind !== 'monitor' || pending === null || offer.callId !== pending.callId) return
    const known: PendingMonitor = {
      ...pending,
      legCallSid: offer.legCallSid,
      customer: offer.customerNumber,
    }
    this.pending = known

    const { deferred } = this
    if (deferred === null) return
    deferred.cancel()
    this.deferred = null
    if (deferred.callSid === null || deferred.callSid === offer.legCallSid) this.answer(known)
    else this.deps.ringIncoming(deferred.from)
  }

  private handleCallUpdate(update: SupervisionCallUpdate): void {
    const { supervision } = this.deps.state.snapshot
    if (supervision === null) return
    this.deps.state.patch({ supervision: applyCallUpdate(supervision, update) })
  }

  // El aviso trae el id del motivo de pausa; la vista enseña su nombre, como el endpoint 13.
  private handleAgentStatus({ agentId, presence }: AgentStatusChange): void {
    const { supervision, pauseReasons } = this.deps.state.snapshot
    if (supervision === null) return
    const reasonName =
      presence.pauseReasonId === null
        ? null
        : (pauseReasons.find((reason) => reason.id === presence.pauseReasonId)?.name ?? null)
    this.deps.state.patch({
      supervision: applyAgentPresence(supervision, agentId, presence, reasonName),
    })
  }

  private answer(pending: PendingMonitor): void {
    this.forgetPending()
    const activeCall = this.deps.state.snapshot.supervision?.activeCalls.find(
      (call) => call.id === pending.callId,
    )
    this.deps.answerMonitor({
      callId: pending.callId,
      customer: pending.customer ?? activeCall?.customerNumber ?? '',
      agentName: activeCall?.agent?.fullName ?? null,
    })
  }

  // La escucha falló antes de llegar: la entrante que esperaba suena como cualquier otra.
  private releaseDeferred(): void {
    const { deferred } = this
    if (deferred === null) return
    deferred.cancel()
    this.deferred = null
    this.deps.ringIncoming(deferred.from)
  }

  private dropDeferred(): void {
    this.deferred?.cancel()
    this.deferred = null
  }

  private forgetPending(): void {
    this.cancelPendingExpiry?.()
    this.cancelPendingExpiry = null
    if (this.pending === null) return
    this.pending = null
    this.deps.state.patch({ pendingMonitor: null })
  }
}
