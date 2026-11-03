// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { inject, type InjectionKey } from 'vue'

import { createTranslate, type Locale, type Translate } from './translate.ts'

export const SOFTPHONE_LOCALE: InjectionKey<Locale> = Symbol('onedesk-softphone-locale')

// Composable `t()` de los componentes. El idioma lo da config.json (ui.language) y no cambia
// mientras el teléfono está montado.
export const useI18n = (): { t: Translate; locale: Locale } => {
  const locale = inject(SOFTPHONE_LOCALE, 'es')
  return { t: createTranslate(locale), locale }
}
