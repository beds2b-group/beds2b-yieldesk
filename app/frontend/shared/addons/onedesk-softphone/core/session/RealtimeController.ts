// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { asSoftphoneError } from '../ports/SoftphoneError.ts'
import { retryDelayMs } from '../registration/retryPolicy.ts'

import type { EngineState } from './EngineState.ts'
import type { BackendApi } from '../ports/BackendApi.ts'
import type { CancelTask, Clock } from '../ports/Clock.ts'
import type { Unsubscribe } from '../ports/events.ts'
import type { Logger } from '../ports/Logger.ts'
import type { AgentStatusChange, RealtimeChannel } from '../ports/RealtimeChannel.ts'
import type { SoftphoneErrorCode } from '../ports/SoftphoneError.ts'

export interface RealtimeControllerDependencies {
  state: EngineState
  realtime: RealtimeChannel
  backend: BackendApi
  clock: Clock
  logger: Logger
}

// Canal en tiempo real de la pestaña líder (ENDPOINTS_MVP.md §18): se abre con la sesión, se
// mantiene abierto mientras dure y aplica al teléfono los cambios de estado que hace One-Desk por su
// cuenta (Offline → Paused al conectar, WrapUp al colgar, Offline por desconexión…).
//
// Sin este canal One-Desk da el teléfono por cerrado a los 30 s y no le ofrece llamadas, así que no
// se rinde nunca: reintenta con espera creciente, como el registro.
export class RealtimeController {
  private readonly deps: RealtimeControllerDependencies
  private readonly subscriptions: Unsubscribe[]
  private cancelScheduled: CancelTask | null = null
  // Como en la sesión y el registro: lo que llega de un ciclo anterior (antes de Salir o de dejar de
  // ser líder) se descarta.
  private cycle = 0
  private running = false

  constructor(deps: RealtimeControllerDependencies) {
    this.deps = deps
    this.subscriptions = [
      deps.realtime.on('agentStatusChanged', (change) => this.handleStatusChange(change)),
      deps.realtime.on('closed', (error) => this.handleClosed(error?.code ?? null)),
    ]
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.cycle += 1
    void this.attempt(this.cycle, 1, false)
  }

  // Salir o dejar de ser líder. Al cerrar la conexión, One-Desk empieza a contar la desconexión.
  async stop(): Promise<void> {
    this.cancelPending()
    this.cycle += 1
    if (!this.running) return
    this.running = false
    try {
      await this.deps.realtime.disconnect()
    } catch (error) {
      this.deps.logger.warn('Realtime disconnect failed', { code: asSoftphoneError(error).code })
    }
  }

  async dispose(): Promise<void> {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe()
    await this.stop()
  }

  // `renewSession`: el intento anterior falló porque One-Desk ya no reconocía la sesión. Se abre
  // otra con la cookie de Zammad antes de volver a conectar, como hace OneDeskBackend con REST.
  private async attempt(cycle: number, attempt: number, renewSession: boolean): Promise<void> {
    try {
      if (renewSession) await this.deps.backend.startSession()
      if (cycle !== this.cycle) return
      await this.deps.realtime.connect()
      if (cycle !== this.cycle) {
        // Se pulsó Salir mientras conectaba: la conexión que acaba de abrirse sobra.
        if (!this.running) await this.deps.realtime.disconnect()
        return
      }
      this.deps.logger.info('Realtime channel connected', { attempt })
    } catch (error) {
      if (cycle === this.cycle) this.retry(asSoftphoneError(error, 'network').code, cycle, attempt)
    }
  }

  private handleClosed(code: SoftphoneErrorCode | null): void {
    if (!this.running) return
    this.cycle += 1
    this.retry(code ?? 'network', this.cycle, 0)
  }

  private retry(code: SoftphoneErrorCode, cycle: number, failedAttempt: number): void {
    this.deps.logger.warn('Realtime channel unavailable', { code, attempt: failedAttempt })
    this.cancelPending()
    // Tras una caída se reconecta enseguida; tras un intento fallido, con espera creciente.
    const delay = failedAttempt === 0 ? 0 : retryDelayMs(failedAttempt)
    this.cancelScheduled = this.deps.clock.schedule(delay, () => {
      this.cancelScheduled = null
      void this.attempt(cycle, failedAttempt + 1, code === 'unauthenticated')
    })
  }

  // One-Desk avisa de los cambios de todos los agentes; aquí solo interesa el del propio agente. Un
  // aviso más antiguo que el estado que ya se tiene (por ejemplo, la respuesta del endpoint 10 llegó
  // antes) se descarta.
  private handleStatusChange({ agentId, presence }: AgentStatusChange): void {
    const { session, presence: current } = this.deps.state.snapshot
    if (session.status !== 'active' || session.agent.id !== agentId) return
    const currentSince = current?.since ?? null
    if (currentSince !== null && presence.since !== null && presence.since < currentSince) return
    this.deps.state.patch({ presence })
  }

  private cancelPending(): void {
    this.cancelScheduled?.()
    this.cancelScheduled = null
  }
}
