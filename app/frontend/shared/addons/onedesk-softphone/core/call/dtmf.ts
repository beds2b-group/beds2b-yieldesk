// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Teclas del teclado del teléfono: las que se marcan en un número y las que se envían como DTMF
// durante una llamada.
export const DTMF_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const

export type DtmfDigit = (typeof DTMF_DIGITS)[number]

export const isDtmfDigit = (value: string): value is DtmfDigit =>
  (DTMF_DIGITS as readonly string[]).includes(value)
