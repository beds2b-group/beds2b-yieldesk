// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { EventEmitter, type Listener, type Unsubscribe } from '../ports/events.ts'

import { LocalEngine, type LocalEngineDependencies } from './LocalEngine.ts'
import { ReplicaEngine } from './ReplicaEngine.ts'

import type { EngineCommand } from './commands.ts'
import type { SoftphoneSnapshot } from './snapshot.ts'
import type { SoftphoneEngine } from './SoftphoneEngine.ts'
import type { AgentSummary } from '../ports/BackendApi.ts'
import type { HostBridge } from '../ports/HostBridge.ts'
import type { TabRole } from '../ports/TabCoordinator.ts'

interface SwitchingEvents {
  change: SoftphoneSnapshot
}

export interface SoftphoneEngineDependencies extends LocalEngineDependencies {
  host: HostBridge
}

// El engine de cada pestaña según su rol: LocalEngine en la líder y ReplicaEngine en las demás. Si
// la líder se cierra, otra pestaña toma el bloqueo y aquí se cambia de engine sin que la interfaz se
// entere (ADR-007). Las órdenes del widget CTI de Zammad entran por aquí, sea cual sea el rol.
class RoleSwitchingEngine implements SoftphoneEngine {
  private readonly deps: SoftphoneEngineDependencies
  private readonly events = new EventEmitter<SwitchingEvents>()
  private readonly subscriptions: Unsubscribe[] = []
  private engine: SoftphoneEngine
  private unsubscribeEngine: Unsubscribe
  // Los cambios de rol se aplican en orden, aunque lleguen mientras se destruye el engine anterior.
  private switching: Promise<void> = Promise.resolve()

  constructor(deps: SoftphoneEngineDependencies) {
    this.deps = deps
    this.engine = this.createEngine(deps.tabs.role)
    this.unsubscribeEngine = this.follow(this.engine)
    this.subscriptions.push(
      deps.tabs.onRoleChange((role) => {
        this.switching = this.switching.then(() => this.switchTo(role))
      }),
      deps.host.onCommand((command) => this.dispatch({ type: command })),
    )
  }

  get tabRole(): TabRole {
    return this.engine.tabRole
  }

  get snapshot(): SoftphoneSnapshot {
    return this.engine.snapshot
  }

  subscribe(listener: Listener<SoftphoneSnapshot>): Unsubscribe {
    return this.events.on('change', listener)
  }

  dispatch(command: EngineCommand): void {
    this.engine.dispatch(command)
  }

  listAgents(): Promise<readonly AgentSummary[]> {
    return this.engine.listAgents()
  }

  async destroy(): Promise<void> {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe()
    await this.switching
    this.unsubscribeEngine()
    await this.engine.destroy()
    this.deps.tabs.destroy()
    this.events.clear()
  }

  private async switchTo(role: TabRole): Promise<void> {
    if (role === this.engine.tabRole) return

    // Una réplica que pasa a líder respeta el Salir de la líder anterior (DECISIONES.md, diseño #11).
    const signedOut = this.engine.snapshot.session.status === 'signed-out'
    this.unsubscribeEngine()
    await this.engine.destroy()
    this.engine = this.createEngine(role, signedOut)
    this.unsubscribeEngine = this.follow(this.engine)
    this.events.emit('change', this.engine.snapshot)
  }

  private createEngine(role: TabRole, signedOut = false): SoftphoneEngine {
    if (role === 'replica') return new ReplicaEngine(this.deps)
    const engine = new LocalEngine(this.deps)
    engine.start({ signedOut })
    return engine
  }

  private follow(engine: SoftphoneEngine): Unsubscribe {
    return engine.subscribe((snapshot) => this.events.emit('change', snapshot))
  }
}

// Punto de entrada de core/session para las shells (architecture.md §5.4).
export const createSoftphoneEngine = (deps: SoftphoneEngineDependencies): SoftphoneEngine =>
  new RoleSwitchingEngine(deps)
