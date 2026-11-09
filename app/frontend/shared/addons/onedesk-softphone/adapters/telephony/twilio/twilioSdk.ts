// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Lo que TwilioProvider usa de @twilio/voice-sdk, y nada más. El adaptador depende de este contrato
// y no del SDK: así se prueba sin red ni navegador, y el SDK solo lo importa
// createTwilioProvider.ts, que la shell carga con import() (ADR-004). El type-check de ese fichero
// comprueba que el Device y la Call reales cumplen estas interfaces.

// Estados de Device.State y Call.State que el adaptador consulta.
export type TwilioDeviceState = 'destroyed' | 'unregistered' | 'registering' | 'registered'

export type TwilioCallStatus =
  | 'closed'
  | 'connecting'
  | 'open'
  | 'pending'
  | 'reconnecting'
  | 'ringing'

export type TwilioCallEvent = 'ringing' | 'accept' | 'cancel' | 'disconnect' | 'reject' | 'error'

export interface TwilioCall {
  // `CallSid` y `From` llegan del SDK. En una saliente, `CallSid` aparece cuando Twilio la crea.
  readonly parameters: Readonly<Record<string, string>>

  status(): TwilioCallStatus
  accept(): void
  reject(): void
  disconnect(): void
  mute(shouldMute: boolean): void
  sendDigits(digits: string): void

  on(event: 'error', listener: (error: unknown) => void): unknown
  on(event: Exclude<TwilioCallEvent, 'error'>, listener: () => void): unknown
}

export interface TwilioAudio {
  setInputDevice(deviceId: string): Promise<void>
}

export interface TwilioDevice {
  readonly state: TwilioDeviceState
  readonly audio: TwilioAudio | null

  register(): Promise<void>
  unregister(): Promise<void>
  updateToken(token: string): void
  connect(options: { params: Record<string, string> }): Promise<TwilioCall>
  destroy(): void

  on(event: 'incoming', listener: (call: TwilioCall) => void): unknown
  // `call` viene cuando el fallo es de una llamada concreta.
  on(event: 'error', listener: (error: unknown, call?: TwilioCall) => void): unknown
  on(event: 'registered' | 'unregistered' | 'tokenWillExpire', listener: () => void): unknown
}

// Crea un Device ya configurado con el token del agente.
export type CreateTwilioDevice = (token: string) => TwilioDevice
