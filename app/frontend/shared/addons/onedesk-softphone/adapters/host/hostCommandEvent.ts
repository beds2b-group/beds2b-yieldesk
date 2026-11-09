// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { Unsubscribe } from '../../core/ports/events.ts'
import type { HostCommand } from '../../core/ports/HostBridge.ts'
import type { Logger } from '../../core/ports/Logger.ts'

// Evento con el que el anfitrión da órdenes al teléfono: `detail` es `{ command }`. Lo emiten el
// widget CTI de Zammad y la página standalone.
export const HOST_COMMAND_EVENT = 'onedesk-softphone:command'

// Lista cerrada (architecture.md §8.1): cualquier otra orden se descarta.
const HOST_COMMANDS: ReadonlySet<unknown> = new Set<HostCommand>(['answer', 'reject', 'hangup'])

const isHostCommand = (value: unknown): value is HostCommand => HOST_COMMANDS.has(value)

export const readHostCommand = (event: Event): HostCommand | null => {
  if (!(event instanceof CustomEvent)) return null
  const { detail } = event
  if (typeof detail !== 'object' || detail === null || !('command' in detail)) return null
  return isHostCommand(detail.command) ? detail.command : null
}

export const listenHostCommands = (
  target: EventTarget,
  listener: (command: HostCommand) => void,
  logger: Logger,
): Unsubscribe => {
  const handle = (event: Event): void => {
    const command = readHostCommand(event)
    if (command === null) logger.warn('Ignoring an unknown host command')
    else listener(command)
  }
  target.addEventListener(HOST_COMMAND_EVENT, handle)
  return () => target.removeEventListener(HOST_COMMAND_EVENT, handle)
}
