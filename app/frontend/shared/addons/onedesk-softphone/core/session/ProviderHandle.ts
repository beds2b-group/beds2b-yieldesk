// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { TelephonyProvider } from '../ports/TelephonyProvider.ts'

// Crea el proveedor de voz la primera vez que hace falta. La shell pasa una fábrica que carga el SDK
// con import() (architecture.md §8.5), así que una pestaña que nunca se registra no lo descarga.
export class ProviderHandle {
  private readonly create: () => Promise<TelephonyProvider>
  private readonly onCreated: (provider: TelephonyProvider) => void
  private pending: Promise<TelephonyProvider> | null = null
  private provider: TelephonyProvider | null = null

  // `onCreated` se llama una sola vez, con el proveedor recién creado, para suscribirse a sus eventos.
  constructor(
    create: () => Promise<TelephonyProvider>,
    onCreated: (provider: TelephonyProvider) => void,
  ) {
    this.create = create
    this.onCreated = onCreated
  }

  // El proveedor ya creado, o null. Para las órdenes que no tienen sentido sin registro.
  current(): TelephonyProvider | null {
    return this.provider
  }

  ensure(): Promise<TelephonyProvider> {
    this.pending ??= this.create().then(
      (provider) => {
        this.provider = provider
        this.onCreated(provider)
        return provider
      },
      (error: unknown) => {
        // Si falla la carga (por ejemplo, sin red), el siguiente intento lo vuelve a probar.
        this.pending = null
        throw error
      },
    )
    return this.pending
  }

  destroy(): void {
    this.provider?.destroy()
    this.provider = null
    this.pending = null
  }
}
