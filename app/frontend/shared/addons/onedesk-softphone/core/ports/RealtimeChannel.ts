// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { Subscribable } from './events.ts'
import type { SoftphoneError } from './SoftphoneError.ts'
import type { AgentPresence } from '../agent/agentStatus.ts'

// Cambio de estado de un agente, propio o de un compañero.
export interface AgentStatusChange {
  agentId: number
  presence: AgentPresence
}

export interface RealtimeEventMap {
  agentStatusChanged: AgentStatusChange
  // La conexión se ha perdido y el adaptador ya no la recupera solo. Llega con el fallo, si lo hay.
  closed: SoftphoneError | null
}

// Canal en tiempo real con el servidor (hub de One-Desk, ENDPOINTS_MVP.md §18). Mientras está
// abierto, One-Desk sabe que el teléfono sigue en la página: si se cierra, pasa al agente a `offline`
// y deja de ofrecerle llamadas. Lo abre solo la pestaña líder, con la sesión ya abierta.
export interface RealtimeChannel extends Subscribable<RealtimeEventMap> {
  // Falla con SoftphoneError: `unauthenticated` si la sesión de One-Desk ya no vale, `forbidden` si
  // el agente está desactivado y `network` en lo demás.
  connect(): Promise<void>
  disconnect(): Promise<void>
}
