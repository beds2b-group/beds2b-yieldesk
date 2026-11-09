// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { canStartCall, type RegistrationState } from '../registration/registrationMachine.ts'

import type { CallState } from './callMachine.ts'

export type CallAction =
  | 'dial'
  | 'redial'
  | 'answer'
  | 'reject'
  | 'hangup'
  | 'mute'
  | 'dtmf'
  | 'transfer'
  // A un número externo solo con la llamada contestada: One-Desk responde `call_not_active` si suena
  // (DECISIONES.md, transferencia #8).
  | 'transfer-external'
  | 'hold'
  | 'resume'
  // Supervisión: escuchar una llamada desde el panel y salir de ella.
  | 'monitor'
  | 'stop-monitoring'

export interface CallActionContext {
  call: CallState
  registration: RegistrationState
  // Hay un número anterior para rellamar (solo en memoria, architecture.md §8.2).
  hasLastDialed: boolean
  // Hay una transferencia pedida y sin contestar: no se pide otra (DECISIONES.md, núcleo #3).
  transferPending: boolean
}

const NO_ACTIONS: ReadonlySet<CallAction> = new Set()

// Acciones que la interfaz habilita en cada estado (architecture.md §5.4, prompt §7.3). Es la única
// fuente: un botón que no está aquí se muestra deshabilitado. Así se evita, por ejemplo, el Mute
// activo sin llamada del softphone actual (ADR-006).
export const availableCallActions = ({
  call,
  registration,
  hasLastDialed,
  transferPending,
}: CallActionContext): ReadonlySet<CallAction> => {
  switch (call.status) {
    case 'idle':
      // Escuchar exige además el rol de supervisión: lo comprueba SupervisionController.
      if (!canStartCall(registration)) return NO_ACTIONS
      return new Set<CallAction>(
        hasLastDialed ? ['dial', 'redial', 'monitor'] : ['dial', 'monitor'],
      )
    case 'incoming':
      // También se transfiere mientras suena, pero solo a un compañero (DECISIONES.md, núcleo #4 y
      // transferencia #8). Con la transferencia pedida ya no se contesta: One-Desk cancela el tramo
      // de este agente.
      if (transferPending) return new Set<CallAction>(['reject'])
      return new Set<CallAction>(['answer', 'reject', 'transfer'])
    case 'outgoing':
      return new Set<CallAction>(['hangup'])
    case 'in-call': {
      // En espera siguen Silenciar, el teclado y Transferir (DECISIONES.md, espera #2; One-Desk le
      // quita la espera al cliente cuando contesta el destino).
      const actions: CallAction[] = [
        'hangup',
        'mute',
        'dtmf',
        call.heldAt === null ? 'hold' : 'resume',
      ]
      if (!transferPending) actions.push('transfer', 'transfer-external')
      return new Set(actions)
    }
    // Escuchando no se habla: solo se puede salir (DECISIONES.md, supervisión #2).
    case 'monitoring':
      return new Set<CallAction>(['stop-monitoring'])
    case 'ending':
      return NO_ACTIONS
    default:
      return call satisfies never
  }
}
