// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Países que el selector de prefijo sabe mostrar (DECISIONES.md, diseño #3): código ISO 3166-1
// alfa-2 en minúsculas y prefijo internacional. Son los del diseño; añadir uno exige también su
// bandera en el bundle (diseño #2). Qué países ve cada instalación se elige en config.json, y qué
// números se pueden marcar lo decide One-Desk.
export const COUNTRY_DIAL_CODES = {
  es: '+34',
  pt: '+351',
  fr: '+33',
  de: '+49',
  it: '+39',
  gb: '+44',
  ie: '+353',
  nl: '+31',
  be: '+32',
  ch: '+41',
  ad: '+376',
  ma: '+212',
  us: '+1',
  mx: '+52',
  ar: '+54',
  co: '+57',
  cl: '+56',
  pe: '+51',
  ve: '+58',
  ec: '+593',
  uy: '+598',
  br: '+55',
  ro: '+40',
  pl: '+48',
} as const satisfies Record<string, string>

export type CountryCode = keyof typeof COUNTRY_DIAL_CODES

export const COUNTRY_CODES = Object.keys(COUNTRY_DIAL_CODES) as readonly CountryCode[]

export const dialCodeOf = (country: CountryCode): string => COUNTRY_DIAL_CODES[country]

// País del selector cuyo prefijo empieza el número. Si encajan varios, el más largo.
export const detectCountry = (
  number: string,
  countries: readonly CountryCode[],
): CountryCode | null => {
  let found: CountryCode | null = null
  for (const country of countries) {
    const code = dialCodeOf(country)
    if (number.startsWith(code) && (found === null || code.length > dialCodeOf(found).length)) {
      found = country
    }
  }
  return found
}

// Al elegir otro país en el selector: cambia el prefijo del país anterior por el nuevo y conserva el
// resto. Un número sin `+` se queda detrás del prefijo nuevo. Con un prefijo que no es el del país
// anterior no se sabe dónde acaba, así que el número se queda solo con el prefijo nuevo, como en el
// diseño.
export const switchCountryPrefix = (number: string, from: CountryCode, to: CountryCode): string => {
  const previous = dialCodeOf(from)
  if (number.startsWith(previous)) return dialCodeOf(to) + number.slice(previous.length)
  if (number.startsWith('+')) return dialCodeOf(to)
  return dialCodeOf(to) + number
}

// Hay algo que marcar además del prefijo del país.
export const hasNumberToDial = (number: string, country: CountryCode): boolean => {
  const prefix = dialCodeOf(country)
  return number.length > (number.startsWith(prefix) ? prefix.length : 0)
}

// Borrar no quita el prefijo del país: para cambiarlo está el selector.
export const deleteLastDialDigit = (number: string, country: CountryCode): string =>
  number === dialCodeOf(country) ? number : number.slice(0, -1)
