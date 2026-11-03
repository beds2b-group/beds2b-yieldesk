// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { EventEmitter, type Listener, type Unsubscribe } from '../ports/events.ts'

import { INITIAL_SNAPSHOT, type SoftphoneSnapshot } from './snapshot.ts'

import type { EngineCommand } from './commands.ts'
import type { EngineTabCoordinator, SoftphoneEngine } from './SoftphoneEngine.ts'
import type { AgentSummary, BackendApi } from '../ports/BackendApi.ts'

interface ReplicaEvents {
  change: SoftphoneSnapshot
}

export interface ReplicaEngineDependencies {
  tabs: EngineTabCoordinator
  backend: BackendApi
}

// Engine de una pestaña réplica (architecture.md §5.4, ADR-007): muestra la foto que publica la
// líder y le reenvía las órdenes. No registra ningún dispositivo ni carga el SDK.
export class ReplicaEngine implements SoftphoneEngine {
  readonly tabRole = 'replica'

  private readonly deps: ReplicaEngineDependencies
  private readonly events = new EventEmitter<ReplicaEvents>()
  private readonly unsubscribeState: Unsubscribe
  private current: SoftphoneSnapshot = INITIAL_SNAPSHOT

  constructor(deps: ReplicaEngineDependencies) {
    this.deps = deps
    this.unsubscribeState = deps.tabs.onState((snapshot) => {
      this.current = snapshot
      this.events.emit('change', snapshot)
    })
  }

  get snapshot(): SoftphoneSnapshot {
    return this.current
  }

  subscribe(listener: Listener<SoftphoneSnapshot>): Unsubscribe {
    return this.events.on('change', listener)
  }

  dispatch(command: EngineCommand): void {
    this.deps.tabs.sendCommand(command)
  }

  listAgents(): Promise<readonly AgentSummary[]> {
    return this.deps.backend.listAgents()
  }

  destroy(): Promise<void> {
    this.unsubscribeState()
    this.events.clear()
    return Promise.resolve()
  }
}
