// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { ONE_DESK_ROUTES } from '../../adapters/backend/onedesk/OneDeskBackend.ts'
import { SignalRRealtimeChannel } from '../../adapters/realtime/onedesk/SignalRRealtimeChannel.ts'

import type { Logger } from '../../core/ports/Logger.ts'
import type { RealtimeChannel } from '../../core/ports/RealtimeChannel.ts'

// Hub de One-Desk detrás del proxy (`apiBase`, ADR-012). El SDK de SignalR se descarga con import()
// la primera vez que la pestaña líder conecta: una réplica nunca lo carga.
export const createOneDeskRealtimeChannel = (apiBase: string, logger: Logger): RealtimeChannel =>
  new SignalRRealtimeChannel({
    url: `${apiBase.replace(/\/+$/, '')}${ONE_DESK_ROUTES.eventsHub}`,
    loadConnectionFactory: async () => {
      const { createHubConnectionFactory } =
        await import('../../adapters/realtime/onedesk/createHubConnection.ts')
      return createHubConnectionFactory(logger)
    },
    logger,
  })
