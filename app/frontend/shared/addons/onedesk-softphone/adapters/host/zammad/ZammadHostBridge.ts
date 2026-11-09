// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { listenHostCommands } from '../hostCommandEvent.ts'

import type { Unsubscribe } from '../../../core/ports/events.ts'
import type { HostAgent, HostBridge, HostCommand } from '../../../core/ports/HostBridge.ts'
import type { Logger } from '../../../core/ports/Logger.ts'

export type ZammadInterface = 'classic' | 'desktop'

interface ZammadRoutes {
  user: (id: number) => string
  ticket: (id: number) => string
  newTicket: string
}

// Rutas de cada interfaz: las de la clásica van en el hash (Spine), las de /desktop son de Vue
// Router (app/frontend/apps/desktop/pages/{ticket,user}/routes.ts del fork).
const ROUTES: Readonly<Record<ZammadInterface, ZammadRoutes>> = {
  classic: {
    user: (id) => `#user/profile/${id}`,
    ticket: (id) => `#ticket/zoom/${id}`,
    newTicket: '#ticket/create',
  },
  desktop: {
    user: (id) => `/users/${id}`,
    ticket: (id) => `/tickets/${id}`,
    newTicket: '/tickets/create',
  },
}

export interface ZammadHostBridgeOptions {
  interface: ZammadInterface
  // Lo que es interno de Zammad lo da la shell (architecture.md §5.2): el agente con sesión y cómo
  // se navega en cada interfaz.
  currentAgent: () => HostAgent | null
  navigate: (route: string) => void
  // Donde emite las órdenes el widget CTI (window).
  commandTarget: EventTarget
  logger: Logger
}

// Anfitrión Zammad, el mismo para las dos interfaces (ADR-002).
export class ZammadHostBridge implements HostBridge {
  private readonly options: ZammadHostBridgeOptions
  private readonly routes: ZammadRoutes

  constructor(options: ZammadHostBridgeOptions) {
    this.options = options
    this.routes = ROUTES[options.interface]
  }

  currentAgent(): HostAgent | null {
    return this.options.currentAgent()
  }

  onCommand(listener: (command: HostCommand) => void): Unsubscribe {
    return listenHostCommands(this.options.commandTarget, listener, this.options.logger)
  }

  openUser(id: number): void {
    this.options.navigate(this.routes.user(id))
  }

  openTicket(id: number): void {
    this.options.navigate(this.routes.ticket(id))
  }

  newTicket(): void {
    this.options.navigate(this.routes.newTicket)
  }

  interface(): ZammadInterface {
    return this.options.interface
  }
}
