// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { Device } from '@twilio/voice-sdk'

import { twilioDeviceOptions, type TwilioDeviceSettings } from './twilioDeviceOptions.ts'
import { TwilioProvider } from './TwilioProvider.ts'

import type { TwilioDevice } from './twilioSdk.ts'

// Único módulo que importa el SDK: la shell lo carga con import() solo si config.json pide Twilio,
// y así el SDK va en su propio chunk (ADR-004, architecture.md §8.5).
//
// El tono de entrante lo pone el engine con SoundPlayer, porque depende del timbre silenciado del
// agente (core/agent); el del SDK se apaga para que no suene dos veces. El de saliente también se
// apaga: en una saliente el agente ya oye el tono de llamada de la conferencia de One-Desk, y el
// SDK no tiene fichero propio de ese sonido, así que lo pediría a su CDN y la CSP lo bloquearía
// (DECISIONES.md, «Sonido de colgar»).
export const createTwilioDevice =
  (settings: TwilioDeviceSettings) =>
  (token: string): TwilioDevice => {
    const device = new Device(token, twilioDeviceOptions(settings))
    device.audio?.incoming(false)
    device.audio?.outgoing(false)
    return device
  }

export const createTwilioProvider = (settings: TwilioDeviceSettings): TwilioProvider =>
  new TwilioProvider({ createDevice: createTwilioDevice(settings) })
