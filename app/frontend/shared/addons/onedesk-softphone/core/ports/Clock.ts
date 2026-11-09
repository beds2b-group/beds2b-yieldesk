// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Cancela una tarea programada. Llamarla después de que la tarea se haya ejecutado no hace nada.
export type CancelTask = () => void

// Puerto del tiempo, para que los reintentos, la renovación del token y los temporizadores se
// prueben sin esperar.
export interface Clock {
  // Epoch en milisegundos.
  now(): number
  schedule(delayMs: number, task: () => void): CancelTask
}
