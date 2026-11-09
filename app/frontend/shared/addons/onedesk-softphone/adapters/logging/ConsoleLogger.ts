// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { LogContext, Logger } from '../../core/ports/Logger.ts'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Readonly<Record<LogLevel, number>> = { debug: 0, info: 1, warn: 2, error: 3 }

// Campos que nunca salen en claro (architecture.md §8.1): credenciales, tokens y datos personales,
// como los números de teléfono o la identidad del agente.
const SENSITIVE_KEYS = new Set([
  'authorization',
  'cookie',
  'from',
  'to',
  'number',
  'phone',
  'identity',
  'callerid',
])
const SENSITIVE_PATTERN = /token|password|passwd|secret/i
const REDACTED = '[redacted]'
const MAX_DEPTH = 3

const isSensitive = (key: string): boolean =>
  SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_PATTERN.test(key)

const redact = (value: unknown, depth: number): unknown => {
  if (typeof value !== 'object' || value === null) return value
  if (depth >= MAX_DEPTH) return '[…]'
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1))

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      isSensitive(key) ? REDACTED : redact(entry, depth + 1),
    ]),
  )
}

export interface ConsoleLoggerOptions {
  // Por debajo de este nivel no se escribe nada. `debug` solo con el flag de config.json (§8.4).
  level: LogLevel
  console?: Pick<Console, LogLevel>
}

// Logger de la consola del navegador, con prefijo propio para distinguirlo de los logs de Zammad.
export class ConsoleLogger implements Logger {
  private readonly minimum: number
  private readonly output: Pick<Console, LogLevel>

  constructor({ level, console: output = globalThis.console }: ConsoleLoggerOptions) {
    this.minimum = LEVEL_ORDER[level]
    this.output = output
  }

  debug(message: string, context?: LogContext): void {
    this.write('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.write('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.write('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.write('error', message, context)
  }

  private write(level: LogLevel, message: string, context?: LogContext): void {
    if (LEVEL_ORDER[level] < this.minimum) return
    const line = `[onedesk-softphone] ${message}`
    if (context === undefined) this.output[level](line)
    else this.output[level](line, redact(context, 0))
  }
}
