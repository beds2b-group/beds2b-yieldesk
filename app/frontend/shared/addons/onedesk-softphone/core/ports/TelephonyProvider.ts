// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { Subscribable } from './events.ts'
import type { SoftphoneError } from './SoftphoneError.ts'
import type { DtmfDigit } from '../call/dtmf.ts'

// Proveedores de voz soportados (ADR-004). Cada instalación usa uno, elegido en config.json.
export type ProviderId = 'twilio' | 'infobip'

// Eventos neutros que cualquier SDK tiene que traducir. El identificador de la llamada en curso no
// viaja en los eventos: se lee de `callSid` cuando hace falta (por ejemplo, para transferir). La
// entrante sí lleva el suyo, si el proveedor lo da: con él se reconoce la llamada de escucha del
// supervisor (`call.offered`, endpoint 14).
export interface TelephonyEventMap {
  registered: undefined
  unregistered: undefined
  incoming: { from: string; callSid?: string | null }
  ringing: undefined
  accepted: undefined
  disconnected: undefined
  cancelled: undefined
  tokenWillExpire: undefined
  error: SoftphoneError
}

// Puerto del proveedor de voz (architecture.md §5.5, ADR-004). Un adaptador por SDK; los arreglos
// propios de un SDK se quedan dentro de su adaptador. Los fallos llegan como SoftphoneError, por
// rechazo de la promesa o por el evento `error`.
//
// Contrato con el engine:
// - `registered` y `unregistered` son la única fuente del estado del registro: `register()` y
//   `unregister()` solo informan de si la petición se pudo hacer.
// - Los eventos de llamada (`accepted`, `disconnected`, `cancelled`) se refieren a la llamada en
//   curso. Una entrante que llega con otra en curso se emite como `incoming`; si el engine la
//   rechaza con `reject()`, el adaptador no emite nada más sobre ella.
export interface TelephonyProvider extends Subscribable<TelephonyEventMap> {
  // Identificador de la llamada en curso en el proveedor, o null si no hay ninguna.
  readonly callSid: string | null

  register(token: string): Promise<void>
  unregister(): Promise<void>
  updateToken(token: string): void

  call(to: string): Promise<void>
  answer(): void
  // Rechaza la entrante pendiente más reciente, sin tocar la llamada en curso si la hay.
  reject(): void
  hangup(): void

  setMuted(muted: boolean): void
  sendDigits(digits: DtmfDigit): void
  setInputDevice(deviceId: string): Promise<void>

  // Libera el SDK. Después de llamarlo, el proveedor no se vuelve a usar.
  destroy(): void
}
