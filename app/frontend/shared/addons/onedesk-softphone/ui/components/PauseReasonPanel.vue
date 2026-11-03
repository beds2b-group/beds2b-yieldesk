<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// Los motivos vienen de One-Desk y se pintan tal cual (DECISIONES.md, diseño #1 y #9).
const pause = (pauseReasonId: number): void => {
  session.dispatch({ type: 'set-status', change: { status: 'paused', pauseReasonId } })
  ui.closePausePanel()
}
</script>

<template>
  <div class="sp-pause-panel" role="group" :aria-label="t('pause.label')">
    <button
      v-for="reason in session.snapshot.pauseReasons"
      :key="reason.id"
      type="button"
      class="sp-pause-panel__reason"
      :title="reason.name"
      :aria-label="reason.name"
      @click="pause(reason.id)"
    >
      <span v-if="reason.icon !== null" aria-hidden="true">{{ reason.icon }}</span>
      <span v-else class="sp-pause-panel__name">{{ reason.name }}</span>
    </button>
  </div>
</template>
