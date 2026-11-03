// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { EventEmitter, type Unsubscribe } from '../../core/ports/events.ts'

import { isTabMessage, type TabMessage } from './tabMessages.ts'

import type { Logger } from '../../core/ports/Logger.ts'
import type { TabCoordinator, TabRole } from '../../core/ports/TabCoordinator.ts'

const LEADER_LOCK = 'onedesk-softphone:leader'
const CHANNEL_NAME = 'onedesk-softphone:tabs'

interface CoordinatorEvents<TState, TCommand> {
  role: TabRole
  state: TState
  command: TCommand
}

export interface WebLocksTabCoordinatorOptions {
  locks: LockManager
  openChannel: (name: string) => BroadcastChannel
  logger: Logger
}

// Coordinación entre pestañas (ADR-007). La pestaña que obtiene el bloqueo exclusivo es la líder y
// lo conserva hasta destroy() o hasta que se cierra; el navegador lo libera aunque la pestaña se
// cierre de golpe, y entonces lo recibe la siguiente que lo esperaba. Las réplicas reciben la foto
// de la líder y le envían órdenes por BroadcastChannel.
export class WebLocksTabCoordinator<TState, TCommand> implements TabCoordinator<TState, TCommand> {
  private readonly options: WebLocksTabCoordinatorOptions
  private readonly channel: BroadcastChannel
  private readonly events = new EventEmitter<CoordinatorEvents<TState, TCommand>>()
  private readonly abortWaiting = new AbortController()
  private releaseLeadership: () => void = () => {}
  private currentRole: TabRole = 'replica'
  private lastState: TState | null = null
  private destroyed = false

  private constructor(options: WebLocksTabCoordinatorOptions) {
    this.options = options
    this.channel = options.openChannel(CHANNEL_NAME)
    this.channel.addEventListener('message', (event) => this.receive(event.data))
  }

  // Se resuelve cuando se conoce el rol inicial, para que el engine arranque ya con el correcto.
  static async connect<TState, TCommand>(
    options: WebLocksTabCoordinatorOptions,
  ): Promise<WebLocksTabCoordinator<TState, TCommand>> {
    const coordinator = new WebLocksTabCoordinator<TState, TCommand>(options)
    await coordinator.claimLeadership()
    return coordinator
  }

  get role(): TabRole {
    return this.currentRole
  }

  onRoleChange(listener: (role: TabRole) => void): Unsubscribe {
    return this.events.on('role', listener)
  }

  publishState(snapshot: TState): void {
    this.lastState = snapshot
    if (this.currentRole === 'leader') this.post({ kind: 'state', snapshot })
  }

  onState(listener: (snapshot: TState) => void): Unsubscribe {
    return this.events.on('state', listener)
  }

  sendCommand(command: TCommand): void {
    this.post({ kind: 'command', command })
  }

  onCommand(listener: (command: TCommand) => void): Unsubscribe {
    return this.events.on('command', listener)
  }

  destroy(): void {
    this.destroyed = true
    this.abortWaiting.abort()
    this.releaseLeadership()
    this.channel.close()
    this.events.clear()
  }

  // Primero se pide el bloqueo sin esperar, para saber el rol enseguida. Si otra pestaña es la
  // líder, esta se queda como réplica y se pone en cola para sucederla.
  private claimLeadership(): Promise<void> {
    return new Promise((roleKnown) => {
      void this.options.locks.request(LEADER_LOCK, { ifAvailable: true }, (lock) => {
        if (lock === null) {
          roleKnown()
          this.waitForLeadership()
          return undefined
        }
        const held = this.becomeLeader()
        roleKnown()
        return held
      })
    })
  }

  private waitForLeadership(): void {
    this.post({ kind: 'state-request' })
    this.options.locks
      .request(LEADER_LOCK, { signal: this.abortWaiting.signal }, () =>
        this.destroyed ? undefined : this.becomeLeader(),
      )
      .catch((error: unknown) => {
        // AbortError al destruir mientras se esperaba: es lo previsto.
        if (!this.destroyed) this.options.logger.warn('Leader lock request failed', { error })
      })
  }

  // Devuelve la promesa que mantiene el bloqueo: se resuelve en destroy().
  private becomeLeader(): Promise<void> {
    const held = new Promise<void>((release) => {
      this.releaseLeadership = release
    })
    this.currentRole = 'leader'
    this.events.emit('role', 'leader')
    return held
  }

  private receive(data: unknown): void {
    if (!isTabMessage<TState, TCommand>(data)) {
      this.options.logger.warn('Ignoring an unknown tab message')
      return
    }
    switch (data.kind) {
      case 'state':
        if (this.currentRole === 'replica') this.events.emit('state', data.snapshot)
        return
      case 'command':
        if (this.currentRole === 'leader') this.events.emit('command', data.command)
        return
      case 'state-request':
        if (this.currentRole === 'leader' && this.lastState !== null) {
          this.post({ kind: 'state', snapshot: this.lastState })
        }
        return
      default:
        data satisfies never
    }
  }

  private post(message: TabMessage<TState, TCommand>): void {
    if (!this.destroyed) this.channel.postMessage(message)
  }
}
