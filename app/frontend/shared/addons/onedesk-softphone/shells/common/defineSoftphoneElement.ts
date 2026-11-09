// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { createPinia } from 'pinia'
import { defineCustomElement } from 'vue'

import SoftphoneApp from '../../ui/SoftphoneApp.vue'
import { SOFTPHONE_STYLES } from '../../ui/styles/index.ts'

import type { SoftphoneContext } from '../../ui/softphoneContext.ts'

export const SOFTPHONE_TAG = 'onedesk-softphone'

// El custom element con su contexto, que la shell asigna como propiedad antes de añadirlo a la
// página (architecture.md §5.4).
export type SoftphoneElement = HTMLElement & { context: SoftphoneContext }

// Define <onedesk-softphone> una vez por página: con Shadow DOM, el CSS de ui/styles en su raíz
// (ADR-008) y una Pinia propia por elemento, separada de la de Zammad en /desktop (ADR-002).
export const defineSoftphoneElement = (registry: CustomElementRegistry): void => {
  if (registry.get(SOFTPHONE_TAG) !== undefined) return
  registry.define(
    SOFTPHONE_TAG,
    defineCustomElement(SoftphoneApp, {
      styles: [...SOFTPHONE_STYLES],
      configureApp: (app) => {
        app.use(createPinia())
      },
    }),
  )
}
