// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { SoftphoneError, type SoftphoneErrorCode } from '../../../core/ports/SoftphoneError.ts'

// Códigos de Twilio (https://www.twilio.com/docs/api/errors) que piden al engine algo distinto de
// mostrar el fallo. El resto llega como `provider`.
const CODES: ReadonlyMap<number, SoftphoneErrorCode> = new Map([
  // Micrófono denegado o sin micrófono que usar: no se reintenta hasta que el agente lo resuelva.
  [31401, 'mic-denied'],
  [31402, 'mic-denied'],
  // Token inválido o caducado: el engine pide otro.
  [20101, 'token-expired'],
  [20104, 'token-expired'],
  [31204, 'token-expired'],
  [31205, 'token-expired'],
  // Sin conexión con Twilio, por señalización o por medios.
  [31003, 'network'],
  [31005, 'network'],
  [31009, 'network'],
  [53000, 'network'],
  [53001, 'network'],
  [53405, 'network'],
])

// Errores del navegador que llegan sin envolver al elegir micrófono.
const DOM_ERRORS: ReadonlyMap<string, SoftphoneErrorCode> = new Map([
  ['NotAllowedError', 'mic-denied'],
  ['NotFoundError', 'mic-denied'],
])

const readCode = (error: unknown): number | null =>
  typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'number'
    ? error.code
    : null

const readName = (error: unknown): string | null => (error instanceof Error ? error.name : null)

// Traduce un fallo del SDK al código estable del puerto. El mensaje lleva el código de Twilio, que
// sirve para diagnosticar y no contiene datos del agente ni del cliente.
export const toSoftphoneError = (error: unknown): SoftphoneError => {
  if (error instanceof SoftphoneError) return error

  const twilioCode = readCode(error)
  const code =
    (twilioCode === null ? undefined : CODES.get(twilioCode)) ??
    DOM_ERRORS.get(readName(error) ?? '') ??
    'provider'
  const message = twilioCode === null ? 'Twilio SDK failure' : `Twilio error ${twilioCode}`
  return new SoftphoneError(code, message, { cause: error })
}
