// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { getCurrentInstance, inject, type InjectionKey } from 'vue'

import type { Locale } from './i18n/translate.ts'
import type { CountryCode } from '../core/dialing/countries.ts'
import type { Unsubscribe } from '../core/ports/events.ts'
import type { Logger } from '../core/ports/Logger.ts'
import type { SoftphoneEngine } from '../core/session/SoftphoneEngine.ts'

// Si el navegador deja ya reproducir sonido en esta pestaña. Lo decide la shell con el primer
// gesto del agente en cualquier parte de la página (DECISIONES.md, diseño #12).
export interface SoundUnlock {
  readonly locked: boolean
  onUnlock(listener: () => void): Unsubscribe
}

// Países del selector de prefijo, en el orden en que se muestran, y el de partida (config.json,
// DECISIONES.md diseño #3).
export interface DialingOptions {
  countries: readonly CountryCode[]
  defaultCountry: CountryCode
}

// Lo que la shell le da al custom element (architecture.md §5.4): la interfaz no sabe qué
// adaptadores hay detrás.
export interface SoftphoneContext {
  engine: SoftphoneEngine
  locale: Locale
  dialing: DialingOptions
  sound: SoundUnlock
  logger: Logger
}

export const SOFTPHONE_CONTEXT: InjectionKey<SoftphoneContext> = Symbol('onedesk-softphone-context')

// Se provee a nivel de aplicación, no del componente raíz: Pinia ejecuta el `setup` de los stores
// con `app.runWithContext()`, y ahí `inject` solo ve lo que provee la aplicación. Cada
// <onedesk-softphone> tiene su propia aplicación de Vue, así que no se mezclan.
export const provideSoftphoneContext = (context: SoftphoneContext): void => {
  const instance = getCurrentInstance()
  if (instance === null) throw new Error('provideSoftphoneContext must be called during setup')
  instance.appContext.app.provide(SOFTPHONE_CONTEXT, context)
}

export const useSoftphoneContext = (): SoftphoneContext => {
  const context = inject(SOFTPHONE_CONTEXT)
  if (context === undefined) throw new Error('The softphone context was not provided')
  return context
}
