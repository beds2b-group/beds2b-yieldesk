// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Ajustes del agente que viven solo en el navegador (architecture.md §5.3). La pausa es del
// servidor (One-Desk) y no hay DND: la pausa lo sustituye (DECISIONES.md, diseño #4).
export interface AgentSettings {
  // Silencia el timbre de las entrantes, no el micrófono (inventario D3, decisión P8).
  ringMuted: boolean
  autoAnswer: boolean
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  ringMuted: false,
  autoAnswer: false,
}
