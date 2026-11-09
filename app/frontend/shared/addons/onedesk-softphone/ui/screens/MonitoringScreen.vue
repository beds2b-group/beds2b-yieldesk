<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import CallStrip from '../components/CallStrip.vue'
import SoftphoneIcon from '../components/SoftphoneIcon.vue'
import { useNow } from '../composables/useNow.ts'
import { formatDuration } from '../format/formatDuration.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()
const now = useNow()

// Pantalla «Escuchando» (DECISIONES.md, panel de supervisión #2): el cliente, el agente, el tiempo y
// Salir (endpoint 16). Sin Silenciar, Espera, Transferir ni teclado: el supervisor solo escucha.
const call = computed(() => session.snapshot.call)
const monitoring = computed(() => (call.value.status === 'monitoring' ? call.value : null))

const detail = computed(() =>
  monitoring.value === null ? '' : formatDuration(monitoring.value.startedAt, now.value),
)

const agentLine = computed(() => {
  const name = monitoring.value?.agentName ?? null
  return name === null ? t('monitoring.unknownAgent') : t('monitoring.agent', { name })
})
</script>

<template>
  <div class="sp-screen sp-monitoring" data-testid="monitoring-screen">
    <p class="sp-monitoring__title">
      <SoftphoneIcon name="headphones" :size="16" />
      {{ t('monitoring.title') }}
    </p>

    <CallStrip :peer="monitoring?.customer ?? ''" :detail="detail" :live="true" />

    <p class="sp-monitoring__agent" data-testid="monitoring-agent">{{ agentLine }}</p>
    <p class="sp-monitoring__hint">{{ t('monitoring.hint') }}</p>

    <div class="sp-bottom-row sp-bottom-row--pair">
      <button
        type="button"
        class="sp-button"
        data-testid="monitoring-open-panel"
        @click="ui.toggleSupervision()"
      >
        <SoftphoneIcon name="eye" :size="16" />
        {{ t('monitoring.panel') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--danger"
        :disabled="!session.callActions.has('stop-monitoring')"
        data-testid="stop-monitoring"
        @click="session.dispatch({ type: 'stop-monitoring' })"
      >
        <SoftphoneIcon name="exit" :size="16" />
        {{ t('monitoring.stop') }}
      </button>
    </div>
  </div>
</template>
