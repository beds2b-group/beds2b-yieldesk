<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { useI18n } from '../i18n/useI18n.ts'

// Confirmación de colgar con el cliente en espera (DECISIONES.md, espera #3). Usa los estilos de la
// confirmación de Salir.
const emit = defineEmits<{ cancel: []; confirm: [] }>()
const { t } = useI18n()
</script>

<template>
  <div
    class="sp-confirm"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby="sp-hangup-confirm-text"
    data-testid="hangup-confirm"
  >
    <p id="sp-hangup-confirm-text" class="sp-confirm__text">{{ t('hangup.onHold') }}</p>
    <div class="sp-confirm__buttons">
      <button type="button" class="sp-button" data-testid="cancel-hangup" @click="emit('cancel')">
        {{ t('hangup.cancel') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--danger"
        data-testid="confirm-hangup"
        @click="emit('confirm')"
      >
        {{ t('hangup.confirm') }}
      </button>
    </div>
  </div>
</template>
