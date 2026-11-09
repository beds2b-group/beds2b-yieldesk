// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import {
  defineSoftphoneElement,
  SOFTPHONE_TAG,
  type SoftphoneElement,
} from './defineSoftphoneElement.ts'
import { FirstGestureSoundUnlock } from './firstGestureSoundUnlock.ts'

import type { UiConfig } from '../../config/SoftphoneConfig.ts'
import type { Logger } from '../../core/ports/Logger.ts'
import type { SoundPlayer } from '../../core/ports/SoundPlayer.ts'
import type { SoftphoneEngine } from '../../core/session/SoftphoneEngine.ts'

export interface MountSoftphoneOptions {
  document: Document
  ui: UiConfig
  logger: Logger
  sounds: SoundPlayer
  // Se llama solo si el teléfono no estaba ya montado: crear el engine pide el bloqueo de líder.
  createEngine: () => Promise<SoftphoneEngine>
}

export interface MountedSoftphone {
  readonly element: SoftphoneElement
  readonly engine: SoftphoneEngine
  // Cierre de sesión en Zammad: cuelga, da de baja el teléfono y lo quita de la página
  // (architecture.md §8.3).
  unmount(): Promise<void>
}

// Páginas con un montaje en curso: crear el engine es asíncrono, y dos avisos de sesión seguidos
// de Zammad no deben crear dos teléfonos.
const mounting = new WeakSet<Document>()

const isMounted = (document: Document): boolean =>
  mounting.has(document) || document.querySelector(SOFTPHONE_TAG) !== null

// Crea <onedesk-softphone> en document.body, una sola instancia por pestaña (architecture.md §5.4).
// Devuelve null si ya estaba montado.
export const mountSoftphone = async ({
  document,
  ui,
  logger,
  sounds,
  createEngine,
}: MountSoftphoneOptions): Promise<MountedSoftphone | null> => {
  if (isMounted(document)) {
    logger.info('Softphone already mounted in this tab')
    return null
  }
  const window = document.defaultView
  if (window === null) throw new Error('The document has no window')

  mounting.add(document)
  let engine: SoftphoneEngine
  try {
    engine = await createEngine()
  } finally {
    mounting.delete(document)
  }

  defineSoftphoneElement(window.customElements)
  const sound = new FirstGestureSoundUnlock({
    target: document,
    sounds,
    alreadyActive: window.navigator.userActivation?.hasBeenActive ?? false,
  })
  const element = document.createElement(SOFTPHONE_TAG) as SoftphoneElement
  element.context = {
    engine,
    locale: ui.language,
    dialing: { countries: ui.countries, defaultCountry: ui.defaultCountry },
    sound,
    logger,
  }
  element.dataset.position = ui.position
  element.style.zIndex = String(ui.zIndex)
  document.body.append(element)

  // Recargar o cambiar de interfaz con una llamada la corta: el navegador pide confirmación
  // (architecture.md §8.3).
  const warnBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (engine.snapshot.call.status !== 'idle') event.preventDefault()
  }
  window.addEventListener('beforeunload', warnBeforeUnload)

  return {
    element,
    engine,
    async unmount() {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      sound.dispose()
      element.remove()
      await engine.destroy()
    },
  }
}
