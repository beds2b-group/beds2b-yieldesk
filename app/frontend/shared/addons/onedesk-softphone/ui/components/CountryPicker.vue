<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'

import { dialCodeOf, type CountryCode } from '../../core/dialing/countries.ts'
import { flagUrl } from '../assets/flags/flagUrls.ts'
import { createCountryName, matchesCountryQuery } from '../format/countryNames.ts'
import { useI18n } from '../i18n/useI18n.ts'

import SoftphoneIcon from './SoftphoneIcon.vue'

const props = defineProps<{
  country: CountryCode
  countries: readonly CountryCode[]
  disabled?: boolean
}>()

const emit = defineEmits<{ select: [country: CountryCode] }>()

const { t, locale } = useI18n()
const countryName = createCountryName(locale)

// Selector de prefijo del diseño: bandera con desplegable, búsqueda por país o prefijo y la lista
// de config.json en su orden (DECISIONES.md, diseño #2 y #3).
const open = ref(false)
const query = ref('')
const root = useTemplateRef<HTMLElement>('root')
const toggle = useTemplateRef<HTMLButtonElement>('toggle')
const search = useTemplateRef<HTMLInputElement>('search')

const options = computed(() =>
  props.countries
    .map((code) => ({
      code,
      name: countryName(code),
      dialCode: dialCodeOf(code),
      flag: flagUrl(code),
    }))
    .filter((option) => matchesCountryQuery(option.name, option.dialCode, query.value)),
)

const close = (focusToggle = false): void => {
  open.value = false
  if (focusToggle) toggle.value?.focus()
}

const toggleOpen = async (): Promise<void> => {
  if (open.value) {
    close()
    return
  }
  query.value = ''
  open.value = true
  await nextTick()
  search.value?.focus()
}

const pick = (code: CountryCode): void => {
  close()
  emit('select', code)
}

// Intro elige el primero de la búsqueda.
const pickFirst = (): void => {
  const [first] = options.value
  if (first !== undefined) pick(first.code)
}

// Se cierra al salir el foco del selector (clic fuera, tabulador).
const onFocusOut = (event: FocusEvent): void => {
  const next = event.relatedTarget
  if (!(next instanceof Node) || !root.value?.contains(next)) close()
}
</script>

<template>
  <div ref="root" class="sp-country" @focusout="onFocusOut">
    <button
      ref="toggle"
      type="button"
      class="sp-country__toggle"
      data-testid="country-toggle"
      :disabled="disabled"
      :title="countryName(country)"
      :aria-label="t('dial.country', { name: countryName(country) })"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <img class="sp-country__flag" :src="flagUrl(country)" alt="" />
      <SoftphoneIcon name="chevron-down" :size="10" />
    </button>

    <div v-if="open" class="sp-country__menu" data-testid="country-menu">
      <label class="sp-country__search-field" for="sp-country-search">
        <span class="sp-visually-hidden">{{ t('dial.countrySearch') }}</span>
        <input
          id="sp-country-search"
          ref="search"
          v-model="query"
          class="sp-country__search"
          type="search"
          autocomplete="off"
          data-testid="country-search"
          :placeholder="t('dial.countrySearch')"
          @keydown.escape.prevent="close(true)"
          @keydown.enter.prevent="pickFirst"
        />
      </label>
      <ul class="sp-country__list" :aria-label="t('dial.countryList')">
        <li v-for="option in options" :key="option.code">
          <button
            type="button"
            class="sp-country__option"
            :class="{ 'sp-country__option--current': option.code === country }"
            :aria-current="option.code === country ? 'true' : undefined"
            :data-testid="`country-${option.code}`"
            @click="pick(option.code)"
            @keydown.escape.prevent="close(true)"
          >
            <img class="sp-country__flag" :src="option.flag" alt="" />
            <span class="sp-country__name">{{ option.name }}</span>
            <span class="sp-country__code">{{ option.dialCode }}</span>
          </button>
        </li>
      </ul>
      <p v-if="options.length === 0" class="sp-country__empty">{{ t('dial.noCountries') }}</p>
    </div>
  </div>
</template>
