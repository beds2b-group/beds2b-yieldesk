// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { CountryCode } from '../../core/dialing/countries.ts'
import type { Locale } from '../i18n/translate.ts'

export type CountryName = (country: CountryCode) => string

// Nombres de los países en el idioma del teléfono, del propio navegador (Intl): sin diccionario
// que mantener. Si el navegador no conoce el código, se muestra el código.
export const createCountryName = (locale: Locale): CountryName => {
  const names = new Intl.DisplayNames([locale], { type: 'region' })
  return (country) => names.of(country.toUpperCase()) ?? country.toUpperCase()
}

const normalize = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()

// Búsqueda del selector: por nombre, sin mayúsculas ni tildes, o por el principio del prefijo, con
// o sin `+`.
export const matchesCountryQuery = (name: string, dialCode: string, query: string): boolean => {
  const wanted = normalize(query)
  if (wanted === '') return true
  if (/^\+?\d+$/.test(wanted)) return dialCode.startsWith(`+${wanted.replace('+', '')}`)
  return normalize(name).includes(wanted)
}
