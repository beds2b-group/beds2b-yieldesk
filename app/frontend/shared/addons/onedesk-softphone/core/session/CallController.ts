// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { decideIncomingCall } from '../agent/incomingCallPolicy.ts'
import { availableCallActions, type CallAction } from '../call/callActions.ts'
import { transitionCall, type CallEvent } from '../call/callMachine.ts'
import { asSoftphoneError, SoftphoneError } from '../ports/SoftphoneError.ts'

import type { EngineState } from './EngineState.ts'
import type { ProviderHandle } from './ProviderHandle.ts'
import type { DtmfDigit } from '../call/dtmf.ts'
import type { TransferTarget } from '../call/transferTarget.ts'
import type { BackendApi } from '../ports/BackendApi.ts'
import type { Clock } from '../ports/Clock.ts'
import type { Logger } from '../ports/Logger.ts'
import type { Notifier } from '../ports/Notifier.ts'
import type { SoundPlayer } from '../ports/SoundPlayer.ts'

export interface CallControllerDependencies {
  state: EngineState
  provider: ProviderHandle
  backend: BackendApi
  sounds: SoundPlayer
  notifier: Notifier
  clock: Clock
  logger: Logger
}

// Llamadas en la pestaña líder (architecture.md §6.2 y §6.3). Cada orden se comprueba contra las
// acciones habilitadas en el estado actual: una orden atrasada de otra pestaña, o un doble clic, no
// llega al proveedor. El estado lo decide la máquina de llamada.
export class CallController {
  private readonly deps: CallControllerDependencies
  // Una petición de espera a la vez: un doble clic no manda la segunda.
  private holdRequestPending = false

  constructor(deps: CallControllerDependencies) {
    this.deps = deps
  }

  // Órdenes del agente.

  dial(to: string): void {
    const number = to.trim()
    if (number === '' || !this.allows('dial')) return

    const provider = this.deps.provider.current()
    if (provider === null) {
      this.report(new SoftphoneError('not-registered', 'No provider to place the call'))
      return
    }
    this.apply({ type: 'dial', to: number })
    this.deps.state.patch({ lastDialed: number })
    provider.call(number).catch((error: unknown) => {
      this.report(asSoftphoneError(error))
      this.apply({ type: 'failed' })
    })
  }

  redial(): void {
    const { lastDialed } = this.deps.state.snapshot
    if (lastDialed !== null && this.allows('redial')) this.dial(lastDialed)
  }

  answer(): void {
    if (!this.allows('answer')) return
    this.deps.provider.current()?.answer()
    this.apply({ type: 'answer', at: this.deps.clock.now() })
  }

  reject(): void {
    if (!this.allows('reject')) return
    this.deps.provider.current()?.reject()
    this.apply({ type: 'reject' })
  }

  hangup(): void {
    if (!this.allows('hangup')) return
    this.deps.provider.current()?.hangup()
    this.apply({ type: 'hangup' })
  }

  setMuted(muted: boolean): void {
    if (!this.allows('mute')) return
    this.deps.provider.current()?.setMuted(muted)
    this.apply({ type: 'mute-changed', muted })
  }

  // La tecla suena siempre, también al escribir el número; en llamada se envía además como DTMF.
  pressKey(digit: DtmfDigit): void {
    this.deps.sounds.play(`dtmf-${digit}`)
    if (this.allows('dtmf')) this.deps.provider.current()?.sendDigits(digit)
  }

  // Transferencia a un compañero o a un número externo (architecture.md §6.3, endpoint 12). One-Desk
  // responde enseguida y
  // el agente sigue hablando hasta que el destino contesta; entonces One-Desk lo saca y llega
  // `disconnected`. Si suena sin contestar, One-Desk cancela el tramo y llega `cancelled`. Mientras,
  // la transferencia queda pendiente y no se puede pedir otra (callActions). Si falla, la llamada
  // sigue y se muestra el motivo. Si sonaba, el timbre se calla al pedirla y vuelve si falla
  // (DECISIONES.md, transferencia #5).
  async transfer(target: TransferTarget): Promise<void> {
    const { session } = this.deps.state.snapshot
    if (!this.allows('transfer') || session.status !== 'active') return
    if ('agentId' in target && target.agentId === session.agent.id) return

    this.deps.state.patch({ pendingTransfer: { target } })
    const ringing = this.deps.state.snapshot.call.status === 'incoming'
    if (ringing) this.deps.sounds.stop('incoming')
    try {
      await this.deps.backend.transferCurrentCall(target)
    } catch (error) {
      this.deps.state.patch({ pendingTransfer: null })
      this.report(asSoftphoneError(error, 'backend'))
      const { call, settings } = this.deps.state.snapshot
      if (ringing && call.status === 'incoming' && !settings.ringMuted) {
        this.deps.sounds.play('incoming', { loop: true })
      }
    }
  }

  // Espera del cliente (endpoints 19 y 20). La espera la lleva One-Desk, no el proveedor: el estado
  // cambia cuando One-Desk la confirma, con su `heldAt`. Si responde que ya estaba así (se adelantó
  // otra petición), se toma ese estado sin mostrar error. Si falla, la llamada sigue como estaba.
  async hold(): Promise<void> {
    await this.changeHold(true)
  }

  async resume(): Promise<void> {
    await this.changeHold(false)
  }

  // Supervisión. La llamada de escucha la contesta el teléfono solo, sin timbre ni aviso
  // (endpoint 14): la reconoce SupervisionController por su CallSid.
  answerMonitor(monitored: { callId: string; customer: string; agentName: string | null }): void {
    if (this.deps.state.snapshot.call.status !== 'idle') return
    this.deps.provider.current()?.answer()
    this.apply({ type: 'monitor-answered', ...monitored, at: this.deps.clock.now() })
  }

  // Salir de la escucha: One-Desk saca al supervisor de la conferencia (endpoint 16) y el proveedor
  // suelta la línea. Si One-Desk no responde, se cuelga desde aquí, que tiene el mismo efecto.
  async leaveMonitoring(stop: (callId: string) => Promise<void>): Promise<void> {
    const { call } = this.deps.state.snapshot
    if (call.status !== 'monitoring' || !this.allows('stop-monitoring')) return
    this.apply({ type: 'hangup' })
    try {
      await stop(call.callId)
    } catch (error) {
      this.deps.logger.warn('Stop monitoring failed, hanging up', {
        code: asSoftphoneError(error, 'backend').code,
      })
      this.deps.provider.current()?.hangup()
    }
  }

  // Termina lo que haya en curso antes de Salir o de desmontar el teléfono (architecture.md §8.3).
  endActiveCall(): void {
    if (this.allows('reject')) this.reject()
    else if (this.allows('hangup')) this.hangup()
    else if (this.deps.state.snapshot.call.status === 'monitoring') {
      // Al colgar, One-Desk devuelve al supervisor a su estado anterior (endpoints 14 y 16 #5).
      this.deps.provider.current()?.hangup()
      this.apply({ type: 'hangup' })
    }
  }

  // Eventos del proveedor.

  handleIncoming(from: string): void {
    const decision = decideIncomingCall(
      this.deps.state.snapshot.call,
      this.deps.state.snapshot.settings,
    )
    switch (decision.action) {
      case 'reject':
        this.deps.logger.info('Incoming call rejected', { reason: decision.reason })
        this.deps.provider.current()?.reject()
        return
      case 'answer':
        this.apply({ type: 'incoming', from })
        this.answer()
        return
      case 'ring':
        this.apply({ type: 'incoming', from })
        if (decision.withRingtone) this.deps.sounds.play('incoming', { loop: true })
        this.deps.notifier.notifyIncomingCall(from)
        return
      default:
        decision satisfies never
    }
  }

  handleAccepted(): void {
    this.apply({ type: 'accepted', at: this.deps.clock.now() })
  }

  handleDisconnected(): void {
    this.apply({ type: 'disconnected' })
  }

  handleCancelled(): void {
    this.apply({ type: 'cancelled' })
  }

  // Un fallo durante una saliente la termina; en cualquier caso, el agente ve el motivo.
  handleError(error: SoftphoneError): void {
    this.report(error)
    this.apply({ type: 'failed' })
  }

  private async changeHold(onHold: boolean): Promise<void> {
    const { call } = this.deps.state.snapshot
    if (this.holdRequestPending || call.status !== 'in-call') return
    if (!this.allows(onHold ? 'hold' : 'resume')) return

    const { startedAt } = call
    this.holdRequestPending = true
    try {
      if (onHold) {
        this.applyHold(startedAt, await this.deps.backend.holdCurrentCall())
      } else {
        await this.deps.backend.resumeCurrentCall()
        this.applyHold(startedAt, null)
      }
    } catch (error) {
      const failure = asSoftphoneError(error, 'backend')
      // El `heldAt` real no viene en el 409: se cuenta desde ahora.
      if (failure.problem === 'already_on_hold') this.applyHold(startedAt, this.deps.clock.now())
      else if (failure.problem === 'not_on_hold') this.applyHold(startedAt, null)
      else this.report(failure)
    } finally {
      this.holdRequestPending = false
    }
  }

  // Solo si sigue siendo la misma llamada: pudo terminar mientras One-Desk respondía.
  private applyHold(startedAt: number, heldAt: number | null): void {
    const { call } = this.deps.state.snapshot
    if (call.status === 'in-call' && call.startedAt === startedAt) {
      this.apply({ type: 'hold-changed', heldAt })
    }
  }

  private apply(event: CallEvent): void {
    const previous = this.deps.state.snapshot.call
    const next = transitionCall(previous, event)
    if (next === previous) return

    // Al terminar la llamada, cualquier transferencia pendiente termina con ella.
    this.deps.state.patch(
      next.status === 'idle' ? { call: next, pendingTransfer: null } : { call: next },
    )
    if (previous.status === 'incoming' && next.status !== 'incoming') {
      this.deps.sounds.stop('incoming')
      this.deps.notifier.dismissIncomingCall()
    }
  }

  private allows(action: CallAction): boolean {
    const { call, registration, lastDialed, pendingTransfer } = this.deps.state.snapshot
    return availableCallActions({
      call,
      registration,
      hasLastDialed: lastDialed !== null,
      transferPending: pendingTransfer !== null,
    }).has(action)
  }

  private report(error: SoftphoneError): void {
    this.deps.logger.warn('Call error', { code: error.code })
    this.deps.state.patch({ error: { code: error.code, problem: error.problem } })
  }
}
