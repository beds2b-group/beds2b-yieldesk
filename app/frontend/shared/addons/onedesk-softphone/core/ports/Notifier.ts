// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Notificación de escritorio de las entrantes (architecture.md §6.2, inventario §1.6). Avisa aunque
// la pestaña no esté delante o el sonido esté bloqueado tras recargar (architecture.md §8.3).
export interface Notifier {
  notifyIncomingCall(from: string): void
  // Cierra el aviso cuando la entrante deja de sonar (contestada, rechazada o cancelada).
  dismissIncomingCall(): void
}
