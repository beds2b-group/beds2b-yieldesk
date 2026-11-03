// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { OneDeskBackend } from '../../adapters/backend/onedesk/OneDeskBackend.ts'
import { HtmlAudioSoundPlayer } from '../../adapters/sounds/HtmlAudioSoundPlayer.ts'

import { createPageEngine } from './createPageEngine.ts'
import { createProviderFactory } from './createProviderFactory.ts'
import { mountSoftphone, type MountedSoftphone } from './mountSoftphone.ts'
import { SOUND_URLS } from './soundUrls.ts'

import type { SoftphoneConfig } from '../../config/SoftphoneConfig.ts'
import type { HostBridge } from '../../core/ports/HostBridge.ts'
import type { Logger } from '../../core/ports/Logger.ts'

export interface OneDeskSoftphoneOptions {
  window: Window & typeof globalThis
  config: SoftphoneConfig
  host: HostBridge
  logger: Logger
}

// El teléfono de producción: One-Desk como servidor y el proveedor de voz de config.json. Las
// shells de Zammad solo aportan el anfitrión.
export const mountOneDeskSoftphone = ({
  window,
  config,
  host,
  logger,
}: OneDeskSoftphoneOptions): Promise<MountedSoftphone | null> => {
  const sounds = new HtmlAudioSoundPlayer({ urls: SOUND_URLS, logger })
  return mountSoftphone({
    document: window.document,
    ui: config.ui,
    logger,
    sounds,
    createEngine: () =>
      createPageEngine({
        window,
        ui: config.ui,
        logger,
        sounds,
        host,
        backend: new OneDeskBackend({ apiBase: config.apiBase, fetch: window.fetch.bind(window) }),
        createProvider: createProviderFactory(config),
      }),
  })
}
