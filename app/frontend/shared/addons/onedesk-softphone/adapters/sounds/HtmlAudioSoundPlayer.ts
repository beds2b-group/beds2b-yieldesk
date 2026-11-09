// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { Logger } from '../../core/ports/Logger.ts'
import type { PlayOptions, SoundId, SoundPlayer } from '../../core/ports/SoundPlayer.ts'

// URL de cada sonido, del mismo origen (la CSP solo permite `media-src 'self'`). Un sonido sin URL
// no suena: los ficheros de saliente y desconexión están pendientes (decisión P6).
export type SoundUrls = Readonly<Partial<Record<SoundId, string>>>

export interface HtmlAudioSoundPlayerOptions {
  urls: SoundUrls
  logger: Logger
  createAudio?: (url: string) => HTMLAudioElement
}

// Sonidos con elementos <audio>, uno por sonido y reutilizados. Si el navegador bloquea la
// reproducción automática (tras recargar, sin clic del agente), se registra y se sigue: la
// notificación de escritorio avisa igualmente (architecture.md §8.3).
export class HtmlAudioSoundPlayer implements SoundPlayer {
  private readonly urls: SoundUrls
  private readonly logger: Logger
  private readonly createAudio: (url: string) => HTMLAudioElement
  private readonly elements = new Map<SoundId, HTMLAudioElement>()

  constructor({
    urls,
    logger,
    createAudio = (url) => new Audio(url),
  }: HtmlAudioSoundPlayerOptions) {
    this.urls = urls
    this.logger = logger
    this.createAudio = createAudio
  }

  play(id: SoundId, options: PlayOptions = {}): void {
    const audio = this.element(id)
    if (audio === null) return

    audio.loop = options.loop ?? false
    audio.currentTime = 0
    audio.play().catch((error: unknown) => {
      this.logger.warn('Sound blocked by the browser', {
        sound: id,
        reason: error instanceof Error ? error.name : 'unknown',
      })
    })
  }

  stop(id: SoundId): void {
    const audio = this.elements.get(id)
    if (audio === undefined) return
    audio.pause()
    audio.currentTime = 0
  }

  // En el primer clic del agente se reproduce en silencio cada sonido, para que el navegador
  // permita después reproducirlos sin clic.
  async unlock(): Promise<void> {
    const ids = Object.keys(this.urls) as SoundId[]
    await Promise.all(ids.map((id) => this.unlockOne(id)))
  }

  private async unlockOne(id: SoundId): Promise<void> {
    const audio = this.element(id)
    if (audio === null) return
    audio.muted = true
    try {
      await audio.play()
      audio.pause()
      audio.currentTime = 0
    } catch {
      // Sigue bloqueado: se volverá a intentar en el siguiente clic.
    } finally {
      audio.muted = false
    }
  }

  private element(id: SoundId): HTMLAudioElement | null {
    const existing = this.elements.get(id)
    if (existing !== undefined) return existing

    const url = this.urls[id]
    if (url === undefined) return null
    const audio = this.createAudio(url)
    audio.preload = 'auto'
    this.elements.set(id, audio)
    return audio
  }
}
