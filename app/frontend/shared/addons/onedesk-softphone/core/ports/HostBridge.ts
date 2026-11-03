// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { Unsubscribe } from './events.ts'

export type HostInterface = 'classic' | 'desktop' | 'standalone'

// Órdenes que el anfitrión puede dar al teléfono: lista cerrada (architecture.md §8.1).
export type HostCommand = 'answer' | 'reject' | 'hangup'

// Agente con sesión en el anfitrión. [VERIFICAR] el campo de Zammad que identifica al agente
// (architecture.md §11).
export interface HostAgent {
  login: string
  displayName: string
}

// Puerto hacia la página que aloja el teléfono (architecture.md §5.5): Zammad en sus dos interfaces,
// o la página standalone de desarrollo.
export interface HostBridge {
  currentAgent(): HostAgent | null
  onCommand(listener: (command: HostCommand) => void): Unsubscribe
  openUser(id: number): void
  openTicket(id: number): void
  newTicket(): void
  interface(): HostInterface
}
