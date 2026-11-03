// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { en } from './en.ts'
import { es, type MessageKey, type Messages } from './es.ts'

export type Locale = 'es' | 'en'

export type MessageParams = Readonly<Record<string, string | number>>

export type Translate = (key: MessageKey, params?: MessageParams) => string

const DICTIONARIES: Readonly<Record<Locale, Messages>> = { es, en }

// Sustituye cada `{dato}` por su valor. Un dato que falta se deja tal cual, para que se note.
const interpolate = (template: string, params: MessageParams): string =>
  template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  )

// Traductor para un idioma (architecture.md §8.6). Lo usan la interfaz y la shell, que necesita
// los textos de la notificación de escritorio.
export const createTranslate =
  (locale: Locale): Translate =>
  (key, params = {}) =>
    interpolate(DICTIONARIES[locale][key], params)
