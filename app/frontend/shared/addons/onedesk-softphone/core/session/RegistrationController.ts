// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { asSoftphoneError, SoftphoneError } from '../ports/SoftphoneError.ts'
import {
  transitionRegistration,
  type RegistrationEvent,
} from '../registration/registrationMachine.ts'
import { retriesAutomatically, retryDelayMs } from '../registration/retryPolicy.ts'

import type { EngineState } from './EngineState.ts'
import type { ProviderHandle } from './ProviderHandle.ts'
import type { BackendApi } from '../ports/BackendApi.ts'
import type { CancelTask, Clock } from '../ports/Clock.ts'
import type { Logger } from '../ports/Logger.ts'

export interface RegistrationControllerDependencies {
  state: EngineState
  provider: ProviderHandle
  backend: BackendApi
  clock: Clock
  logger: Logger
}

// Registro del dispositivo en la pestaña líder (architecture.md §6.1 y §8.3): pide el token, registra
// el proveedor, reintenta con espera creciente y renueva el token antes de que caduque. El estado
// lo decide la máquina de registro; aquí solo se hacen las peticiones y se le pasan los eventos.
export class RegistrationController {
  private readonly deps: RegistrationControllerDependencies
  // Hay un registro pedido (y no una baja): solo entonces una caída del dispositivo se reintenta.
  private active = false
  private cancelScheduled: CancelTask | null = null
  private renewalAttempt = 0
  // Cada registro o baja abre un ciclo nuevo. Una respuesta que llega de un ciclo anterior (por
  // ejemplo, un token pedido antes de pulsar Salir) se descarta.
  private cycle = 0
  private unregistering = false

  constructor(deps: RegistrationControllerDependencies) {
    this.deps = deps
  }

  // Empieza de cero: lo pide la sesión al abrirse o el botón de reintentar. El token lo emite One-Desk
  // con la identidad de la sesión (endpoint 8).
  register(): void {
    this.cancelPending()
    this.active = true
    this.cycle += 1
    this.apply({ type: 'register' })
    void this.attempt(this.cycle)
  }

  // Baja voluntaria: Salir, cierre de sesión en Zammad o desmontaje del teléfono.
  async unregister(): Promise<void> {
    this.cancelPending()
    this.cycle += 1
    this.active = false

    const provider = this.deps.provider.current()
    if (provider !== null) {
      this.unregistering = true
      try {
        await provider.unregister()
      } catch (error) {
        this.deps.logger.warn('Unregister failed', { code: asSoftphoneError(error).code })
      } finally {
        this.unregistering = false
      }
    }
    this.apply({ type: 'unregistered' })
  }

  // Eventos del proveedor.

  handleRegistered(): void {
    this.renewalAttempt = 0
    this.apply({ type: 'registered' })
  }

  // Si nadie ha pedido la baja, el dispositivo se ha caído: se trata como un fallo para reintentar.
  handleUnregistered(): void {
    if (this.unregistering || !this.active) {
      this.apply({ type: 'unregistered' })
      return
    }
    this.fail(new SoftphoneError('not-registered', 'Device unregistered unexpectedly'))
  }

  handleTokenWillExpire(): void {
    this.apply({ type: 'token-will-expire' })
    void this.renewToken(this.cycle)
  }

  handleTokenExpired(error: SoftphoneError): void {
    this.fail(error)
  }

  private async attempt(cycle: number): Promise<void> {
    if (!this.active) return
    try {
      const token = await this.deps.backend.getVoiceToken()
      if (cycle !== this.cycle) return
      const provider = await this.deps.provider.ensure()
      if (cycle !== this.cycle) return
      await provider.register(token)
    } catch (error) {
      if (cycle === this.cycle) this.fail(asSoftphoneError(error))
    }
  }

  // Si la renovación falla, el dispositivo sigue registrado con el token anterior: se reintenta con
  // la misma espera creciente, salvo que el token ya haya caducado (DECISIONES.md, esqueleto #7).
  private async renewToken(cycle: number): Promise<void> {
    if (!this.active) return
    try {
      const token = await this.deps.backend.getVoiceToken()
      if (cycle !== this.cycle) return
      this.deps.provider.current()?.updateToken(token)
      this.renewalAttempt = 0
      this.apply({ type: 'token-renewed' })
    } catch (error) {
      if (cycle !== this.cycle) return
      const failure = asSoftphoneError(error)
      if (failure.code === 'token-expired') {
        this.fail(failure)
        return
      }
      this.deps.logger.warn('Token renewal failed', { code: failure.code })
      this.renewalAttempt += 1
      this.schedule(retryDelayMs(this.renewalAttempt), () => void this.renewToken(cycle))
    }
  }

  private fail(error: SoftphoneError): void {
    this.deps.logger.warn('Registration failed', { code: error.code })
    this.apply({ type: 'failed', code: error.code })

    const { registration } = this.deps.state.snapshot
    if (registration.status !== 'error' || !retriesAutomatically(registration.code)) return

    const { cycle } = this
    this.schedule(retryDelayMs(registration.attempt), () => {
      this.apply({ type: 'retry' })
      void this.attempt(cycle)
    })
  }

  private schedule(delayMs: number, task: () => void): void {
    this.cancelPending()
    this.cancelScheduled = this.deps.clock.schedule(delayMs, () => {
      this.cancelScheduled = null
      task()
    })
  }

  private cancelPending(): void {
    this.cancelScheduled?.()
    this.cancelScheduled = null
  }

  private apply(event: RegistrationEvent): void {
    const { registration } = this.deps.state.snapshot
    this.deps.state.patch({ registration: transitionRegistration(registration, event) })
  }
}
