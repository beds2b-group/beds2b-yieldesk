// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { SystemClock } from '../../adapters/clock/SystemClock.ts'
import { BrowserNotifier } from '../../adapters/notifications/BrowserNotifier.ts'
import { LocalStorageStore } from '../../adapters/storage/LocalStorageStore.ts'
import { SingleTabCoordinator } from '../../adapters/tabs/SingleTabCoordinator.ts'
import { WebLocksTabCoordinator } from '../../adapters/tabs/WebLocksTabCoordinator.ts'
import { createSoftphoneEngine } from '../../core/session/createSoftphoneEngine.ts'
import { createTranslate } from '../../ui/i18n/translate.ts'

import type { UiConfig } from '../../config/SoftphoneConfig.ts'
import type { BackendApi } from '../../core/ports/BackendApi.ts'
import type { HostBridge } from '../../core/ports/HostBridge.ts'
import type { Logger } from '../../core/ports/Logger.ts'
import type { RealtimeChannel } from '../../core/ports/RealtimeChannel.ts'
import type { SoundPlayer } from '../../core/ports/SoundPlayer.ts'
import type { TelephonyProvider } from '../../core/ports/TelephonyProvider.ts'
import type { EngineTabCoordinator, SoftphoneEngine } from '../../core/session/SoftphoneEngine.ts'

export interface PageEngineOptions {
  window: Window & typeof globalThis
  ui: UiConfig
  logger: Logger
  sounds: SoundPlayer
  // Lo que cambia entre shells: el anfitrión, el servidor y el proveedor de voz.
  host: HostBridge
  backend: BackendApi
  realtime: RealtimeChannel
  createProvider: () => Promise<TelephonyProvider>
  // Una sola pestaña, sin réplicas: para desarrollar sin que otra pestaña se quede la líder.
  singleTab?: boolean
}

// Sin Web Locks (navegador antiguo o contexto no seguro), cada pestaña se registra por su cuenta.
const createTabs = async ({
  window,
  logger,
  singleTab = false,
}: PageEngineOptions): Promise<EngineTabCoordinator> => {
  const locks = window.navigator.locks as LockManager | undefined
  if (singleTab || locks === undefined) {
    if (!singleTab) logger.warn('Web Locks unavailable: every tab registers its own phone')
    return new SingleTabCoordinator()
  }
  return WebLocksTabCoordinator.connect({
    locks,
    openChannel: (name) => new window.BroadcastChannel(name),
    logger,
  })
}

// Raíz de composición común a las shells (architecture.md §5.4): conecta los adaptadores del
// navegador y deja a cada shell solo lo suyo.
export const createPageEngine = async (options: PageEngineOptions): Promise<SoftphoneEngine> => {
  const { window, ui, logger, sounds, host, backend, realtime, createProvider } = options
  const t = createTranslate(ui.language)
  return createSoftphoneEngine({
    createProvider,
    backend,
    realtime,
    host,
    tabs: await createTabs(options),
    sounds,
    notifier: new BrowserNotifier({
      title: t('notification.title'),
      formatBody: (from) => t('notification.body', { from }),
    }),
    store: new LocalStorageStore(window.localStorage, logger),
    clock: new SystemClock(),
    logger,
  })
}
