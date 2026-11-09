// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { EventEmitter, type Listener, type Unsubscribe } from '../ports/events.ts'

import type { SoftphoneSnapshot } from './snapshot.ts'

interface EngineStateEvents {
  change: SoftphoneSnapshot
}

// Foto del teléfono en la pestaña líder. Los controladores la leen y la cambian por partes; cada
// cambio real produce una foto nueva (nunca se modifica la anterior) y se avisa a los suscriptores.
export class EngineState {
  private current: SoftphoneSnapshot
  private readonly events = new EventEmitter<EngineStateEvents>()

  constructor(initial: SoftphoneSnapshot) {
    this.current = initial
  }

  get snapshot(): SoftphoneSnapshot {
    return this.current
  }

  patch(changes: Partial<SoftphoneSnapshot>): void {
    const keys = Object.keys(changes) as (keyof SoftphoneSnapshot)[]
    if (keys.every((key) => changes[key] === this.current[key])) return

    this.current = { ...this.current, ...changes }
    this.events.emit('change', this.current)
  }

  subscribe(listener: Listener<SoftphoneSnapshot>): Unsubscribe {
    return this.events.on('change', listener)
  }

  clear(): void {
    this.events.clear()
  }
}
