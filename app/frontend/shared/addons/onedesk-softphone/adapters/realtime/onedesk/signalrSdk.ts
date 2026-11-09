// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Lo que SignalRRealtimeChannel usa de @microsoft/signalr, y nada más. El adaptador depende de este
// contrato y no del SDK: así se prueba sin red, y el SDK solo lo importa createHubConnection.ts, que
// se carga con import() en la pestaña líder (como el de Twilio, ADR-004). El type-check de ese
// fichero comprueba que la HubConnection real cumple esta interfaz.

// Valores de HubConnectionState.
export type HubConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Disconnecting'
  | 'Reconnecting'

export interface HubConnection {
  readonly state: HubConnectionState

  start(): Promise<void>
  stop(): Promise<void>
  on(methodName: string, handler: (...args: unknown[]) => void): void
  // Sin reconexión posible (o tras stop()), con el fallo si lo hubo.
  onclose(callback: (error?: Error) => void): void
  onreconnecting(callback: (error?: Error) => void): void
  onreconnected(callback: (connectionId?: string) => void): void
}

// Crea la conexión con el hub, sin abrirla.
export type CreateHubConnection = (url: string) => HubConnection
