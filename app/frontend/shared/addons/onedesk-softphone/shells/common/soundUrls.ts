// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import dtmf0 from './sounds/dtmf-0.wav'
import dtmf1 from './sounds/dtmf-1.wav'
import dtmf2 from './sounds/dtmf-2.wav'
import dtmf3 from './sounds/dtmf-3.wav'
import dtmf4 from './sounds/dtmf-4.wav'
import dtmf5 from './sounds/dtmf-5.wav'
import dtmf6 from './sounds/dtmf-6.wav'
import dtmf7 from './sounds/dtmf-7.wav'
import dtmf8 from './sounds/dtmf-8.wav'
import dtmf9 from './sounds/dtmf-9.wav'
import dtmfHash from './sounds/dtmf-hash.wav'
import dtmfStar from './sounds/dtmf-star.wav'
import incoming from './sounds/incoming.mp3'

import type { SoundUrls } from '../../adapters/sounds/HtmlAudioSoundPlayer.ts'

// Sonidos del softphone actual (inventario §3.5), empaquetados con el build: la CSP solo permite
// `media-src 'self'` (DECISIONES.md, adaptadores #3). Los de saliente y desconexión siguen
// pendientes (P6): sin URL, no suenan.
export const SOUND_URLS: SoundUrls = {
  incoming,
  'dtmf-0': dtmf0,
  'dtmf-1': dtmf1,
  'dtmf-2': dtmf2,
  'dtmf-3': dtmf3,
  'dtmf-4': dtmf4,
  'dtmf-5': dtmf5,
  'dtmf-6': dtmf6,
  'dtmf-7': dtmf7,
  'dtmf-8': dtmf8,
  'dtmf-9': dtmf9,
  'dtmf-*': dtmfStar,
  'dtmf-#': dtmfHash,
}
