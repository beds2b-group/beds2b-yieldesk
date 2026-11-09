// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { DtmfDigit } from '../call/dtmf.ts'

// Sonidos propios del mismo origen (inventario §3.5, decisión P6): entrante, saliente,
// desconexión y uno por tecla.
export type SoundId = 'incoming' | 'outgoing' | 'disconnect' | `dtmf-${DtmfDigit}`

export interface PlayOptions {
  loop?: boolean
}

// Puerto de sonidos (architecture.md §5.5). `unlock()` se llama en el primer clic del agente para
// superar la política de reproducción automática del navegador (architecture.md §8.3).
export interface SoundPlayer {
  play(id: SoundId, options?: PlayOptions): void
  stop(id: SoundId): void
  unlock(): Promise<void>
}
