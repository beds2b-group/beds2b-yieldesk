// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Estado del agente en One-Desk. `reserved`, `on-call` y `wrap-up` los pone el servidor; el agente
// solo pide `available`, `paused` (con motivo) u `offline` (endpoint 10).
export type AgentStatus = 'offline' | 'available' | 'reserved' | 'on-call' | 'wrap-up' | 'paused'

export interface AgentPresence {
  status: AgentStatus
  pauseReasonId: number | null
  // Momento (epoch ms) desde el que el agente está en este estado, si se conoce.
  since: number | null
}

// Motivos de pausa activos en One-Desk, en el orden en que se muestran (DECISIONES.md, diseño #1).
export interface PauseReason {
  id: number
  name: string
  icon: string | null
}

export type StatusChange =
  | { status: 'available' }
  | { status: 'paused'; pauseReasonId: number }
  | { status: 'offline' }

// Con una llamada reservada o en curso, One-Desk rechaza cualquier cambio manual (409 agent_busy):
// la interfaz deshabilita la pausa en vez de dejar que el agente choque con el error.
export const canChangeStatusManually = (status: AgentStatus): boolean =>
  status !== 'reserved' && status !== 'on-call'
