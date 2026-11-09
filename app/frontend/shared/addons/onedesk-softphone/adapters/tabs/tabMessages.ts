// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Mensajes entre pestañas por BroadcastChannel (ADR-007). El navegador solo los entrega a pestañas
// del mismo origen, pero se comprueba la forma antes de usarlos: pueden venir de una versión
// anterior del softphone abierta en otra pestaña.
export type TabMessage<TState, TCommand> =
  // La líder publica la foto del teléfono.
  | { kind: 'state'; snapshot: TState }
  // Una réplica reenvía una orden a la líder.
  | { kind: 'command'; command: TCommand }
  // Una réplica recién abierta pide la foto actual.
  | { kind: 'state-request' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isTabMessage = <TState, TCommand>(
  value: unknown,
): value is TabMessage<TState, TCommand> => {
  if (!isRecord(value)) return false
  switch (value.kind) {
    case 'state':
      return isRecord(value.snapshot)
    case 'command':
      return isRecord(value.command)
    case 'state-request':
      return true
    default:
      return false
  }
}
