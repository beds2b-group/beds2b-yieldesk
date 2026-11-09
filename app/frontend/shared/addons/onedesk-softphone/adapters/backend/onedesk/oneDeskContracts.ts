// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { SoftphoneError } from '../../../core/ports/SoftphoneError.ts'
import { isRecord } from '../requestJson.ts'

import type { AgentProfile, AgentRole } from '../../../core/agent/agentProfile.ts'
import type {
  AgentPresence,
  AgentStatus,
  PauseReason,
  StatusChange,
} from '../../../core/agent/agentStatus.ts'
import type { AgentDetails, AgentSummary } from '../../../core/ports/BackendApi.ts'
import type { AgentStatusChange, CallOffer } from '../../../core/ports/RealtimeChannel.ts'
import type {
  ActiveCall,
  SupervisedAgent,
  SupervisionCallUpdate,
  SupervisionOverview,
  WaitingCall,
} from '../../../core/supervision/supervisionOverview.ts'

// Frontera con los contratos de One-Desk (ENDPOINTS_MVP.md): el JSON de One-Desk no sale de este
// fichero. Una respuesta que no cumple el contrato falla con `backend`, sin datos del agente.

type Json = Record<string, unknown>

// One-Desk envía los estados en snake_case (`on_call`, `wrap_up`); el núcleo usa guiones.
const STATUSES: Readonly<Record<string, AgentStatus>> = {
  offline: 'offline',
  available: 'available',
  reserved: 'reserved',
  on_call: 'on-call',
  wrap_up: 'wrap-up',
  paused: 'paused',
}

const ROLES: readonly AgentRole[] = ['agent', 'supervisor', 'admin']

const invalid = (operation: string, field: string): SoftphoneError =>
  new SoftphoneError('backend', `${operation}: unexpected ${field} in the response`)

const object = (operation: string, value: unknown, field = 'body'): Json => {
  if (isRecord(value)) return value
  throw invalid(operation, field)
}

const string = (operation: string, body: Json, field: string): string => {
  const value = body[field]
  if (typeof value === 'string' && value !== '') return value
  throw invalid(operation, field)
}

const integer = (operation: string, body: Json, field: string): number => {
  const value = body[field]
  if (Number.isInteger(value)) return value as number
  throw invalid(operation, field)
}

const optionalInteger = (operation: string, body: Json, field: string): number | null =>
  body[field] === null || body[field] === undefined ? null : integer(operation, body, field)

const optionalString = (operation: string, body: Json, field: string): string | null =>
  body[field] === null || body[field] === undefined ? null : string(operation, body, field)

// Fecha ISO 8601 a epoch ms; si falta o no es una fecha, no se conoce.
const optionalInstant = (body: Json, field: string): number | null => {
  const value = body[field]
  if (typeof value !== 'string') return null
  const instant = Date.parse(value)
  return Number.isNaN(instant) ? null : instant
}

const status = (operation: string, body: Json): AgentStatus => {
  const value = STATUSES[string(operation, body, 'status').toLowerCase()]
  if (value === undefined) throw invalid(operation, 'status')
  return value
}

const role = (operation: string, body: Json): AgentRole => {
  const value = string(operation, body, 'role')
  if ((ROLES as readonly string[]).includes(value)) return value as AgentRole
  throw invalid(operation, 'role')
}

// Endpoints 9 y 10: `pauseReasonId`, como en la respuesta del 10 (comprobado con
// AgentDetailsResponse de One-Desk, rama mvp-endpoints, 30-10-2026).
export const readPresence = (operation: string, value: unknown): AgentPresence => {
  const body = object(operation, value)
  return {
    status: status(operation, body),
    pauseReasonId: optionalInteger(operation, body, 'pauseReasonId'),
    since: optionalInstant(body, 'statusChangedAt'),
  }
}

// `icon` es el emoji del motivo, o null (PauseReasonResponse de One-Desk).
const readPauseReason = (operation: string, value: unknown): PauseReason => {
  const body = object(operation, value, 'pauseReasons')
  return {
    id: integer(operation, body, 'id'),
    name: string(operation, body, 'name'),
    icon: optionalString(operation, body, 'icon'),
  }
}

// Endpoint 9.
export const readAgentDetails = (value: unknown): AgentDetails => {
  const operation = 'agent'
  const body = object(operation, value)
  const pauseReasons = body.pauseReasons ?? []
  if (!Array.isArray(pauseReasons)) throw invalid(operation, 'pauseReasons')

  const profile: AgentProfile = {
    id: integer(operation, body, 'id'),
    fullName: string(operation, body, 'fullName'),
    extension: string(operation, body, 'extension'),
    role: role(operation, body),
  }
  return {
    profile,
    presence: readPresence(operation, body),
    pauseReasons: pauseReasons.map((reason) => readPauseReason(operation, reason)),
  }
}

// `id` de la llamada en curso del endpoint 9, para transferirla (endpoint 12).
export const readCurrentCallId = (value: unknown): string | null => {
  const body = object('agent', value)
  if (body.currentCall === null || body.currentCall === undefined) return null
  return string('agent', object('agent', body.currentCall, 'currentCall'), 'id')
}

// `heldAt` de la respuesta del endpoint 19 (CallHoldResponse de One-Desk): desde cuándo está el
// cliente en espera.
export const readHeldAt = (value: unknown): number => {
  const heldAt = optionalInstant(object('hold', value), 'heldAt')
  if (heldAt === null) throw invalid('hold', 'heldAt')
  return heldAt
}

// Endpoint 11.
export const readAgentSummaries = (value: unknown): readonly AgentSummary[] => {
  const operation = 'agents'
  if (!Array.isArray(value)) throw invalid(operation, 'body')
  return value.map((item) => {
    const body = object(operation, item)
    return {
      id: integer(operation, body, 'id'),
      fullName: string(operation, body, 'fullName'),
      extension: string(operation, body, 'extension'),
      status: status(operation, body),
      pauseReason: optionalString(operation, body, 'pauseReason'),
      since: optionalInstant(body, 'statusChangedAt'),
      transferable: body.transferable === true,
    }
  })
}

// Endpoint 8.
export const readVoiceToken = (value: unknown): string =>
  string('voice-token', object('voice-token', value), 'token')

// Cuerpo del endpoint 10.
export const statusChangeBody = (change: StatusChange): Json =>
  change.status === 'paused'
    ? { status: 'paused', pauseReasonId: change.pauseReasonId }
    : { status: change.status }

// Supervisión (endpoint 13 y `supervision.call_updated`). Cada objeto, como SupervisionOverviewResponse
// de One-Desk.

const array = (operation: string, body: Json, field: string): readonly unknown[] => {
  const value = body[field] ?? []
  if (Array.isArray(value)) return value
  throw invalid(operation, field)
}

const readSupervisedAgent = (operation: string, value: unknown): SupervisedAgent => {
  const body = object(operation, value, 'agents')
  return {
    id: integer(operation, body, 'id'),
    fullName: string(operation, body, 'fullName'),
    extension: string(operation, body, 'extension'),
    status: status(operation, body),
    pauseReason: optionalString(operation, body, 'pauseReason'),
    since: optionalInstant(body, 'statusChangedAt'),
    currentCallId: optionalString(operation, body, 'currentCallId'),
  }
}

const readActiveCall = (operation: string, value: unknown): ActiveCall => {
  const body = object(operation, value, 'activeCalls')
  const agent =
    body.agent === null || body.agent === undefined ? null : object(operation, body.agent, 'agent')
  return {
    id: string(operation, body, 'id'),
    direction: body.direction === 'outbound' ? 'outbound' : 'inbound',
    customerNumber: string(operation, body, 'customerNumber'),
    answeredAt: optionalInstant(body, 'answeredAt'),
    heldAt: optionalInstant(body, 'heldAt'),
    agent:
      agent === null
        ? null
        : { id: integer(operation, agent, 'id'), fullName: string(operation, agent, 'fullName') },
    monitoredBy: array(operation, body, 'monitoredBy').map((supervisor) =>
      integer(operation, object(operation, supervisor, 'monitoredBy'), 'agentId'),
    ),
    hasRecording: body.hasRecording === true,
  }
}

const readWaitingCall = (operation: string, value: unknown): WaitingCall => {
  const body = object(operation, value, 'waitingCalls')
  return {
    id: string(operation, body, 'id'),
    customerNumber: string(operation, body, 'customerNumber'),
    receivedAt: optionalInstant(body, 'receivedAt'),
  }
}

// Endpoint 13.
export const readSupervisionOverview = (value: unknown): SupervisionOverview => {
  const operation = 'supervision'
  const body = object(operation, value)
  return {
    agents: array(operation, body, 'agents').map((agent) => readSupervisedAgent(operation, agent)),
    activeCalls: array(operation, body, 'activeCalls').map((call) =>
      readActiveCall(operation, call),
    ),
    waitingCalls: array(operation, body, 'waitingCalls').map((call) =>
      readWaitingCall(operation, call),
    ),
  }
}

// Evento supervision.call_updated del hub (SupervisionCallUpdatedMessage de One-Desk).
export const readSupervisionCallUpdate = (value: unknown): SupervisionCallUpdate => {
  const operation = 'supervision.call_updated'
  const body = object(operation, value)
  const callId = string(operation, body, 'callId')
  switch (body.state) {
    case 'waiting':
      return { callId, state: 'waiting', call: readWaitingCall(operation, body.call) }
    case 'active':
      return { callId, state: 'active', call: readActiveCall(operation, body.call) }
    case 'ended':
      return { callId, state: 'ended' }
    default:
      throw invalid(operation, 'state')
  }
}

const OFFER_KINDS: readonly CallOffer['kind'][] = ['assignment', 'transfer', 'monitor']

// Evento call.offered del hub (CallOfferedMessage de One-Desk).
export const readCallOffer = (value: unknown): CallOffer => {
  const operation = 'call.offered'
  const body = object(operation, value)
  const kind = string(operation, body, 'kind')
  if (!(OFFER_KINDS as readonly string[]).includes(kind)) throw invalid(operation, 'kind')
  return {
    callId: string(operation, body, 'callId'),
    legCallSid: string(operation, body, 'legCallSid'),
    kind: kind as CallOffer['kind'],
    customerNumber: string(operation, body, 'customerNumber'),
  }
}

// Evento agent.status_changed del hub (AgentStatusChangedMessage de One-Desk): el mismo estado que el
// endpoint 9, con el agente al que se refiere.
export const readAgentStatusChange = (value: unknown): AgentStatusChange => {
  const operation = 'agent.status_changed'
  const body = object(operation, value)
  return { agentId: integer(operation, body, 'agentId'), presence: readPresence(operation, body) }
}
