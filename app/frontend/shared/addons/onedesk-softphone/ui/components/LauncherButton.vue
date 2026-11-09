<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import SoftphoneIcon from './SoftphoneIcon.vue'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// Botón flotante que abre y cierra el panel, como el del softphone actual en Zammad (inventario
// §3.3). Con el panel cerrado, el punto muestra el estado del agente y el botón late si suena.
const status = computed(() => session.snapshot.presence?.status ?? null)
const ringing = computed(() => session.snapshot.call.status === 'incoming')
</script>

<template>
  <button
    type="button"
    class="sp-launcher"
    :class="{ 'sp-launcher--ringing': ringing }"
    :aria-expanded="ui.panelOpen"
    :aria-label="ui.panelOpen ? t('launcher.close') : t('launcher.open')"
    data-testid="launcher"
    @click="ui.togglePanel()"
  >
    <SoftphoneIcon :name="ui.panelOpen ? 'close' : 'phone'" :size="24" />
    <span
      v-if="status !== null"
      class="sp-status-dot sp-launcher__dot"
      :class="`sp-status-dot--${status}`"
    />
  </button>
</template>
