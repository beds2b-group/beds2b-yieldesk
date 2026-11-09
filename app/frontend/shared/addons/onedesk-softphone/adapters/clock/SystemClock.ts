// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { CancelTask, Clock } from '../../core/ports/Clock.ts'

// Reloj real del navegador.
export class SystemClock implements Clock {
  now(): number {
    return Date.now()
  }

  schedule(delayMs: number, task: () => void): CancelTask {
    const timer = setTimeout(task, delayMs)
    return () => clearTimeout(timer)
  }
}
