// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { Subscribable } from './events.ts'
import type { SoftphoneError } from './SoftphoneError.ts'
import type { AgentPresence } from '../agent/agentStatus.ts'
import type { SupervisionCallUpdate } from '../supervision/supervisionOverview.ts'

// Cambio de estado de un agente, propio o de un compañero.
export interface AgentStatusChange {
  agentId: number
  presence: AgentPresence
}

// Aviso `call.offered`: One-Desk va a llamar a este teléfono. `legCallSid` es el CallSid de esa
// llamada en el proveedor. `assignment` (P1) y `transfer` (endpoint 12) suenan como siempre; `monitor`
// (endpoint 14) la contesta el teléfono solo.
export interface CallOffer {
  callId: string
  legCallSid: string
  kind: 'assignment' | 'transfer' | 'monitor'
  customerNumber: string
}

export interface RealtimeEventMap {
  agentStatusChanged: AgentStatusChange
  callOffered: CallOffer
  // Solo llega a `supervisor` y `admin` (grupo `supervisors` del hub).
  supervisionCallUpdated: SupervisionCallUpdate
  // La conexión se ha cortado y el adaptador está intentando recuperarla solo.
  reconnecting: undefined
  // El adaptador ha recuperado solo una conexión que se había cortado.
  reconnected: undefined
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
