// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { SoftphoneError } from '../../../core/ports/SoftphoneError.ts'
import { requestJson, type FetchFunction } from '../requestJson.ts'

import {
  readAgentDetails,
  readAgentSummaries,
  readCurrentCallId,
  readHeldAt,
  readPresence,
  readSupervisionOverview,
  readVoiceToken,
  statusChangeBody,
} from './oneDeskContracts.ts'

import type { AgentPresence, StatusChange } from '../../../core/agent/agentStatus.ts'
import type { TransferTarget } from '../../../core/call/transferTarget.ts'
import type { AgentDetails, AgentSummary, BackendApi } from '../../../core/ports/BackendApi.ts'
import type { SupervisionOverview } from '../../../core/supervision/supervisionOverview.ts'

// Rutas de One-Desk (ENDPOINTS_MVP.md), relativas a `apiBase` (/onedesk, ADR-012). La de
// grabaciones queda para después del MVP.
export const ONE_DESK_ROUTES = {
  session: '/api/session',
  voiceToken: '/api/session/voice-token',
  me: '/api/agents/me',
  myStatus: '/api/agents/me/status',
  agents: '/api/agents',
  transfers: (callId: string) => `/api/calls/${encodeURIComponent(callId)}/transfers`,
  hold: (callId: string) => `/api/calls/${encodeURIComponent(callId)}/hold`,
  resume: (callId: string) => `/api/calls/${encodeURIComponent(callId)}/resume`,
  supervision: '/api/supervision/overview',
  monitor: (callId: string) => `/api/calls/${encodeURIComponent(callId)}/monitor`,
  recordings: (callId: string) => `/api/calls/${encodeURIComponent(callId)}/recordings`,
  eventsHub: '/hubs/events',
} as const

// Defensa contra CSRF (architecture.md §8.1): One-Desk rechaza sin ella las peticiones que modifican
// datos, y otro sitio no puede añadirla sin pasar por CORS.
const CLIENT_HEADER = { 'X-OneDesk-Client': 'softphone' }

export interface OneDeskBackendOptions {
  // Ruta del proxy de openresty, por ejemplo /onedesk (ADR-012).
  apiBase: string
  fetch?: FetchFunction
}

interface Call {
  operation: string
  path: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
}

// Backend del teléfono (ADR-005, DECISIONES.md diseño #10). Autentica con la cookie de Zammad: el
// endpoint 7 la cambia por la sesión de One-Desk, que el navegador envía sola en lo demás.
export class OneDeskBackend implements BackendApi {
  private readonly apiBase: string
  private readonly fetchFn: FetchFunction

  constructor({ apiBase, fetch: fetchFn = globalThis.fetch }: OneDeskBackendOptions) {
    this.apiBase = apiBase.replace(/\/+$/, '')
    this.fetchFn = fetchFn
  }

  async startSession(): Promise<void> {
    await this.send({ operation: 'session', path: ONE_DESK_ROUTES.session, method: 'POST' })
  }

  async getMe(): Promise<AgentDetails> {
    return readAgentDetails(
      await this.withSession({ operation: 'agent', path: ONE_DESK_ROUTES.me }),
    )
  }

  async getVoiceToken(): Promise<string> {
    const body = await this.withSession({
      operation: 'voice-token',
      path: ONE_DESK_ROUTES.voiceToken,
      method: 'POST',
    })
    return readVoiceToken(body)
  }

  async setStatus(change: StatusChange): Promise<AgentPresence> {
    const body = await this.withSession({
      operation: 'status',
      path: ONE_DESK_ROUTES.myStatus,
      method: 'PUT',
      body: statusChangeBody(change),
    })
    return readPresence('status', body)
  }

  async listAgents(): Promise<readonly AgentSummary[]> {
    return readAgentSummaries(
      await this.withSession({ operation: 'agents', path: ONE_DESK_ROUTES.agents }),
    )
  }

  // El teléfono conoce el `CallSid` de su tramo, pero One-Desk transfiere por el `id` de la llamada:
  // se lee de la llamada en curso del agente (endpoint 9) justo antes de pedir la transferencia.
  async transferCurrentCall(target: TransferTarget): Promise<void> {
    const callId = await this.currentCallId('transfer')
    await this.withSession({
      operation: 'transfer',
      path: ONE_DESK_ROUTES.transfers(callId),
      method: 'POST',
      body:
        'agentId' in target
          ? { targetAgentId: target.agentId }
          : { externalNumber: target.externalNumber },
    })
  }

  // Endpoint 19. Como la transferencia, por el `id` de la llamada en curso.
  async holdCurrentCall(): Promise<number> {
    const callId = await this.currentCallId('hold')
    return readHeldAt(
      await this.withSession({
        operation: 'hold',
        path: ONE_DESK_ROUTES.hold(callId),
        method: 'PUT',
      }),
    )
  }

  // Endpoint 20.
  async resumeCurrentCall(): Promise<void> {
    const callId = await this.currentCallId('resume')
    await this.withSession({
      operation: 'resume',
      path: ONE_DESK_ROUTES.resume(callId),
      method: 'PUT',
    })
  }

  // Endpoint 13.
  async getSupervisionOverview(): Promise<SupervisionOverview> {
    return readSupervisionOverview(
      await this.withSession({ operation: 'supervision', path: ONE_DESK_ROUTES.supervision }),
    )
  }

  // Endpoint 14. En el MVP solo se escucha (one-desk DECISIONES.md, Supervisión #3).
  async startMonitoring(callId: string): Promise<void> {
    await this.withSession({
      operation: 'monitor',
      path: ONE_DESK_ROUTES.monitor(callId),
      method: 'POST',
      body: { mode: 'listen' },
    })
  }

  // Endpoint 16.
  async stopMonitoring(callId: string): Promise<void> {
    await this.withSession({
      operation: 'monitor',
      path: ONE_DESK_ROUTES.monitor(callId),
      method: 'DELETE',
    })
  }

  private async currentCallId(operation: string): Promise<string> {
    const callId = readCurrentCallId(
      await this.withSession({ operation: 'agent', path: ONE_DESK_ROUTES.me }),
    )
    if (callId === null) {
      throw new SoftphoneError('conflict', `${operation}: no call in progress`, {
        problem: 'call_not_active',
      })
    }
    return callId
  }

  // La sesión de One-Desk caduca sin actividad (endpoint 7). Si One-Desk ya no la reconoce, se abre
  // otra con la cookie de Zammad y se repite la petición una vez; si Zammad tampoco la reconoce, el
  // fallo llega como `unauthenticated`.
  private async withSession(call: Call): Promise<unknown> {
    try {
      return await this.send(call)
    } catch (error) {
      if (!(error instanceof SoftphoneError) || error.code !== 'unauthenticated') throw error
      await this.startSession()
      return this.send(call)
    }
  }

  private send({ operation, path, method = 'GET', body }: Call): Promise<unknown> {
    const headers: Record<string, string> = { ...CLIENT_HEADER }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    return requestJson(this.fetchFn, {
      operation,
      url: `${this.apiBase}${path}`,
      init: { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
    })
  }
}
