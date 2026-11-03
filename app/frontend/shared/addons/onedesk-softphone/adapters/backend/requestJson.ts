// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { SoftphoneError, type SoftphoneErrorCode } from '../../core/ports/SoftphoneError.ts'

// Si el backend no responde, el agente tiene que ver "Sin conexión" en menos de 10 s
// (architecture.md §10).
const REQUEST_TIMEOUT_MS = 8_000

const NO_CONTENT = 204

export type FetchFunction = typeof fetch

export interface JsonRequest {
  // Nombre corto de la operación para los errores. La URL no se usa: puede llevar identificadores.
  operation: string
  url: string
  init?: RequestInit
}

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Códigos HTTP de One-Desk (ENDPOINTS_MVP.md §0.3) que el agente puede resolver o entender; el
// resto es un fallo del servidor.
const codeForStatus = (status: number): SoftphoneErrorCode => {
  if (status === 401) return 'unauthenticated'
  if (status === 403) return 'forbidden'
  if (status === 409 || status === 422) return 'conflict'
  return 'backend'
}

// `code` del ProblemDetails, si la respuesta lo trae.
const readProblem = async (response: Response): Promise<string | null> => {
  try {
    const body = (await response.json()) as unknown
    return isRecord(body) && typeof body.code === 'string' ? body.code : null
  } catch {
    return null
  }
}

// Petición del mismo origen que devuelve JSON (o nada, con 204). Los fallos llegan con un código
// estable: `network` si no hay respuesta (o tarda demasiado) y, si la respuesta es de error, el que
// corresponde a su código HTTP, con el `code` del ProblemDetails en `problem`.
export const requestJson = async (
  fetchFn: FetchFunction,
  { operation, url, init }: JsonRequest,
): Promise<unknown> => {
  let response: Response
  try {
    response = await fetchFn(url, {
      ...init,
      credentials: 'same-origin',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    throw new SoftphoneError('network', `${operation}: no response`, { cause: error })
  }

  if (!response.ok) {
    const problem = await readProblem(response)
    const message = `${operation}: HTTP ${response.status}`
    throw new SoftphoneError(codeForStatus(response.status), message, { problem })
  }
  if (response.status === NO_CONTENT) return null
  try {
    return (await response.json()) as unknown
  } catch (error) {
    throw new SoftphoneError('backend', `${operation}: invalid JSON`, { cause: error })
  }
}
