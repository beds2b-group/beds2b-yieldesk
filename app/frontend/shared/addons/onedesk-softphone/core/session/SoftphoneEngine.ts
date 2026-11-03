// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { EngineCommand } from './commands.ts'
import type { SoftphoneSnapshot } from './snapshot.ts'
import type { AgentSummary } from '../ports/BackendApi.ts'
import type { Listener, Unsubscribe } from '../ports/events.ts'
import type { TabCoordinator, TabRole } from '../ports/TabCoordinator.ts'

// Coordinación entre pestañas con la foto y las órdenes del engine.
export type EngineTabCoordinator = TabCoordinator<SoftphoneSnapshot, EngineCommand>

// Fachada que usa la interfaz (architecture.md §5.4, ADR-001). La interfaz no sabe si su pestaña es
// la líder (LocalEngine) o una réplica (ReplicaEngine): lee la foto, se suscribe y da órdenes.
export interface SoftphoneEngine {
  readonly tabRole: TabRole
  readonly snapshot: SoftphoneSnapshot

  subscribe(listener: Listener<SoftphoneSnapshot>): Unsubscribe
  dispatch(command: EngineCommand): void
  // Consulta sin efectos: cualquier pestaña la hace directamente contra el backend.
  listAgents(): Promise<readonly AgentSummary[]>
  destroy(): Promise<void>
}
