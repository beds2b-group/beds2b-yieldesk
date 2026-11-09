// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { DEFAULT_AGENT_SETTINGS, type AgentSettings } from '../agent/agentSettings.ts'

import type { KeyValueStore } from '../ports/KeyValueStore.ts'
import type { Logger } from '../ports/Logger.ts'

// Claves versionadas (architecture.md §8.2): si cambia la forma de lo guardado, se sube la versión
// y lo antiguo se ignora en lugar de romper el arranque. El adaptador añade el prefijo
// `onedesk-softphone:`.
const SETTINGS_KEY = 'v1:settings'
// Extensión y nombre que guardaba el login del teléfono, que ya no existe (DECISIONES.md, diseño
// #11). Se borra para no dejar datos del agente en el navegador.
const LEGACY_SESSION_KEY = 'v1:session'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Ajustes del agente en el almacén del navegador: solo preferencias, nunca tokens ni datos de la
// sesión (architecture.md §8.1). Un valor dañado se descarta.
export class SettingsPersistence {
  private readonly store: KeyValueStore
  private readonly logger: Logger

  constructor(store: KeyValueStore, logger: Logger) {
    this.store = store
    this.logger = logger
  }

  // Se toma cada ajuste guardado que sea válido; el resto, por defecto. Así, un ajuste nuevo (o uno
  // que desaparece, como DND) no obliga a cambiar de versión.
  loadSettings(): AgentSettings {
    const value = this.read(SETTINGS_KEY)
    if (!isRecord(value)) return DEFAULT_AGENT_SETTINGS

    const settings = { ...DEFAULT_AGENT_SETTINGS }
    for (const key of Object.keys(DEFAULT_AGENT_SETTINGS) as (keyof AgentSettings)[]) {
      const stored = value[key]
      if (typeof stored === 'boolean') settings[key] = stored
    }
    return settings
  }

  saveSettings(settings: AgentSettings): void {
    this.store.set(SETTINGS_KEY, JSON.stringify(settings))
  }

  forgetLegacySession(): void {
    this.store.remove(LEGACY_SESSION_KEY)
  }

  private read(key: string): unknown {
    const raw = this.store.get(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as unknown
    } catch {
      this.logger.warn('Discarding a corrupted stored value', { key })
      this.store.remove(key)
      return null
    }
  }
}
