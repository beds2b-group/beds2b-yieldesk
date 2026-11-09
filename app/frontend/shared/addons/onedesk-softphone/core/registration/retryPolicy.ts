// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { SoftphoneErrorCode } from '../ports/SoftphoneError.ts'

const FIRST_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000

// Espera creciente entre reintentos: 1, 2, 4… hasta 30 s (architecture.md §8.3). `attempt` es el
// intento que acaba de fallar, empezando en 1.
export const retryDelayMs = (attempt: number): number => {
  const exponent = Math.max(0, attempt - 1)
  return Math.min(FIRST_RETRY_DELAY_MS * 2 ** exponent, MAX_RETRY_DELAY_MS)
}

// Fallos que no se arreglan solos: el micrófono denegado (architecture.md §8.3). Sin sesión de
// Zammad o sin ser agente de One-Desk sí se reintenta: el teléfono se recupera solo cuando el agente
// entra en Zammad o le dan de alta (DECISIONES.md, núcleo con One-Desk #1).
const NEEDS_THE_AGENT: ReadonlySet<SoftphoneErrorCode> = new Set(['mic-denied'])

export const retriesAutomatically = (code: SoftphoneErrorCode): boolean =>
  !NEEDS_THE_AGENT.has(code)
