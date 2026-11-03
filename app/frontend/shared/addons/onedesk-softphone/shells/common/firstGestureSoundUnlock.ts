// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { EventEmitter, type Unsubscribe } from '../../core/ports/events.ts'

import type { SoundPlayer } from '../../core/ports/SoundPlayer.ts'
import type { SoundUnlock } from '../../ui/softphoneContext.ts'

interface UnlockEvents {
  unlock: undefined
}

// Gestos que el navegador cuenta como activación del usuario. Llegan a `document` aunque ocurran
// dentro del Shadow DOM del teléfono.
const GESTURES = ['pointerdown', 'keydown'] as const

export interface FirstGestureSoundUnlockOptions {
  // Normalmente `document`: vale un clic o una tecla en cualquier parte de la página.
  target: EventTarget
  sounds: SoundPlayer
  // El navegador ya ha visto un gesto en esta página (`navigator.userActivation.hasBeenActive`).
  alreadyActive: boolean
}

// Desbloquea el sonido con el primer clic o tecla del agente en cualquier parte de la página, no solo
// en el teléfono, porque no hay pantalla de inicio de sesión (DECISIONES.md, diseño #12). Hasta
// entonces, la interfaz muestra el aviso «Sonido desactivado».
export class FirstGestureSoundUnlock implements SoundUnlock {
  private readonly options: FirstGestureSoundUnlockOptions
  private readonly events = new EventEmitter<UnlockEvents>()
  private isLocked: boolean
  private readonly handleGesture = (): void => this.unlock()

  constructor(options: FirstGestureSoundUnlockOptions) {
    this.options = options
    this.isLocked = !options.alreadyActive
    if (this.isLocked) {
      for (const gesture of GESTURES) {
        options.target.addEventListener(gesture, this.handleGesture, { capture: true })
      }
    }
  }

  get locked(): boolean {
    return this.isLocked
  }

  onUnlock(listener: () => void): Unsubscribe {
    return this.events.on('unlock', listener)
  }

  dispose(): void {
    this.removeListeners()
    this.events.clear()
  }

  private unlock(): void {
    this.removeListeners()
    this.isLocked = false
    void this.options.sounds.unlock()
    this.events.emit('unlock', undefined)
  }

  private removeListeners(): void {
    for (const gesture of GESTURES) {
      this.options.target.removeEventListener(gesture, this.handleGesture, { capture: true })
    }
  }
}
