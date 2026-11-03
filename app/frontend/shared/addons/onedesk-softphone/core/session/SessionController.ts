// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { canChangeStatusManually, type StatusChange } from '../agent/agentStatus.ts'
import { asSoftphoneError } from '../ports/SoftphoneError.ts'
import { retriesAutomatically, retryDelayMs } from '../registration/retryPolicy.ts'

import type { EngineState } from './EngineState.ts'
import type { BackendApi } from '../ports/BackendApi.ts'
import type { CancelTask, Clock } from '../ports/Clock.ts'
import type { Logger } from '../ports/Logger.ts'
import type { SoftphoneErrorCode } from '../ports/SoftphoneError.ts'

export interface SessionControllerDependencies {
  state: EngineState
  backend: BackendApi
  clock: Clock
  logger: Logger
  // Con la sesión abierta ya se puede pedir el token y registrar el teléfono.
  onActive: () => void
}

// Sesión de One-Desk en la pestaña líder (DECISIONES.md, diseño #11): la abre sola con la cookie de
// Zammad, lee el agente, su estado y los motivos de pausa, reintenta con espera creciente si falla
// y cambia el estado del agente cuando él lo pide.
export class SessionController {
  private readonly deps: SessionControllerDependencies
  private cancelScheduled: CancelTask | null = null
  // Igual que en el registro: una respuesta de un ciclo anterior (por ejemplo, la sesión pedida
  // antes de pulsar Salir) se descarta.
  private cycle = 0

  constructor(deps: SessionControllerDependencies) {
    this.deps = deps
  }

  connect(): void {
    this.cancelPending()
    this.cycle += 1
    this.deps.state.patch({ session: { status: 'connecting' } })
    void this.attempt(this.cycle, 1)
  }

  retry(): void {
    if (this.deps.state.snapshot.session.status === 'failed') this.connect()
  }

  // Salir: el agente pasa a `offline` en One-Desk y el teléfono queda desconectado hasta recargar.
  // Si One-Desk no responde, se sale igualmente: el agente no puede quedarse atrapado.
  async signOut(): Promise<void> {
    const wasActive = this.deps.state.snapshot.session.status === 'active'
    this.dispose()
    if (wasActive) {
      try {
        await this.deps.backend.setStatus({ status: 'offline' })
      } catch (error) {
        this.deps.logger.warn('Could not go offline', { code: asSoftphoneError(error).code })
      }
    }
    this.deps.state.patch({ session: { status: 'signed-out' }, presence: null, pauseReasons: [] })
  }

  async setStatus(change: StatusChange): Promise<void> {
    const { session, presence } = this.deps.state.snapshot
    if (session.status !== 'active') return
    if (presence !== null && !canChangeStatusManually(presence.status)) return

    const { cycle } = this
    try {
      const next = await this.deps.backend.setStatus(change)
      if (cycle === this.cycle) this.deps.state.patch({ presence: next })
    } catch (error) {
      if (cycle !== this.cycle) return
      const failure = asSoftphoneError(error, 'backend')
      this.deps.logger.warn('Status change failed', { code: failure.code })
      this.deps.state.patch({ error: { code: failure.code, problem: failure.problem } })
    }
  }

  // Deja de atender las respuestas pendientes y cancela el reintento programado.
  dispose(): void {
    this.cancelPending()
    this.cycle += 1
  }

  private async attempt(cycle: number, attempt: number): Promise<void> {
    try {
      await this.deps.backend.startSession()
      if (cycle !== this.cycle) return
      const { profile, presence, pauseReasons } = await this.deps.backend.getMe()
      if (cycle !== this.cycle) return
      this.deps.state.patch({
        session: { status: 'active', agent: profile },
        presence,
        pauseReasons,
      })
      this.deps.onActive()
    } catch (error) {
      if (cycle === this.cycle) this.fail(asSoftphoneError(error, 'backend').code, cycle, attempt)
    }
  }

  private fail(code: SoftphoneErrorCode, cycle: number, attempt: number): void {
    this.deps.logger.warn('Session failed', { code })
    this.deps.state.patch({ session: { status: 'failed', code, attempt } })
    if (!retriesAutomatically(code)) return

    this.cancelScheduled = this.deps.clock.schedule(retryDelayMs(attempt), () => {
      this.cancelScheduled = null
      this.deps.state.patch({ session: { status: 'connecting' } })
      void this.attempt(cycle, attempt + 1)
    })
  }

  private cancelPending(): void {
    this.cancelScheduled?.()
    this.cancelScheduled = null
  }
}
