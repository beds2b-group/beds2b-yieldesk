// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { AgentPresence, AgentStatus } from '../agent/agentStatus.ts'

// Vista general de la supervisión (endpoint 13 de One-Desk). Los instantes son epoch ms, o null si
// no se conocen. Son datos serializables: viajan en la foto a las demás pestañas (ADR-007).

export interface SupervisedAgent {
  id: number
  fullName: string
  extension: string
  status: AgentStatus
  // Nombre del motivo de pausa, como en el endpoint 11.
  pauseReason: string | null
  since: number | null
  currentCallId: string | null
}

export interface ActiveCall {
  id: string
  direction: 'inbound' | 'outbound'
  customerNumber: string
  answeredAt: number | null
  // Desde cuándo está el cliente en espera (endpoint 19), o null.
  heldAt: number | null
  // Agente que la atiende; null si en ese momento no hay ninguno con su tramo contestado.
  agent: { id: number; fullName: string } | null
  // Supervisores que la escuchan, por orden de entrada.
  monitoredBy: readonly number[]
  hasRecording: boolean
}

export interface WaitingCall {
  id: string
  customerNumber: string
  // Desde cuándo espera: el contador lo lleva el teléfono (one-desk DECISIONES.md,
  // supervision.call_updated #6).
  receivedAt: number | null
}

export interface SupervisionOverview {
  agents: readonly SupervisedAgent[]
  activeCalls: readonly ActiveCall[]
  waitingCalls: readonly WaitingCall[]
}

// Aviso `supervision.call_updated` del hub: la llamada entra, cambia o termina.
export type SupervisionCallUpdate =
  | { callId: string; state: 'waiting'; call: WaitingCall }
  | { callId: string; state: 'active'; call: ActiveCall }
  | { callId: string; state: 'ended' }

const replaceOrAppend = <T extends { id: string }>(list: readonly T[], item: T): readonly T[] =>
  list.some((existing) => existing.id === item.id)
    ? list.map((existing) => (existing.id === item.id ? item : existing))
    : [...list, item]

// Sustituye o quita la fila de la llamada. Una llamada está en una sola lista: al cogerla un agente
// pasa de En espera a En curso, y al terminar sale de las dos. Se mantiene el orden de llegada.
export const applyCallUpdate = (
  overview: SupervisionOverview,
  update: SupervisionCallUpdate,
): SupervisionOverview => {
  const waitingCalls = overview.waitingCalls.filter((call) => call.id !== update.callId)
  const activeCalls = overview.activeCalls.filter((call) => call.id !== update.callId)
  if (update.state === 'waiting') {
    return {
      ...overview,
      activeCalls,
      waitingCalls: replaceOrAppend(overview.waitingCalls, update.call),
    }
  }
  if (update.state === 'active') {
    return {
      ...overview,
      waitingCalls,
      activeCalls: replaceOrAppend(overview.activeCalls, update.call),
    }
  }
  return { ...overview, waitingCalls, activeCalls }
}

// `agent.status_changed` de cualquier agente. Un agente que no está en la vista (por ejemplo, dado de
// alta después de abrirla) se ignora: llegará con la siguiente carga.
export const applyAgentPresence = (
  overview: SupervisionOverview,
  agentId: number,
  presence: AgentPresence,
  pauseReasonName: string | null,
): SupervisionOverview => {
  if (!overview.agents.some((agent) => agent.id === agentId)) return overview
  return {
    ...overview,
    agents: overview.agents.map((agent) =>
      agent.id === agentId
        ? { ...agent, status: presence.status, pauseReason: pauseReasonName, since: presence.since }
        : agent,
    ),
  }
}
