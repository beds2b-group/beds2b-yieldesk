<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed, watch } from 'vue'

import LauncherButton from './components/LauncherButton.vue'
import LogoutConfirm from './components/LogoutConfirm.vue'
import SoftphoneHeader from './components/SoftphoneHeader.vue'
import StatusNotices from './components/StatusNotices.vue'
import { useI18n } from './i18n/useI18n.ts'
import AgentsScreen from './screens/AgentsScreen.vue'
import ConnectionScreen from './screens/ConnectionScreen.vue'
import DialScreen from './screens/DialScreen.vue'
import InCallScreen from './screens/InCallScreen.vue'
import IncomingScreen from './screens/IncomingScreen.vue'
import MonitoringScreen from './screens/MonitoringScreen.vue'
import SupervisionScreen from './screens/SupervisionScreen.vue'
import { useSoftphoneSessionStore } from './stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from './stores/onedeskSoftphoneUi.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// La pantalla sale del estado de la llamada (architecture.md §6.4); sin sesión, la de conexión.
// Las de Agentes y Supervisión se abren encima de cualquiera de las demás.
const supervising = computed(() => ui.supervisionOpen && session.canSupervise)

const screen = computed(() => {
  if (session.agent === null) return ConnectionScreen
  if (ui.agentsOpen) return AgentsScreen
  if (supervising.value) return SupervisionScreen
  switch (session.snapshot.call.status) {
    case 'incoming':
      return IncomingScreen
    case 'monitoring':
      return MonitoringScreen
    case 'in-call':
    case 'ending':
      return InCallScreen
    default:
      return DialScreen
  }
})

const callStatus = computed(() => session.snapshot.call.status)

// Una entrante abre el panel. Al empezar o terminar una llamada, se cierran los menús abiertos.
// Agentes se cierra con una entrante nueva, al marcar y al terminar la llamada (también al
// transferirla); al contestar sigue abierta.
watch(callStatus, (status) => {
  if (status === 'incoming') ui.openPanel()
  ui.closePausePanel()
  if (status === 'idle') ui.setConfirmingLogout(false)
  if (status === 'incoming' || status === 'outgoing' || status === 'idle') ui.closeAgents()
  // Supervisión se cierra al empezar a escuchar (se ve «Escuchando») y con una entrante o al marcar.
  if (status === 'monitoring' || status === 'incoming' || status === 'outgoing') {
    ui.closeSupervision()
  }
})
</script>

<template>
  <div class="sp-root">
    <section
      v-show="ui.panelOpen"
      class="sp-panel"
      :class="{ 'sp-panel--wide': supervising }"
      :aria-label="t('launcher.close')"
      data-testid="panel"
    >
      <SoftphoneHeader />
      <StatusNotices />
      <component :is="screen" />
      <LogoutConfirm v-if="ui.confirmingLogout" />
    </section>
    <LauncherButton />
  </div>
</template>
