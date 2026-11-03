// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { computed, ref, type ComputedRef, type Ref } from 'vue'

import {
  deleteLastDialDigit,
  detectCountry,
  dialCodeOf,
  hasNumberToDial,
  switchCountryPrefix,
  type CountryCode,
} from '../../core/dialing/countries.ts'
import { sanitizeDialInput } from '../../core/dialing/dialInput.ts'

import type { DialingOptions } from '../softphoneContext.ts'

export interface PhoneNumber {
  country: Ref<CountryCode>
  number: Ref<string>
  // Hay algo más que el prefijo del país.
  hasNumber: ComputedRef<boolean>
  setNumber(value: string): void
  selectCountry(next: CountryCode): void
  appendDigit(digit: string): void
  deleteLastDigit(): void
  clear(): void
}

// Número con el prefijo del país del selector delante, como en el diseño (DECISIONES.md, selector
// de país #3). Lo usan el marcado y el número externo de la pantalla Agentes.
export const usePhoneNumber = (dialing: DialingOptions): PhoneNumber => {
  const country = ref<CountryCode>(dialing.defaultCountry)
  const number = ref(dialCodeOf(dialing.defaultCountry))
  const hasNumber = computed(() => hasNumberToDial(number.value, country.value))

  // Si lo escrito empieza por el prefijo de otro país del selector, el selector lo sigue.
  const setNumber = (value: string): void => {
    number.value = sanitizeDialInput(value)
    const detected = detectCountry(number.value, dialing.countries)
    if (detected !== null) country.value = detected
  }

  const selectCountry = (next: CountryCode): void => {
    number.value = switchCountryPrefix(number.value, country.value, next)
    country.value = next
  }

  const appendDigit = (digit: string): void => {
    setNumber(number.value + digit)
  }

  const deleteLastDigit = (): void => {
    number.value = deleteLastDialDigit(number.value, country.value)
  }

  // Queda solo el prefijo del país, listo para el siguiente número.
  const clear = (): void => {
    number.value = dialCodeOf(country.value)
  }

  return {
    country,
    number,
    hasNumber,
    setNumber,
    selectCountry,
    appendDigit,
    deleteLastDigit,
    clear,
  }
}
