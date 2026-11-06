// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Máquina de estados de la llamada (architecture.md §6.4, ADR-006). Los estados son datos
// serializables, porque se replican a las demás pestañas (ADR-007).
export type CallState =
  | { status: 'idle' }
  | { status: 'incoming'; from: string }
  | { status: 'outgoing'; to: string }
  // `heldAt`: desde cuándo (epoch ms) está el cliente en espera según One-Desk (endpoint 19), o null.
  | { status: 'in-call'; peer: string; startedAt: number; muted: boolean; heldAt: number | null }
  // El supervisor escucha una llamada (endpoint 14): oye al cliente y al agente y nadie le oye.
  // `agentName` es el del agente que la atiende, si se conoce.
  | {
      status: 'monitoring'
      callId: string
      customer: string
      agentName: string | null
      startedAt: number
    }
  | { status: 'ending'; peer: string }

export type CallStatus = CallState['status']

// Órdenes del agente (dial, answer, reject, hangup, mute) y eventos del proveedor (incoming,
// accepted, cancelled, disconnected, failed). `at` es epoch en ms. Al transferir, el agente sigue en
// la llamada hasta que el destino contesta y One-Desk lo saca: llega como `disconnected`.
// `hold-changed` llega cuando One-Desk confirma la espera o la vuelta (endpoints 19 y 20).
export type CallEvent =
  | { type: 'incoming'; from: string }
  | { type: 'dial'; to: string }
  | { type: 'answer'; at: number }
  | { type: 'accepted'; at: number }
  | { type: 'reject' }
  | { type: 'cancelled' }
  | { type: 'hangup' }
  | { type: 'disconnected' }
  | { type: 'failed' }
  | { type: 'mute-changed'; muted: boolean }
  | { type: 'hold-changed'; heldAt: number | null }
  // El teléfono contestó solo la llamada de escucha (`call.offered` con `kind = "monitor"`).
  | {
      type: 'monitor-answered'
      callId: string
      customer: string
      agentName: string | null
      at: number
    }

export const IDLE_CALL: CallState = { status: 'idle' }

// Cada `from*` devuelve el estado siguiente, o null si el evento no aplica a ese estado.

const fromIdle = (event: CallEvent): CallState | null => {
  if (event.type === 'incoming') return { status: 'incoming', from: event.from }
  if (event.type === 'dial') return { status: 'outgoing', to: event.to }
  if (event.type === 'monitor-answered') {
    const { callId, customer, agentName, at } = event
    return { status: 'monitoring', callId, customer, agentName, startedAt: at }
  }
  return null
}

// Salir (endpoint 16 o colgar) espera, como colgar, a que el proveedor suelte la línea.
const fromMonitoring = (
  state: Extract<CallState, { status: 'monitoring' }>,
  event: CallEvent,
): CallState | null => {
  switch (event.type) {
    case 'hangup':
      return { status: 'ending', peer: state.customer }
    case 'disconnected':
      return IDLE_CALL
    default:
      return null
  }
}

const fromIncoming = (
  state: Extract<CallState, { status: 'incoming' }>,
  event: CallEvent,
): CallState | null => {
  switch (event.type) {
    case 'answer':
      return {
        status: 'in-call',
        peer: state.from,
        startedAt: event.at,
        muted: false,
        heldAt: null,
      }
    case 'reject':
    case 'cancelled':
    case 'disconnected':
      return IDLE_CALL
    default:
      return null
  }
}

const fromOutgoing = (
  state: Extract<CallState, { status: 'outgoing' }>,
  event: CallEvent,
): CallState | null => {
  switch (event.type) {
    case 'accepted':
      return { status: 'in-call', peer: state.to, startedAt: event.at, muted: false, heldAt: null }
    case 'hangup':
    case 'failed':
    case 'disconnected':
      return IDLE_CALL
    default:
      return null
  }
}

// Colgar espera a que el proveedor suelte la línea (`ending`). Si cuelga el otro
// extremo, el proveedor ya la ha soltado y se vuelve a reposo (docs/DECISIONES.md, esqueleto #3).
const fromInCall = (
  state: Extract<CallState, { status: 'in-call' }>,
  event: CallEvent,
): CallState | null => {
  switch (event.type) {
    case 'mute-changed':
      return { ...state, muted: event.muted }
    case 'hold-changed':
      return { ...state, heldAt: event.heldAt }
    case 'hangup':
      return { status: 'ending', peer: state.peer }
    case 'disconnected':
      return IDLE_CALL
    default:
      return null
  }
}

const fromEnding = (event: CallEvent): CallState | null =>
  event.type === 'disconnected' ? IDLE_CALL : null

// Un evento que no aplica al estado actual lo deja igual. Así, un evento atrasado o repetido (de
// otra pestaña o del SDK) nunca deja la llamada en un estado imposible. Las reglas sobre si una
// entrante se acepta (DND, segunda llamada) no están aquí: son de core/agent.
export const transitionCall = (state: CallState, event: CallEvent): CallState => {
  switch (state.status) {
    case 'idle':
      return fromIdle(event) ?? state
    case 'incoming':
      return fromIncoming(state, event) ?? state
    case 'outgoing':
      return fromOutgoing(state, event) ?? state
    case 'in-call':
      return fromInCall(state, event) ?? state
    case 'monitoring':
      return fromMonitoring(state, event) ?? state
    case 'ending':
      return fromEnding(event) ?? state
    default:
      return state satisfies never
  }
}
