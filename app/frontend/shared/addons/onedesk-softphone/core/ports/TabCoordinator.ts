// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { Unsubscribe } from './events.ts'

// La líder registra el dispositivo y suena; las réplicas muestran su estado y le envían órdenes
// (ADR-007).
export type TabRole = 'leader' | 'replica'

// Puerto de coordinación entre pestañas (architecture.md §5.5). Es genérico para no depender del
// engine: el estado y las órdenes que viajan los define core/session, y deben ser serializables.
export interface TabCoordinator<TState, TCommand> {
  readonly role: TabRole
  onRoleChange(listener: (role: TabRole) => void): Unsubscribe

  publishState(snapshot: TState): void
  onState(listener: (snapshot: TState) => void): Unsubscribe

  sendCommand(command: TCommand): void
  onCommand(listener: (command: TCommand) => void): Unsubscribe

  // Suelta el bloqueo de líder y cierra el canal al desmontar el teléfono (architecture.md §8.3).
  destroy(): void
}
