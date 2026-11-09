// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Piezas pequeñas del validador de config.json. Cada parser comprueba un valor suelto; ObjectReader
// las aplica a las claves de un objeto y acumula los errores con su ruta, para que quien mantiene
// config.json vea todos los fallos a la vez.

export type ParseResult<T> = { ok: true; value: T } | { ok: false; expected: string }

export type ValueParser<T> = (value: unknown) => ParseResult<T>

type RawObject = Readonly<Record<string, unknown>>

export const isRawObject = (value: unknown): value is RawObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const accept = <T>(value: T): ParseResult<T> => ({ ok: true, value })
const expect = (expected: string): ParseResult<never> => ({ ok: false, expected })

export const booleanValue: ValueParser<boolean> = (value) =>
  typeof value === 'boolean' ? accept(value) : expect('a boolean')

export const nonEmptyString: ValueParser<string> = (value) =>
  typeof value === 'string' && value.trim() !== '' ? accept(value) : expect('a non-empty string')

export const nonNegativeInteger: ValueParser<number> = (value) =>
  Number.isInteger(value) && (value as number) >= 0
    ? accept(value as number)
    : expect('a non-negative integer')

export const oneOf =
  <const T extends string>(options: readonly T[]): ValueParser<T> =>
  (value) =>
    typeof value === 'string' && (options as readonly string[]).includes(value)
      ? accept(value as T)
      : expect(`one of ${options.map((option) => `"${option}"`).join(', ')}`)

export const matching =
  (pattern: RegExp, description: string): ValueParser<string> =>
  (value) =>
    typeof value === 'string' && pattern.test(value) ? accept(value) : expect(description)

export const arrayOf =
  <T>(item: ValueParser<T>): ValueParser<readonly T[]> =>
  (value) => {
    if (!Array.isArray(value)) return expect('an array')
    const items: T[] = []
    for (const [index, element] of value.entries()) {
      const result = item(element)
      if (!result.ok) return expect(`an array whose item ${index} is ${result.expected}`)
      items.push(result.value)
    }
    return accept(items)
  }

export class ObjectReader {
  private readonly source: RawObject
  private readonly path: string
  private readonly errors: string[]

  constructor(source: RawObject, path: string, errors: string[]) {
    this.source = source
    this.path = path
    this.errors = errors
  }

  required<T>(key: string, parse: ValueParser<T>): T | undefined {
    if (!(key in this.source)) {
      this.errors.push(`${this.pathOf(key)} is required`)
      return undefined
    }
    return this.read(key, parse)
  }

  optional<T>(key: string, parse: ValueParser<T>, fallback: T): T {
    if (!(key in this.source)) return fallback
    return this.read(key, parse) ?? fallback
  }

  // Lector de un objeto anidado. Si la clave falta, lee un objeto vacío y se aplican los valores
  // por defecto de sus claves.
  nested(key: string): ObjectReader {
    const value = this.source[key] ?? {}
    if (isRawObject(value)) return new ObjectReader(value, this.pathOf(key), this.errors)
    this.errors.push(`${this.pathOf(key)} must be an object`)
    return new ObjectReader({}, this.pathOf(key), this.errors)
  }

  // Una clave desconocida suele ser una errata, o algo que no debería estar (una credencial).
  rejectUnknownKeys(allowed: readonly string[]): void {
    for (const key of Object.keys(this.source)) {
      if (!allowed.includes(key)) this.errors.push(`${this.pathOf(key)} is not a known key`)
    }
  }

  private read<T>(key: string, parse: ValueParser<T>): T | undefined {
    const result = parse(this.source[key])
    if (result.ok) return result.value
    this.errors.push(`${this.pathOf(key)} must be ${result.expected}`)
    return undefined
  }

  private pathOf(key: string): string {
    return this.path === '' ? key : `${this.path}.${key}`
  }
}
