// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

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
