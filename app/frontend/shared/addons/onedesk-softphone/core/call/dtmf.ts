// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Teclas del teclado del teléfono: las que se marcan en un número y las que se envían como DTMF
// durante una llamada.
export const DTMF_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const

export type DtmfDigit = (typeof DTMF_DIGITS)[number]

export const isDtmfDigit = (value: string): value is DtmfDigit =>
  (DTMF_DIGITS as readonly string[]).includes(value)
