// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { AgentSettings } from '../agent/agentSettings.ts'
import type { StatusChange } from '../agent/agentStatus.ts'
import type { DtmfDigit } from '../call/dtmf.ts'
import type { TransferTarget } from '../call/transferTarget.ts'

// Órdenes que la interfaz (de cualquier pestaña) y Zammad (widget CTI) dan al teléfono. Son datos
// serializables: una réplica las reenvía tal cual a la líder (ADR-007).
export type EngineCommand =
  | { type: 'logout' }
  // Reintenta lo que haya fallado: la sesión o, si la sesión está activa, el registro.
  | { type: 'retry' }
  | { type: 'set-status'; change: StatusChange }
  | { type: 'dial'; to: string }
  | { type: 'redial' }
  | { type: 'answer' }
  | { type: 'reject' }
  | { type: 'hangup' }
  | { type: 'set-muted'; muted: boolean }
  // Una tecla del teclado: suena siempre y, en llamada, se envía como DTMF.
  | { type: 'press-key'; digit: DtmfDigit }
  | { type: 'transfer'; target: TransferTarget }
  | { type: 'update-settings'; settings: Partial<AgentSettings> }
  | { type: 'dismiss-error' }
