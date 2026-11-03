// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

export type LogContext = Readonly<Record<string, unknown>>

// Puerto de logs (architecture.md §8.4). Nunca se registran tokens, contraseñas ni números
// completos: el adaptador filtra los campos sensibles, pero quien registra no los envía
// (architecture.md §8.1).
export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
}
