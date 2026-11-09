// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { SoftphoneErrorCode } from '../ports/SoftphoneError.ts'

// Máquina de estados del registro del dispositivo (architecture.md §6.4, ADR-006):
// SinRegistrar → Registrando → Registrado ⇄ RenovandoToken, más Error. `attempt` cuenta los intentos
// seguidos y sirve para calcular la espera del siguiente reintento (retryPolicy.ts).
export type RegistrationState =
  | { status: 'unregistered' }
  | { status: 'registering'; attempt: number }
  | { status: 'registered' }
  | { status: 'renewing-token' }
  | { status: 'error'; code: SoftphoneErrorCode; attempt: number }

export type RegistrationStatus = RegistrationState['status']

// `register` lo pide el agente (login o botón de reintentar) y empieza de cero; `retry` lo programa
// el engine tras un error y cuenta como un intento más.
export type RegistrationEvent =
  | { type: 'register' }
  | { type: 'retry' }
  | { type: 'registered' }
  | { type: 'unregistered' }
  | { type: 'token-will-expire' }
  | { type: 'token-renewed' }
  | { type: 'failed'; code: SoftphoneErrorCode }

export const UNREGISTERED: RegistrationState = { status: 'unregistered' }

// Cada `from*` devuelve el estado siguiente, o null si el evento no aplica a ese estado.

const fromRegistering = (
  state: Extract<RegistrationState, { status: 'registering' }>,
  event: RegistrationEvent,
): RegistrationState | null => {
  if (event.type === 'registered') return { status: 'registered' }
  if (event.type === 'failed') return { status: 'error', code: event.code, attempt: state.attempt }
  return null
}

const fromRegistered = (event: RegistrationEvent): RegistrationState | null => {
  if (event.type === 'token-will-expire') return { status: 'renewing-token' }
  if (event.type === 'failed') return { status: 'error', code: event.code, attempt: 1 }
  return null
}

// Si la renovación falla, el dispositivo sigue registrado con el token anterior y el engine
// reintenta antes de que caduque (architecture.md §8.3). Solo pasa a error si el token ya caducó.
const fromRenewingToken = (event: RegistrationEvent): RegistrationState | null => {
  if (event.type === 'token-renewed') return { status: 'registered' }
  if (event.type === 'failed' && event.code === 'token-expired') {
    return { status: 'error', code: event.code, attempt: 1 }
  }
  return null
}

const fromError = (
  state: Extract<RegistrationState, { status: 'error' }>,
  event: RegistrationEvent,
): RegistrationState | null => {
  if (event.type === 'register') return { status: 'registering', attempt: 1 }
  if (event.type === 'retry') return { status: 'registering', attempt: state.attempt + 1 }
  return null
}

// Como en la llamada, un evento que no aplica deja el estado igual.
export const transitionRegistration = (
  state: RegistrationState,
  event: RegistrationEvent,
): RegistrationState => {
  // El dispositivo puede dejar de estar registrado en cualquier momento (Salir, cierre de sesión en
  // Zammad o caída de la señalización).
  if (event.type === 'unregistered') return UNREGISTERED

  switch (state.status) {
    case 'unregistered':
      return event.type === 'register' ? { status: 'registering', attempt: 1 } : state
    case 'registering':
      return fromRegistering(state, event) ?? state
    case 'registered':
      return fromRegistered(event) ?? state
    case 'renewing-token':
      return fromRenewingToken(event) ?? state
    case 'error':
      return fromError(state, event) ?? state
    default:
      return state satisfies never
  }
}

// Una llamada solo empieza con el dispositivo registrado (architecture.md §6.4).
export const canStartCall = (state: RegistrationState): boolean => state.status === 'registered'
