// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { Notifier } from '../../core/ports/Notifier.ts'

// Un único aviso a la vez: el `tag` hace que el navegador sustituya el anterior en lugar de apilarlos.
const NOTIFICATION_TAG = 'onedesk-softphone:incoming'

export interface BrowserNotifierOptions {
  // Textos ya traducidos: el adaptador no conoce el i18n de la interfaz.
  title: string
  formatBody: (from: string) => string
  icon?: string
  NotificationApi?: typeof Notification
  focusWindow?: () => void
}

// Notificación de escritorio de las entrantes (architecture.md §6.2). Si el agente no ha dado
// permiso, no hace nada: el permiso se pide desde la campana de la interfaz (inventario §1.6).
export class BrowserNotifier implements Notifier {
  private readonly options: BrowserNotifierOptions
  private readonly NotificationApi: typeof Notification | undefined
  private readonly focusWindow: () => void
  private current: Notification | null = null

  constructor(options: BrowserNotifierOptions) {
    this.options = options
    this.NotificationApi = options.NotificationApi ?? globalThis.Notification
    this.focusWindow = options.focusWindow ?? (() => globalThis.focus())
  }

  notifyIncomingCall(from: string): void {
    const { NotificationApi } = this
    if (NotificationApi === undefined || NotificationApi.permission !== 'granted') return

    this.dismissIncomingCall()
    const notification = new NotificationApi(this.options.title, {
      body: this.options.formatBody(from),
      icon: this.options.icon,
      tag: NOTIFICATION_TAG,
    })
    // Al pulsarla, el agente vuelve a la pestaña para contestar.
    notification.addEventListener('click', () => {
      this.focusWindow()
      notification.close()
    })
    this.current = notification
  }

  dismissIncomingCall(): void {
    this.current?.close()
    this.current = null
  }
}
