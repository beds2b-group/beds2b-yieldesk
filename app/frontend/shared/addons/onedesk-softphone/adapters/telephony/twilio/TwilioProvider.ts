// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { EventEmitter, type Listener, type Unsubscribe } from '../../../core/ports/events.ts'
import { SoftphoneError } from '../../../core/ports/SoftphoneError.ts'
import { CallTracker } from '../CallTracker.ts'

import { toSoftphoneError } from './twilioErrors.ts'

import type { CreateTwilioDevice, TwilioCall, TwilioDevice } from './twilioSdk.ts'
import type { DtmfDigit } from '../../../core/call/dtmf.ts'
import type { TelephonyEventMap, TelephonyProvider } from '../../../core/ports/TelephonyProvider.ts'

export interface TwilioProviderOptions {
  createDevice: CreateTwilioDevice
}

// Saliente pedida al SDK que todavía no ha devuelto su Call. Si el agente cuelga o el proveedor se
// destruye mientras tanto, se cuelga en cuanto llega.
interface PlacingCall {
  abandoned: boolean
}

// Proveedor de voz con Twilio (ADR-004). Traduce el Device y las Call del SDK al contrato neutro de
// TelephonyProvider; la configuración del Device (edge, códecs, sonidos) la pone
// createTwilioProvider.ts. Un mismo Device sirve para todos los registros de la sesión: el token
// nuevo se le pasa con updateToken.
export class TwilioProvider implements TelephonyProvider {
  private readonly events = new EventEmitter<TelephonyEventMap>()
  private readonly calls = new CallTracker<TwilioCall>()
  private readonly createDevice: CreateTwilioDevice
  private device: TwilioDevice | null = null
  private placing: PlacingCall | null = null

  constructor({ createDevice }: TwilioProviderOptions) {
    this.createDevice = createDevice
  }

  get callSid(): string | null {
    return this.calls.current?.parameters.CallSid ?? null
  }

  on<TEvent extends keyof TelephonyEventMap>(
    event: TEvent,
    listener: Listener<TelephonyEventMap[TEvent]>,
  ): Unsubscribe {
    return this.events.on(event, listener)
  }

  // Si el registro acaba en `unregistered`, el SDK rechaza la promesa sin motivo. Ese resultado ya
  // lo han contado los eventos `unregistered` y `error`, que son la fuente del estado del registro.
  async register(token: string): Promise<void> {
    try {
      const device = this.deviceWith(token)
      if (device.state === 'registered') this.events.emit('registered', undefined)
      else if (device.state === 'unregistered') await device.register()
    } catch (error) {
      if (error !== undefined) throw toSoftphoneError(error)
    }
  }

  // Un Device que todavía se está registrando no se puede dar de baja: se descarta, para que su
  // registro no llegue después de Salir. El siguiente registro crea otro.
  async unregister(): Promise<void> {
    const { device } = this
    if (device === null) return
    if (device.state !== 'registered') {
      this.discardDevice()
      return
    }
    try {
      await device.unregister()
    } catch (error) {
      throw toSoftphoneError(error)
    }
  }

  updateToken(token: string): void {
    this.device?.updateToken(token)
  }

  async call(to: string): Promise<void> {
    const { device } = this
    if (device?.state !== 'registered') {
      throw new SoftphoneError('not-registered', 'Twilio device not registered')
    }
    if (this.calls.active !== null || this.placing !== null) {
      throw new SoftphoneError('provider', 'A call is already in progress')
    }

    const placing: PlacingCall = { abandoned: false }
    this.placing = placing
    try {
      const call = await device.connect({ params: { To: to } })
      this.calls.startOutgoing(call)
      this.listenToCall(call)
      if (placing.abandoned) call.disconnect()
    } catch (error) {
      throw toSoftphoneError(error)
    } finally {
      this.placing = null
    }
  }

  answer(): void {
    this.calls.answerLatestIncoming()?.accept()
  }

  // Sin eventos: el engine ya sabe que la ha rechazado (contrato del puerto).
  reject(): void {
    this.calls.takeLatestIncoming()?.reject()
  }

  hangup(): void {
    this.abandonPlacing()
    this.calls.active?.disconnect()
  }

  setMuted(muted: boolean): void {
    this.calls.active?.mute(muted)
  }

  // El SDK solo envía tonos con la llamada establecida.
  sendDigits(digits: DtmfDigit): void {
    const call = this.calls.active
    if (call?.status() === 'open') call.sendDigits(digits)
  }

  async setInputDevice(deviceId: string): Promise<void> {
    const audio = this.device?.audio ?? null
    if (audio === null) {
      throw new SoftphoneError('not-registered', 'No Twilio device to set the microphone on')
    }
    try {
      await audio.setInputDevice(deviceId)
    } catch (error) {
      throw toSoftphoneError(error)
    }
  }

  // Destruir el Device rechaza las entrantes y cuelga la llamada en curso.
  destroy(): void {
    this.abandonPlacing()
    this.discardDevice()
    this.calls.clear()
    this.events.clear()
  }

  private deviceWith(token: string): TwilioDevice {
    if (this.device !== null) {
      this.device.updateToken(token)
      return this.device
    }
    const device = this.createDevice(token)
    this.listenToDevice(device)
    this.device = device
    return device
  }

  private discardDevice(): void {
    this.device?.destroy()
    this.device = null
  }

  private abandonPlacing(): void {
    if (this.placing !== null) this.placing.abandoned = true
  }

  private listenToDevice(device: TwilioDevice): void {
    device.on('registered', () => this.events.emit('registered', undefined))
    device.on('unregistered', () => this.events.emit('unregistered', undefined))
    device.on('tokenWillExpire', () => this.events.emit('tokenWillExpire', undefined))
    device.on('incoming', (call) => this.handleIncoming(call))
    device.on('error', (error, call) => this.handleError(error, call))
  }

  private listenToCall(call: TwilioCall): void {
    call.on('ringing', () => this.emitIfActive(call, 'ringing'))
    call.on('accept', () => this.emitIfActive(call, 'accepted'))
    call.on('cancel', () => this.handleEnded(call))
    call.on('disconnect', () => this.handleEnded(call))
    call.on('reject', () => this.calls.end(call))
    call.on('error', (error) => this.handleError(error, call))
  }

  // El Device avisa también con otra llamada en curso (`allowIncomingWhileBusy`): la segunda la
  // rechaza el engine (core/agent), no el SDK.
  private handleIncoming(call: TwilioCall): void {
    this.calls.addIncoming(call)
    this.listenToCall(call)
    this.events.emit('incoming', { from: call.parameters.From ?? '' })
  }

  // La llamada en curso termina con `disconnected`; la entrante que sonaba, con `cancelled`. Las que
  // esperaban detrás terminan sin avisar.
  private handleEnded(call: TwilioCall): void {
    const role = this.calls.end(call)
    if (role === 'active') this.events.emit('disconnected', undefined)
    else if (role === 'ringing') this.events.emit('cancelled', undefined)
  }

  private handleError(error: unknown, call?: TwilioCall): void {
    if (call !== undefined && !this.calls.isReportable(call)) return
    this.events.emit('error', toSoftphoneError(error))
  }

  private emitIfActive(call: TwilioCall, event: 'ringing' | 'accepted'): void {
    if (this.calls.isActive(call)) this.events.emit(event, undefined)
  }
}
