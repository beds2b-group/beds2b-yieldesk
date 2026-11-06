// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { DEFAULT_AGENT_SETTINGS, type AgentSettings } from '../agent/agentSettings.ts'
import { IDLE_CALL, type CallState } from '../call/callMachine.ts'
import { UNREGISTERED, type RegistrationState } from '../registration/registrationMachine.ts'

import type { AgentProfile } from '../agent/agentProfile.ts'
import type { AgentPresence, PauseReason } from '../agent/agentStatus.ts'
import type { TransferTarget } from '../call/transferTarget.ts'
import type { SoftphoneErrorCode } from '../ports/SoftphoneError.ts'
import type { SupervisionOverview } from '../supervision/supervisionOverview.ts'

// Sesión de One-Desk. No hay pantalla de inicio de sesión: el teléfono se conecta solo con la
// cookie de Zammad y, tras Salir, queda desconectado hasta que se recarga la página (DECISIONES.md,
// diseño #11).
export type SessionState =
  | { status: 'connecting' }
  | { status: 'active'; agent: AgentProfile }
  // `attempt` cuenta los fallos seguidos, para la espera creciente de los reintentos.
  | { status: 'failed'; code: SoftphoneErrorCode; attempt: number }
  | { status: 'signed-out' }

export interface PendingTransfer {
  target: TransferTarget
}

// Error que el agente tiene que ver: el código y, si viene de One-Desk, su `code` (`problem`), para
// dar un texto concreto (DECISIONES.md, transferencia #6).
export interface SoftphoneFailure {
  code: SoftphoneErrorCode
  problem: string | null
}

// Estado vivo del teléfono (architecture.md §8.2). Lo calcula la pestaña líder y se replica tal cual
// a las demás (ADR-007), así que solo contiene datos serializables.
export interface SoftphoneSnapshot {
  session: SessionState
  // Estado del agente en One-Desk; null hasta que se conoce.
  presence: AgentPresence | null
  pauseReasons: readonly PauseReason[]
  registration: RegistrationState
  call: CallState
  // Transferencia pedida y aún sin contestar: el agente sigue en la llamada hasta que el destino
  // contesta y One-Desk lo saca (endpoint 12).
  pendingTransfer: PendingTransfer | null
  settings: AgentSettings
  // Último número marcado, para rellamar. Solo en memoria (architecture.md §8.2).
  lastDialed: string | null
  // Vista general de la supervisión (endpoint 13), al día con el hub. Solo para `supervisor` y
  // `admin`; null para los demás y mientras no se ha cargado.
  supervision: SupervisionOverview | null
  // Último error que el agente tiene que ver (architecture.md §1, objetivo 1). Los del registro y
  // los de la sesión se ven en `registration` y en `session`.
  error: SoftphoneFailure | null
}

export const INITIAL_SNAPSHOT: SoftphoneSnapshot = {
  session: { status: 'connecting' },
  presence: null,
  pauseReasons: [],
  registration: UNREGISTERED,
  call: IDLE_CALL,
  pendingTransfer: null,
  settings: DEFAULT_AGENT_SETTINGS,
  lastDialed: null,
  supervision: null,
  error: null,
}
