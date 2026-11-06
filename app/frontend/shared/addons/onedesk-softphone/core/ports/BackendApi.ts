// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { AgentProfile } from '../agent/agentProfile.ts'
import type { AgentPresence, AgentStatus, PauseReason, StatusChange } from '../agent/agentStatus.ts'
import type { TransferTarget } from '../call/transferTarget.ts'

// Lo que el teléfono necesita del agente al arrancar (endpoint 9).
export interface AgentDetails {
  profile: AgentProfile
  presence: AgentPresence
  pauseReasons: readonly PauseReason[]
}

// Un compañero en la pantalla de transferencia (endpoint 11).
export interface AgentSummary {
  id: number
  fullName: string
  extension: string
  status: AgentStatus
  pauseReason: string | null
  // Momento (epoch ms) desde el que el agente está en su estado actual, si se conoce.
  since: number | null
  transferable: boolean
}

// Único punto de acceso al servidor (architecture.md §5.5, ADR-005). Lo implementa One-Desk
// (DECISIONES.md, diseño #10). La identidad sale siempre de la sesión, nunca del navegador.
export interface BackendApi {
  // Abre la sesión con la cookie de Zammad (endpoint 7). Los datos del agente se leen después con
  // getMe(), que trae también su estado y los motivos de pausa.
  startSession(): Promise<void>
  getMe(): Promise<AgentDetails>
  getVoiceToken(): Promise<string>
  setStatus(change: StatusChange): Promise<AgentPresence>
  listAgents(): Promise<readonly AgentSummary[]>
  // Transfiere la llamada en curso del agente de la sesión. One-Desk responde enseguida y saca al
  // agente de la llamada cuando el destino contesta (endpoint 12).
  transferCurrentCall(target: TransferTarget): Promise<void>
  // Pone en espera al cliente de la llamada en curso del agente (endpoint 19): oye música y el agente
  // sigue en la llamada. Devuelve desde cuándo (epoch ms), según One-Desk.
  holdCurrentCall(): Promise<number>
  // Retoma al cliente de la llamada en curso (endpoint 20).
  resumeCurrentCall(): Promise<void>
}
