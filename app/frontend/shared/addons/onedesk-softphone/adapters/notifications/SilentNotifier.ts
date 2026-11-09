// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { Notifier } from '../../core/ports/Notifier.ts'

// Sin notificaciones de escritorio: para las pruebas E2E y la página standalone.
export class SilentNotifier implements Notifier {
  notifyIncomingCall(): void {}

  dismissIncomingCall(): void {}
}
