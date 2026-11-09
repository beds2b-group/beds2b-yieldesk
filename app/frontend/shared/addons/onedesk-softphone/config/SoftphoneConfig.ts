// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { CountryCode } from '../core/dialing/countries.ts'
import type { ProviderId } from '../core/ports/TelephonyProvider.ts'

// Contenido validado de /softphone/config.json (ADR-009). Uno por entorno, servido por openresty
// fuera del build. Nunca lleva credenciales (architecture.md §8.1). El rol y la lista de agentes
// los da One-Desk (DECISIONES.md, diseño #10).

export type Language = 'es' | 'en'

export type UiPosition = 'bottom-right' | 'bottom-left'

export interface UiConfig {
  position: UiPosition
  zIndex: number
  language: Language
  // Países del selector de prefijo, en el orden en que se muestran (DECISIONES.md, diseño #3).
  countries: readonly CountryCode[]
  defaultCountry: CountryCode
}

export interface SoftphoneConfig {
  enabled: boolean
  provider: ProviderId
  // Ruta relativa del mismo origen hacia One-Desk: la CSP solo permite `connect-src 'self'`.
  apiBase: string
  // Región de Twilio por la que va el audio. Infobip no la usa.
  edge: string
  ui: UiConfig
  debug: boolean
}
