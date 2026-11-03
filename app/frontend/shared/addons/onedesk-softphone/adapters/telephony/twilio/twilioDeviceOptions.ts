// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { Call, Device } from '@twilio/voice-sdk'

import type { SoundId } from '../../../core/ports/SoundPlayer.ts'

// URL de los sonidos del mismo origen que da la shell, las mismas que usa HtmlAudioSoundPlayer
// (DECISIONES.md, adaptadores #3).
export type TwilioSoundUrls = Readonly<Partial<Record<SoundId, string>>>

export interface TwilioDeviceSettings {
  // Región por la que va el audio (config.json; `dublin` en producción).
  edge: string
  debug: boolean
  sounds: TwilioSoundUrls
}

const SOUND_NAMES: Readonly<Record<SoundId, Device.SoundName>> = {
  incoming: Device.SoundName.Incoming,
  outgoing: Device.SoundName.Outgoing,
  disconnect: Device.SoundName.Disconnect,
  'dtmf-0': Device.SoundName.Dtmf0,
  'dtmf-1': Device.SoundName.Dtmf1,
  'dtmf-2': Device.SoundName.Dtmf2,
  'dtmf-3': Device.SoundName.Dtmf3,
  'dtmf-4': Device.SoundName.Dtmf4,
  'dtmf-5': Device.SoundName.Dtmf5,
  'dtmf-6': Device.SoundName.Dtmf6,
  'dtmf-7': Device.SoundName.Dtmf7,
  'dtmf-8': Device.SoundName.Dtmf8,
  'dtmf-9': Device.SoundName.Dtmf9,
  'dtmf-*': Device.SoundName.DtmfS,
  'dtmf-#': Device.SoundName.DtmfH,
}

// El SDK descarga de su CDN los sonidos que no tienen URL, y la CSP de Zammad lo bloquea
// (`media-src 'self'`): se le pasan los del mismo origen.
const toTwilioSounds = (urls: TwilioSoundUrls): Partial<Record<Device.SoundName, string>> => {
  const sounds: Partial<Record<Device.SoundName, string>> = {}
  for (const [id, url] of Object.entries(urls) as [SoundId, string | undefined][]) {
    if (url !== undefined) sounds[SOUND_NAMES[id]] = url
  }
  return sounds
}

// Opciones del Device (ADR-004). `allowIncomingWhileBusy` hace que el SDK avise de la segunda
// entrante en vez de ignorarla, para que la rechace el engine (contrato de TelephonyProvider).
export const twilioDeviceOptions = ({
  edge,
  debug,
  sounds,
}: TwilioDeviceSettings): Device.Options => ({
  edge,
  codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
  allowIncomingWhileBusy: true,
  logLevel: debug ? 'debug' : 'warn',
  sounds: toTwilioSounds(sounds),
})
