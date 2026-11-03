// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { AgentSettings } from './agentSettings.ts'
import type { CallState } from '../call/callMachine.ts'

export type IncomingCallDecision =
  | { action: 'reject'; reason: 'busy' }
  | { action: 'answer' }
  | { action: 'ring'; withRingtone: boolean }

// Qué hacer con una entrante según el estado del teléfono y los ajustes del agente (inventario
// §1.2). A quién se ofrece la llamada lo decide One-Desk: un agente en pausa no la recibe.
export const decideIncomingCall = (
  call: CallState,
  settings: AgentSettings,
): IncomingCallDecision => {
  // Una segunda llamada con otra en curso se rechaza, como hoy (architecture.md §6.4).
  if (call.status !== 'idle') return { action: 'reject', reason: 'busy' }
  if (settings.autoAnswer) return { action: 'answer' }
  return { action: 'ring', withRingtone: !settings.ringMuted }
}
