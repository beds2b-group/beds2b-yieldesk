// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { HostAgent } from '../../core/ports/HostBridge.ts'
import type { Logger } from '../../core/ports/Logger.ts'

// Lo poco de la interfaz clásica de Zammad (CoffeeScript, app/assets/javascripts del fork) que usa
// el teléfono. Es código interno de Zammad: si cambia al actualizar, el arreglo va aquí
// (architecture.md §11).

// Registro de App.User (models/user.coffee).
export interface ClassicUser {
  login: string
  displayName(): string
  permission(key: string): boolean
}

export interface ClassicApp {
  // lib/app_post/event.coffee. `auth` se emite al entrar y al salir (lib/app_post/auth.coffee).
  Event: {
    bind(events: string, callback: () => void, level?: string): void
  }
  // App.User.current es App.Session.get: el usuario con sesión, o undefined.
  User: {
    current(): ClassicUser | null | undefined
  }
}

export type ClassicWindow = Window & typeof globalThis & { App?: ClassicApp }

// Permiso de agente de Zammad: los clientes (y el portal) no tienen teléfono.
const AGENT_PERMISSION = 'ticket.agent'

// El agente con sesión, o null si no hay sesión o el usuario no es agente.
export const readClassicAgent = (app: ClassicApp, logger: Logger): HostAgent | null => {
  try {
    const user = app.User.current()
    if (user === null || user === undefined || !user.permission(AGENT_PERMISSION)) return null
    return { login: user.login, displayName: user.displayName() }
  } catch (error) {
    // permission() lanza si los roles de la sesión no están cargados del todo.
    logger.warn('Could not read the Zammad session', { error })
    return null
  }
}
