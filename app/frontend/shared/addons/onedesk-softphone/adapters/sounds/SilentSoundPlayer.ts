// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { SoundPlayer } from '../../core/ports/SoundPlayer.ts'

// Sin sonido (architecture.md §5.5): para las pruebas E2E y para desarrollar sin ruido.
export class SilentSoundPlayer implements SoundPlayer {
  play(): void {}

  stop(): void {}

  unlock(): Promise<void> {
    return Promise.resolve()
  }
}
