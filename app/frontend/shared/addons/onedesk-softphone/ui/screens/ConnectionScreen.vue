<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'

const session = useSoftphoneSessionStore()
const { t } = useI18n()

// Mientras no hay sesión de One-Desk (architecture.md §6.1): conectando, el motivo del fallo (el
// teléfono reintenta solo, DECISIONES.md núcleo #1) o desconectado tras Salir.
const state = computed(() => session.snapshot.session)
</script>

<template>
  <div class="sp-connection" data-testid="connection-screen">
    <p v-if="state.status === 'connecting'" class="sp-connection__text">
      {{ t('connection.connecting') }}
    </p>
    <template v-else-if="state.status === 'failed'">
      <p class="sp-connection__text" role="alert">{{ t(`errors.${state.code}`) }}</p>
      <p class="sp-connection__hint">{{ t('connection.retrying') }}</p>
      <button
        type="button"
        class="sp-button sp-button--primary"
        @click="session.dispatch({ type: 'retry' })"
      >
        {{ t('connection.retry') }}
      </button>
    </template>
    <p v-else-if="state.status === 'signed-out'" class="sp-connection__text">
      {{ t('connection.signedOut') }}
    </p>
  </div>
</template>
