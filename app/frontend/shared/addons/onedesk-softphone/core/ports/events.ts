// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Tipos comunes para los puertos que emiten eventos. Cada suscripción devuelve su propia baja, así
// que quien se suscribe es quien se da de baja, sin referencias al listener.
export type Unsubscribe = () => void

export type Listener<TPayload> = (payload: TPayload) => void

// Un puerto con eventos declara su mapa `nombre → payload`. Los eventos sin datos usan `undefined`.
export interface Subscribable<TEventMap> {
  on<TEvent extends keyof TEventMap>(
    event: TEvent,
    listener: Listener<TEventMap[TEvent]>,
  ): Unsubscribe
}

// Implementación de Subscribable para el engine y los adaptadores, que así no repiten la gestión de
// listeners. Un listener que se da de baja mientras se emite no recibe ese evento ni los siguientes.
export class EventEmitter<TEventMap> implements Subscribable<TEventMap> {
  private readonly listeners = new Map<keyof TEventMap, Set<Listener<never>>>()

  on<TEvent extends keyof TEventMap>(
    event: TEvent,
    listener: Listener<TEventMap[TEvent]>,
  ): Unsubscribe {
    const listeners = this.listeners.get(event) ?? new Set()
    listeners.add(listener)
    this.listeners.set(event, listeners)
    return () => listeners.delete(listener)
  }

  // Se recorre el Set vivo a propósito: un Set no visita los elementos borrados durante el recorrido.
  emit<TEvent extends keyof TEventMap>(event: TEvent, payload: TEventMap[TEvent]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      const typed = listener as Listener<TEventMap[TEvent]>
      typed(payload)
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}
