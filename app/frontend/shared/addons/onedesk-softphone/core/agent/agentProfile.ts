// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Agente de la sesión de One-Desk (endpoint 7). El rol decide qué ve el teléfono.
export type AgentRole = 'agent' | 'supervisor' | 'admin'

export interface AgentProfile {
  id: number
  fullName: string
  extension: string
  role: AgentRole
}

// En la supervisión, `admin` tiene los mismos permisos que `supervisor` (DECISIONES.md,
// supervisión #1): los dos ven el panel.
export const canSupervise = (role: AgentRole): boolean => role !== 'agent'
