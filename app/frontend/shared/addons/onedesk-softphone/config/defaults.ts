// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { COUNTRY_CODES } from '../core/dialing/countries.ts'

import type { UiConfig } from './SoftphoneConfig.ts'

// Ruta del proxy de openresty hacia One-Desk (ADR-012).
export const DEFAULT_API_BASE = '/onedesk'

// Audio por Europa (architecture.md §2).
export const DEFAULT_EDGE = 'dublin'

// Misma posición y capa que el softphone flotante actual (inventario §6.2). Los países son los del
// diseño, con España por defecto (DECISIONES.md, diseño #3).
export const DEFAULT_UI: Readonly<UiConfig> = {
  position: 'bottom-right',
  zIndex: 400,
  language: 'es',
  countries: COUNTRY_CODES,
  defaultCountry: 'es',
}
