// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import disconnect from './sounds/disconnect.wav?no-inline'
import dtmf0 from './sounds/dtmf-0.wav?no-inline'
import dtmf1 from './sounds/dtmf-1.wav?no-inline'
import dtmf2 from './sounds/dtmf-2.wav?no-inline'
import dtmf3 from './sounds/dtmf-3.wav?no-inline'
import dtmf4 from './sounds/dtmf-4.wav?no-inline'
import dtmf5 from './sounds/dtmf-5.wav?no-inline'
import dtmf6 from './sounds/dtmf-6.wav?no-inline'
import dtmf7 from './sounds/dtmf-7.wav?no-inline'
import dtmf8 from './sounds/dtmf-8.wav?no-inline'
import dtmf9 from './sounds/dtmf-9.wav?no-inline'
import dtmfHash from './sounds/dtmf-hash.wav?no-inline'
import dtmfStar from './sounds/dtmf-star.wav?no-inline'
import incoming from './sounds/incoming.mp3?no-inline'
import silence from './sounds/silence.wav?no-inline'

import type { SoundUrls } from '../../adapters/sounds/HtmlAudioSoundPlayer.ts'

// Sonidos del softphone actual (inventario §3.5), empaquetados con el build: la CSP solo permite
// `media-src 'self'` (DECISIONES.md, adaptadores #3). Con `?no-inline` siempre salen como fichero: Vite
// incrusta como `data:` los de menos de 4 KB, y el SDK de Twilio los descarga con fetch, que la CSP
// (`connect-src`) no deja para `data:`. El de colgar es propio, generado con
// scripts/generate-sounds.mjs. El de saliente es un silencio: el SDK lo tiene apagado, porque el tono
// de llamada ya lo pone la conferencia, pero lo descarga al crear el Device y, sin URL propia, iría
// al CDN de Twilio, que la CSP bloquea (DECISIONES.md, «Sonido de colgar»).
export const SOUND_URLS: SoundUrls = {
  incoming,
  outgoing: silence,
  disconnect,
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
