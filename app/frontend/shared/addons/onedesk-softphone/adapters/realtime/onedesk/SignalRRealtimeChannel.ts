// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { EventEmitter, type Listener, type Unsubscribe } from '../../../core/ports/events.ts'
import { SoftphoneError, type SoftphoneErrorCode } from '../../../core/ports/SoftphoneError.ts'
import {
  readAgentStatusChange,
  readCallOffer,
  readSupervisionCallUpdate,
} from '../../backend/onedesk/oneDeskContracts.ts'

import type { CreateHubConnection, HubConnection } from './signalrSdk.ts'
import type { Logger } from '../../../core/ports/Logger.ts'
import type { RealtimeChannel, RealtimeEventMap } from '../../../core/ports/RealtimeChannel.ts'

// Nombres de los eventos del hub (EventsHubContract de One-Desk) que atiende el teléfono, con su
// lectura. Los demás (`call.answered`, `transfer.*`…) llegarán cuando una pantalla los necesite.
export const HUB_EVENTS = {
  agentStatusChanged: 'agent.status_changed',
  callOffered: 'call.offered',
  supervisionCallUpdated: 'supervision.call_updated',
} as const

type HubEvent = keyof typeof HUB_EVENTS

const READERS: { [TEvent in HubEvent]: (message: unknown) => RealtimeEventMap[TEvent] } = {
  agentStatusChanged: readAgentStatusChange,
  callOffered: readCallOffer,
  supervisionCallUpdated: readSupervisionCallUpdate,
}

export interface SignalRRealtimeChannelOptions {
  // URL del hub detrás del proxy, por ejemplo /onedesk/hubs/events.
  url: string
  // Carga el SDK con import() la primera vez que se conecta.
  loadConnectionFactory: () => Promise<CreateHubConnection>
  logger: Logger
}

const statusCodeOf = (error: unknown): number | null =>
  typeof error === 'object' &&
  error !== null &&
  'statusCode' in error &&
  typeof error.statusCode === 'number'
    ? error.statusCode
    : null

// La negociación responde 401 sin sesión de One-Desk y 403 si el agente está desactivado; cualquier
// otro fallo (sin red, proxy sin WebSocket…) es `network`.
const toSoftphoneError = (operation: string, error: unknown): SoftphoneError => {
  const statusCode = statusCodeOf(error)
  const code: SoftphoneErrorCode =
    statusCode === 401 ? 'unauthenticated' : statusCode === 403 ? 'forbidden' : 'network'
  const detail = statusCode === null ? 'no response' : `HTTP ${statusCode}`
  return new SoftphoneError(code, `${operation}: ${detail}`, { cause: error })
}

// Hub de One-Desk con SignalR (ENDPOINTS_MVP.md §18). Traduce sus mensajes al núcleo y sus fallos a
// SoftphoneError; cuándo conectar y cuándo reintentar lo decide RealtimeController.
export class SignalRRealtimeChannel implements RealtimeChannel {
  private readonly options: SignalRRealtimeChannelOptions
  private readonly events = new EventEmitter<RealtimeEventMap>()
  private connection: Promise<HubConnection> | null = null

  constructor(options: SignalRRealtimeChannelOptions) {
    this.options = options
  }

  on<TEvent extends keyof RealtimeEventMap>(
    event: TEvent,
    listener: Listener<RealtimeEventMap[TEvent]>,
  ): Unsubscribe {
    return this.events.on(event, listener)
  }

  async connect(): Promise<void> {
    const connection = await this.ensureConnection()
    if (connection.state !== 'Disconnected') return
    try {
      await connection.start()
    } catch (error) {
      throw toSoftphoneError('realtime', error)
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection === null) return
    const connection = await this.connection
    await connection.stop()
  }

  private ensureConnection(): Promise<HubConnection> {
    this.connection ??= this.options.loadConnectionFactory().then(
      (create) => this.listenTo(create(this.options.url)),
      (error: unknown) => {
        // Si falla la descarga del SDK (por ejemplo, sin red), el siguiente intento lo vuelve a probar.
        this.connection = null
        throw toSoftphoneError('realtime', error)
      },
    )
    return this.connection
  }

  private forward<TEvent extends HubEvent>(connection: HubConnection, event: TEvent): void {
    connection.on(HUB_EVENTS[event], (message: unknown) => {
      let payload: RealtimeEventMap[TEvent]
      try {
        payload = READERS[event](message)
      } catch (error) {
        // Un mensaje que no cumple el contrato se ignora: no debe tumbar la conexión.
        this.options.logger.warn('Ignored realtime message', {
          event: HUB_EVENTS[event],
          reason: error instanceof Error ? error.message : 'unknown',
        })
        return
      }
      this.events.emit(event, payload)
    })
  }

  private listenTo(connection: HubConnection): HubConnection {
    const { logger } = this.options
    for (const event of Object.keys(HUB_EVENTS) as HubEvent[]) this.forward(connection, event)
    connection.onreconnecting(() => logger.warn('Realtime channel reconnecting'))
    connection.onreconnected(() => {
      logger.info('Realtime channel reconnected')
      this.events.emit('reconnected', undefined)
    })
    connection.onclose((error) => {
      this.events.emit(
        'closed',
        error === undefined ? null : toSoftphoneError('realtime closed', error),
      )
    })
    return connection
  }
}
