<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { DTMF_DIGITS, type DtmfDigit } from '../../core/call/dtmf.ts'
import { useI18n } from '../i18n/useI18n.ts'

defineProps<{ disabled?: boolean }>()

const emit = defineEmits<{ press: [digit: DtmfDigit] }>()

const { t } = useI18n()
</script>

<template>
  <div class="sp-keypad" role="group" :aria-label="t('keypad.label')">
    <button
      v-for="digit in DTMF_DIGITS"
      :key="digit"
      type="button"
      class="sp-keypad__key"
      :disabled="disabled"
      @click="emit('press', digit)"
    >
      {{ digit }}
    </button>
  </div>
</template>
