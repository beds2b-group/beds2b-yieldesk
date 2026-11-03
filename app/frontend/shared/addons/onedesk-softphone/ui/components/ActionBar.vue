<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import PauseReasonPanel from './PauseReasonPanel.vue'
import SoftphoneIcon from './SoftphoneIcon.vue'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// Fila de acciones del diseño, con 4 botones: no hay DND (DECISIONES.md, diseño #4) y «Silenciar»
// es el timbre, no el micrófono (diseño #5).
const ringMuted = computed(() => session.snapshot.settings.ringMuted)
const paused = computed(() => session.snapshot.presence?.status === 'paused')
const pauseActive = computed(() => paused.value || ui.pausePanelOpen)

const pauseLabel = computed(() => {
  if (!paused.value) return t('actions.pause')
  const icon = session.currentPauseReason?.icon
  return icon == null ? t('actions.resume') : `${icon} ${t('actions.resume')}`
})

const toggleRingMuted = (): void => {
  session.dispatch({ type: 'update-settings', settings: { ringMuted: !ringMuted.value } })
}

// En pausa, el botón vuelve a disponible; si no, abre los motivos (diseño #9).
const pressPause = (): void => {
  if (paused.value) session.dispatch({ type: 'set-status', change: { status: 'available' } })
  else ui.togglePausePanel()
}

// Con una llamada, Salir la cuelga: antes se pide confirmación.
const logout = (): void => {
  if (session.snapshot.call.status === 'idle') session.dispatch({ type: 'logout' })
  else ui.setConfirmingLogout(true)
}
</script>

<template>
  <div class="sp-actions" role="toolbar" :aria-label="t('actions.label')">
    <button
      type="button"
      class="sp-actions__button"
      :disabled="!session.callActions.has('redial')"
      :title="t('actions.redial')"
      @click="session.dispatch({ type: 'redial' })"
    >
      <SoftphoneIcon name="redial" />
      <span class="sp-actions__label">{{ t('actions.redial') }}</span>
    </button>
    <button
      type="button"
      class="sp-actions__button"
      :class="{ 'sp-actions__button--on': ringMuted }"
      :aria-pressed="ringMuted"
      :title="ringMuted ? t('actions.ringUnmuteTitle') : t('actions.ringMuteTitle')"
      @click="toggleRingMuted"
    >
      <SoftphoneIcon name="bell-off" />
      <span class="sp-actions__label">{{ t('actions.ringMute') }}</span>
    </button>
    <button
      type="button"
      class="sp-actions__button"
      :class="{ 'sp-actions__button--paused': pauseActive }"
      :disabled="!session.canChangeStatus"
      :aria-expanded="paused ? undefined : ui.pausePanelOpen"
      :title="paused ? t('actions.resumeTitle') : t('actions.pause')"
      data-testid="pause-button"
      @click="pressPause"
    >
      <SoftphoneIcon :name="paused ? 'play' : 'pause'" />
      <span class="sp-actions__label">{{ pauseLabel }}</span>
    </button>
    <button
      type="button"
      class="sp-actions__button"
      :title="t('actions.logout')"
      data-testid="logout-button"
      @click="logout"
    >
      <SoftphoneIcon name="exit" />
      <span class="sp-actions__label">{{ t('actions.logout') }}</span>
    </button>

    <PauseReasonPanel v-if="ui.pausePanelOpen && session.canChangeStatus" />
  </div>
</template>
