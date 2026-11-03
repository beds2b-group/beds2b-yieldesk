// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Códigos estables con los que llegan los errores de todos los puertos (architecture.md §5.5). La
// interfaz los traduce y ofrece reintentar, así que un código nuevo necesita su traducción.
// - `unauthenticated`: no hay sesión de Zammad o One-Desk no la reconoce.
// - `forbidden`: hay sesión, pero no es un agente activo o no tiene permiso.
// - `conflict`: One-Desk no puede hacerlo en el estado actual (agente ocupado, destino no
//   disponible…). El detalle va en `problem`.
export type SoftphoneErrorCode =
  | 'mic-denied'
  | 'not-registered'
  | 'token-expired'
  | 'network'
  | 'provider'
  | 'backend'
  | 'unauthenticated'
  | 'forbidden'
  | 'conflict'

export interface SoftphoneErrorOptions {
  cause?: unknown
  // `code` del ProblemDetails de One-Desk (`target_unavailable`, `not_an_agent`…), si lo hay.
  problem?: string | null
}

export class SoftphoneError extends Error {
  override readonly name = 'SoftphoneError'

  readonly code: SoftphoneErrorCode
  readonly problem: string | null

  constructor(code: SoftphoneErrorCode, message: string, options: SoftphoneErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.code = code
    this.problem = options.problem ?? null
  }
}

// Los adaptadores ya lanzan SoftphoneError; esto cubre lo que se les escape (un fallo inesperado de
// un SDK), para que el engine siempre trabaje con un código estable.
export const asSoftphoneError = (
  error: unknown,
  fallback: SoftphoneErrorCode = 'provider',
): SoftphoneError =>
  error instanceof SoftphoneError
    ? error
    : new SoftphoneError(fallback, 'Unexpected failure', { cause: error })
