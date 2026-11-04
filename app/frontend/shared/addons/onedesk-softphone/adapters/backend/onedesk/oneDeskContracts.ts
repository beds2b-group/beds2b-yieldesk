// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

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
import type { AgentStatusChange } from '../../../core/ports/RealtimeChannel.ts'

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

// Evento agent.status_changed del hub (AgentStatusChangedMessage de One-Desk): el mismo estado que el
// endpoint 9, con el agente al que se refiere.
export const readAgentStatusChange = (value: unknown): AgentStatusChange => {
  const operation = 'agent.status_changed'
  const body = object(operation, value)
  return { agentId: integer(operation, body, 'agentId'), presence: readPresence(operation, body) }
}
