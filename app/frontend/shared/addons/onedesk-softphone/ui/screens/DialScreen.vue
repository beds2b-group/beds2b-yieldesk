<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import ActionBar from '../components/ActionBar.vue'
import CountryPicker from '../components/CountryPicker.vue'
import DialKeypad from '../components/DialKeypad.vue'
import SoftphoneIcon from '../components/SoftphoneIcon.vue'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import type { DtmfDigit } from '../../core/call/dtmf.ts'
import type { CountryCode } from '../../core/dialing/countries.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// Pantalla de marcado del diseño, en reposo y mientras suena una saliente. El número lleva delante
// el prefijo del país del selector.
const numberInput = useTemplateRef<HTMLInputElement>('numberInput')
const call = computed(() => session.snapshot.call)
const outgoing = computed(() => call.value.status === 'outgoing')
const shownNumber = computed(() =>
  call.value.status === 'outgoing' ? call.value.to : ui.dialNumber,
)
const canDial = computed(() => session.callActions.has('dial') && ui.canDialNumber)

const pressKey = (digit: DtmfDigit): void => {
  ui.appendDigit(digit)
  session.dispatch({ type: 'press-key', digit })
}

const dial = (): void => {
  if (!canDial.value) return
  session.dispatch({ type: 'dial', to: ui.dialNumber })
  ui.clearDialNumber()
}

// Tras elegir país, el agente sigue escribiendo el número.
const selectCountry = (country: CountryCode): void => {
  ui.selectCountry(country)
  numberInput.value?.focus()
}

const pressMain = (): void => {
  if (outgoing.value) session.dispatch({ type: 'hangup' })
  else dial()
}

const onInput = (event: Event): void => {
  ui.setDialNumber((event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="sp-screen sp-dial" data-testid="dial-screen">
    <div class="sp-dial__field">
      <CountryPicker
        :country="ui.country"
        :countries="ui.countries"
        :disabled="outgoing"
        @select="selectCountry"
      />
      <label class="sp-dial__number" for="sp-dial-number">
        <span class="sp-visually-hidden">{{ t('dial.numberLabel') }}</span>
        <input
          id="sp-dial-number"
          ref="numberInput"
          class="sp-dial__input"
          type="tel"
          inputmode="tel"
          autocomplete="off"
          data-testid="dial-input"
          :value="shownNumber"
          :placeholder="t('dial.placeholder')"
          :readonly="outgoing"
          @input="onInput"
          @keydown.enter.prevent="dial"
        />
      </label>
    </div>
    <p v-if="call.status === 'outgoing'" class="sp-dial__calling" aria-live="polite">
      {{ t('dial.calling', { number: call.to }) }}
    </p>

    <ActionBar />

    <DialKeypad :disabled="outgoing" @press="pressKey" />

    <div class="sp-bottom-row">
      <button
        type="button"
        class="sp-button sp-button--danger-soft"
        :disabled="outgoing || !ui.canDialNumber"
        @click="ui.deleteLastDigit()"
      >
        {{ t('dial.delete') }}
      </button>
      <button
        type="button"
        class="sp-button"
        :class="outgoing ? 'sp-button--danger' : 'sp-button--success'"
        :disabled="!outgoing && !canDial"
        data-testid="dial-main"
        @click="pressMain"
      >
        <SoftphoneIcon :name="outgoing ? 'phone-off' : 'phone'" :size="16" />
        {{ outgoing ? t('dial.hangup') : t('dial.call') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--primary sp-button--square"
        :title="t('dial.agents')"
        :aria-label="t('dial.agents')"
        :disabled="outgoing"
        data-testid="open-agents"
        @click="ui.openAgents()"
      >
        <SoftphoneIcon name="users" :size="22" />
      </button>
    </div>
  </div>
</template>
