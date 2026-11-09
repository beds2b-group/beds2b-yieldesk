// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { MountedSoftphone } from './mountSoftphone.ts'
import type { Logger } from '../../core/ports/Logger.ts'

export interface AgentSessionMountOptions {
  // Devuelve null si no se monta (config.json, enabled: false, o ya montado en la pestaña).
  mount: () => Promise<MountedSoftphone | null>
  logger: Logger
}

// El teléfono está montado mientras haya un agente con sesión en Zammad (architecture.md §5.4).
// Montar y desmontar son asíncronos y los avisos de sesión pueden llegar seguidos (salir y entrar
// con otro usuario): se aplican en orden y cada uno parte de cómo dejó el teléfono el anterior.
export class AgentSessionMount {
  private readonly options: AgentSessionMountOptions
  private mounted: MountedSoftphone | null = null
  private queue: Promise<void> = Promise.resolve()

  constructor(options: AgentSessionMountOptions) {
    this.options = options
  }

  get isMounted(): boolean {
    return this.mounted !== null
  }

  update(signedIn: boolean): Promise<void> {
    this.queue = this.queue.then(() => this.apply(signedIn))
    return this.queue
  }

  private async apply(signedIn: boolean): Promise<void> {
    try {
      if (signedIn && this.mounted === null) {
        this.mounted = await this.options.mount()
      } else if (!signedIn && this.mounted !== null) {
        const { mounted } = this
        this.mounted = null
        await mounted.unmount()
      }
    } catch (error) {
      // Un fallo del teléfono no puede romper Zammad (architecture.md §8.3): el siguiente aviso de
      // sesión lo vuelve a intentar.
      this.options.logger.error('Softphone mount failed', { error })
    }
  }
}
