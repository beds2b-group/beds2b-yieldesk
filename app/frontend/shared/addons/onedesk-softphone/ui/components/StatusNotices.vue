<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import { retriesAutomatically } from '../../core/registration/retryPolicy.ts'
import { errorMessage } from '../format/errorMessage.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import SoftphoneIcon from './SoftphoneIcon.vue'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// Avisos sobre la pantalla (architecture.md §8.3): el registro, el último error y el sonido.
// El agente siempre ve por qué el teléfono no suena (architecture.md §1, objetivo 1).
const registration = computed(() => session.snapshot.registration)

const actionError = computed(() => session.snapshot.error)

// Sin canal en tiempo real One-Desk deja de ofrecer llamadas al agente: se avisa mientras se
// recupera (DECISIONES.md, canal #5).
const realtimeLost = computed(() => session.agent !== null && session.snapshot.realtime === 'lost')

// Solo suena la pestaña líder, así que el aviso solo tiene sentido en ella (DECISIONES.md,
// diseño #12).
const showSoundNotice = computed(
  () => ui.soundLocked && session.tabRole === 'leader' && session.agent !== null,
)
</script>

<template>
  <div class="sp-notices" aria-live="polite">
    <p
      v-if="registration.status === 'registering'"
      class="sp-notice sp-notice--info"
      data-testid="notice-registering"
    >
      {{ t('connection.registering') }}
    </p>
    <div
      v-else-if="registration.status === 'error'"
      class="sp-notice sp-notice--error"
      role="alert"
      data-testid="notice-registration-error"
    >
      <p class="sp-notice__text">
        {{ t(`errors.${registration.code}`) }}
        <template v-if="retriesAutomatically(registration.code)">
          {{ t('connection.retrying') }}
        </template>
      </p>
      <button type="button" class="sp-notice__action" @click="session.dispatch({ type: 'retry' })">
        {{ t('connection.retry') }}
      </button>
    </div>

    <p
      v-if="realtimeLost"
      class="sp-notice sp-notice--warning"
      role="status"
      data-testid="notice-realtime"
    >
      {{ t('connection.realtimeLost') }}
    </p>

    <div
      v-if="actionError !== null"
      class="sp-notice sp-notice--error"
      role="alert"
      data-testid="notice-error"
    >
      <p class="sp-notice__text">{{ errorMessage(t, actionError) }}</p>
      <button
        type="button"
        class="sp-notice__dismiss"
        :aria-label="t('notice.dismiss')"
        @click="session.dispatch({ type: 'dismiss-error' })"
      >
        <SoftphoneIcon name="close" :size="14" />
      </button>
    </div>

    <p v-if="showSoundNotice" class="sp-notice sp-notice--warning" data-testid="notice-sound">
      <SoftphoneIcon name="bell-off" :size="14" />
      {{ t('notice.soundLocked') }}
    </p>
  </div>
</template>
