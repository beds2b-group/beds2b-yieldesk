// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { COUNTRY_CODES, type CountryCode } from '../core/dialing/countries.ts'

import { DEFAULT_API_BASE, DEFAULT_EDGE, DEFAULT_UI } from './defaults.ts'
import {
  arrayOf,
  booleanValue,
  isRawObject,
  matching,
  nonEmptyString,
  nonNegativeInteger,
  ObjectReader,
  oneOf,
  type ValueParser,
} from './fieldParsers.ts'

import type { Language, SoftphoneConfig, UiConfig, UiPosition } from './SoftphoneConfig.ts'
import type { ProviderId } from '../core/ports/TelephonyProvider.ts'

export type ConfigResult =
  | { ok: true; config: SoftphoneConfig }
  | { ok: false; errors: readonly string[] }

const PROVIDERS: readonly ProviderId[] = ['twilio', 'infobip']
const LANGUAGES: readonly Language[] = ['es', 'en']
const POSITIONS: readonly UiPosition[] = ['bottom-right', 'bottom-left']

const ROOT_KEYS = ['enabled', 'provider', 'apiBase', 'edge', 'ui', 'debug']
const UI_KEYS = ['position', 'zIndex', 'language', 'countries', 'defaultCountry']

// Ruta absoluta del mismo origen: empieza por "/" pero no por "//", que sería otro origen.
const sameOriginPath = matching(/^\/(?!\/)\S*$/, 'a same-origin path such as "/onedesk"')

const country = oneOf(COUNTRY_CODES)

// Al menos un país y sin repetir: el selector necesita algo que mostrar.
const countryList: ValueParser<readonly CountryCode[]> = (value) => {
  const result = arrayOf(country)(value)
  if (!result.ok) return result
  if (result.value.length === 0) return { ok: false, expected: 'a non-empty array' }
  if (new Set(result.value).size !== result.value.length) {
    return { ok: false, expected: 'an array without repeated countries' }
  }
  return result
}

// El país por defecto tiene que estar en la lista. Si no se indica, España si está en la lista y,
// si no, el primero.
const readDefaultCountry = (ui: ObjectReader, countries: readonly CountryCode[]): CountryCode => {
  const fallback = countries.includes(DEFAULT_UI.defaultCountry)
    ? DEFAULT_UI.defaultCountry
    : (countries[0] ?? DEFAULT_UI.defaultCountry)
  const listed = oneOf(countries)
  return ui.optional(
    'defaultCountry',
    (value) => {
      const known = country(value)
      if (!known.ok) return known
      return listed(value).ok
        ? known
        : { ok: false, expected: 'one of the countries in ui.countries' }
    },
    fallback,
  )
}

const readUi = (ui: ObjectReader): UiConfig => {
  ui.rejectUnknownKeys(UI_KEYS)
  const countries = ui.optional('countries', countryList, DEFAULT_UI.countries)
  return {
    position: ui.optional('position', oneOf(POSITIONS), DEFAULT_UI.position),
    zIndex: ui.optional('zIndex', nonNegativeInteger, DEFAULT_UI.zIndex),
    language: ui.optional('language', oneOf(LANGUAGES), DEFAULT_UI.language),
    countries,
    defaultCountry: readDefaultCountry(ui, countries),
  }
}

// Valida el JSON ya parseado de config.json (ADR-009). Devuelve todos los errores a la vez, con la
// ruta de cada clave, para que el error visible en el softphone (architecture.md §8.3) diga qué
// corregir.
export const parseConfig = (raw: unknown): ConfigResult => {
  if (!isRawObject(raw)) return { ok: false, errors: ['config.json must contain a JSON object'] }

  const errors: string[] = []
  const root = new ObjectReader(raw, '', errors)
  root.rejectUnknownKeys(ROOT_KEYS)

  const enabled = root.required('enabled', booleanValue)
  const provider = root.required('provider', oneOf(PROVIDERS))
  const config = {
    enabled,
    provider,
    apiBase: root.optional('apiBase', sameOriginPath, DEFAULT_API_BASE),
    edge: root.optional('edge', nonEmptyString, DEFAULT_EDGE),
    ui: readUi(root.nested('ui')),
    debug: root.optional('debug', booleanValue, false),
  }

  if (errors.length > 0 || enabled === undefined || provider === undefined) {
    return { ok: false, errors }
  }
  return { ok: true, config: { ...config, enabled, provider } }
}
