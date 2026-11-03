// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { KeyValueStore } from '../../core/ports/KeyValueStore.ts'
import type { Logger } from '../../core/ports/Logger.ts'

// Prefijo de todas las claves del softphone (architecture.md §8.1): no se mezclan con las de Zammad.
const KEY_PREFIX = 'onedesk-softphone:'

// Almacén sobre localStorage. Si el navegador no deja usarlo (modo privado, cuota llena o
// almacenamiento bloqueado), el teléfono sigue funcionando: solo deja de recordar la sesión.
export class LocalStorageStore implements KeyValueStore {
  private readonly storage: Storage
  private readonly logger: Logger

  constructor(storage: Storage, logger: Logger) {
    this.storage = storage
    this.logger = logger
  }

  get(key: string): string | null {
    return this.attempt('read', key, () => this.storage.getItem(KEY_PREFIX + key)) ?? null
  }

  set(key: string, value: string): void {
    this.attempt('write', key, () => this.storage.setItem(KEY_PREFIX + key, value))
  }

  remove(key: string): void {
    this.attempt('remove', key, () => this.storage.removeItem(KEY_PREFIX + key))
  }

  private attempt<T>(operation: string, key: string, action: () => T): T | undefined {
    try {
      return action()
    } catch (error) {
      this.logger.warn('Local storage unavailable', {
        operation,
        key,
        reason: error instanceof Error ? error.name : 'unknown',
      })
      return undefined
    }
  }
}
