// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { HOST_COMMAND_EVENT } from '../../adapters/host/hostCommandEvent.ts'
import { ZammadHostBridge } from '../../adapters/host/zammad/ZammadHostBridge.ts'
import { ConsoleLogger } from '../../adapters/logging/ConsoleLogger.ts'
import { createTranslate } from '../../ui/i18n/translate.ts'
import { AgentSessionMount } from '../common/agentSessionMount.ts'
import { loadConfig } from '../common/loadConfig.ts'
import {
  mountOneDeskSoftphone,
  type OneDeskSoftphoneOptions,
} from '../common/mountOneDeskSoftphone.ts'

import { readClassicAgent, type ClassicApp, type ClassicWindow } from './classicZammad.ts'
import { decorateCtiWidget } from './ctiWidgetDecorator.ts'

import type { MountedSoftphone } from '../common/mountSoftphone.ts'

// Nivel de los avisos de App.Event: identifica nuestro enlace entre los de Zammad.
const EVENT_LEVEL = 'onedesk-softphone'

export interface ClassicSoftphoneOptions {
  window: ClassicWindow
  // Para las pruebas; por defecto, el teléfono con One-Desk.
  mount?: (options: OneDeskSoftphoneOptions) => Promise<MountedSoftphone | null>
}

// Shell de la interfaz clásica (ADR-002): el entrypoint de Vite que carga application.html.erb.
// Zammad comprueba la sesión de forma síncrona al ejecutar application.js, así que al llegar aquí
// el primer `auth` ya ha pasado: se lee la sesión actual y después se escuchan los cambios.
// config.json solo se descarga cuando hay un agente, nunca para los clientes.
export const startClassicSoftphone = ({
  window,
  mount = mountOneDeskSoftphone,
}: ClassicSoftphoneOptions): AgentSessionMount | null => {
  const bootLogger = new ConsoleLogger({ level: 'info' })
  const app: ClassicApp | undefined = window.App
  if (app === undefined) {
    bootLogger.warn('Zammad classic interface not found: the softphone is not started')
    return null
  }

  let configured: ReturnType<typeof loadConfig> | null = null
  const mountForAgent = async (): Promise<MountedSoftphone | null> => {
    configured ??= loadConfig(window.fetch.bind(window))
    const loaded = await configured
    if (!loaded.ok) {
      // El siguiente aviso de sesión lo vuelve a descargar: puede haber sido la red.
      configured = null
      bootLogger.error('Invalid softphone configuration', { errors: loaded.errors })
      return null
    }
    const { config } = loaded
    if (!config.enabled) {
      bootLogger.info('Softphone disabled in config.json')
      return null
    }
    const logger = new ConsoleLogger({ level: config.debug ? 'debug' : 'info' })
    const host = new ZammadHostBridge({
      interface: 'classic',
      currentAgent: () => readClassicAgent(app, logger),
      navigate: (route) => {
        window.location.hash = route
      },
      commandTarget: window,
      logger,
    })
    const mounted = await mount({ window, config, host, logger })
    if (mounted === null) return null
    // Los botones del widget CTI dan la orden por el mismo evento que escucha el anfitrión.
    const t = createTranslate(config.ui.language)
    const stopDecorating = decorateCtiWidget({
      document: window.document,
      labels: { answer: t('incoming.answer'), reject: t('incoming.reject') },
      send: (command) => {
        window.dispatchEvent(new CustomEvent(HOST_COMMAND_EVENT, { detail: { command } }))
      },
    })
    return {
      element: mounted.element,
      engine: mounted.engine,
      unmount: async () => {
        stopDecorating()
        await mounted.unmount()
      },
    }
  }

  const session = new AgentSessionMount({ mount: mountForAgent, logger: bootLogger })
  const sync = (): void => {
    void session.update(readClassicAgent(app, bootLogger) !== null)
  }
  app.Event.bind('auth', sync, EVENT_LEVEL)
  sync()
  return session
}
