// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { HubConnectionBuilder, LogLevel, type ILogger } from '@microsoft/signalr'

import type { CreateHubConnection, HubConnection } from './signalrSdk.ts'
import type { Logger } from '../../../core/ports/Logger.ts'

// Los mensajes del SDK pasan por el Logger del teléfono, que filtra los datos sensibles. Solo los
// avisos y errores: lo demás es el detalle de cada negociación.
const toSdkLogger = (logger: Logger): ILogger => ({
  log(level, message) {
    if (level >= LogLevel.Error) logger.error('SignalR', { message })
    else if (level >= LogLevel.Warning) logger.warn('SignalR', { message })
  },
})

// Único módulo que importa @microsoft/signalr: el SDK va en su propio chunk y solo lo descarga la
// pestaña líder. La cookie de la sesión va sola, porque el hub está en el mismo origen (/onedesk).
// La reconexión automática cubre los cortes breves (0, 2, 10 y 30 s); si no lo consigue, la conexión
// se cierra y RealtimeController vuelve a empezar, renovando la sesión si hace falta.
export const createHubConnectionFactory =
  (logger: Logger): CreateHubConnection =>
  (url): HubConnection =>
    new HubConnectionBuilder()
      .withUrl(url)
      .withAutomaticReconnect()
      .configureLogging(toSdkLogger(logger))
      .build()
