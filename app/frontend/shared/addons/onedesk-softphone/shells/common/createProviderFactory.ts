// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { SoftphoneError } from '../../core/ports/SoftphoneError.ts'

import { SOUND_URLS } from './soundUrls.ts'

import type { SoftphoneConfig } from '../../config/SoftphoneConfig.ts'
import type { TelephonyProvider } from '../../core/ports/TelephonyProvider.ts'

// Fábrica del proveedor de voz de config.json. El SDK se descarga con import() la primera vez que el
// engine lo pide, en su propio chunk: una réplica nunca lo carga (ADR-004, architecture.md §8.5).
export const createProviderFactory = (
  config: Pick<SoftphoneConfig, 'provider' | 'edge' | 'debug'>,
): (() => Promise<TelephonyProvider>) => {
  switch (config.provider) {
    case 'twilio':
      return async () => {
        const { createTwilioProvider } =
          await import('../../adapters/telephony/twilio/createTwilioProvider.ts')
        return createTwilioProvider({ edge: config.edge, debug: config.debug, sounds: SOUND_URLS })
      }
    case 'infobip':
      return () =>
        Promise.reject(new SoftphoneError('provider', 'The Infobip provider is not available yet'))
    default:
      return config.provider satisfies never
  }
}
