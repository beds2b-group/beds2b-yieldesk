<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

import { PAUSE_NOTE_MAX_LENGTH } from '../../core/agent/agentStatus.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import type { PauseReason } from '../../core/agent/agentStatus.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

// Motivo que pide texto («Otro motivo») mientras el agente lo escribe.
const noteReason = ref<PauseReason | null>(null)
const note = ref('')
const noteInput = ref<HTMLInputElement | null>(null)
const trimmedNote = computed(() => note.value.trim())

const pause = (pauseReasonId: number, pauseNote?: string): void => {
  session.dispatch({
    type: 'set-status',
    change:
      pauseNote === undefined
        ? { status: 'paused', pauseReasonId }
        : { status: 'paused', pauseReasonId, pauseNote },
  })
  ui.closePausePanel()
}

// Los motivos vienen de One-Desk y se pintan tal cual (DECISIONES.md, diseño #1 y #9). El que pide
// texto abre el campo en lugar de pausar (DECISIONES.md, «Otro motivo»).
const choose = async (reason: PauseReason): Promise<void> => {
  if (!reason.requiresNote) {
    pause(reason.id)
    return
  }
  noteReason.value = reason
  note.value = ''
  await nextTick()
  noteInput.value?.focus()
}

const confirmNote = (): void => {
  if (noteReason.value === null || trimmedNote.value === '') return
  pause(noteReason.value.id, trimmedNote.value)
}

const cancelNote = (): void => {
  noteReason.value = null
}
</script>

<template>
  <form
    v-if="noteReason !== null"
    class="sp-pause-panel sp-pause-panel--note"
    data-testid="pause-note-form"
    @submit.prevent="confirmNote"
  >
    <p id="sp-pause-note-label" class="sp-pause-panel__note-label">
      <span v-if="noteReason.icon !== null" aria-hidden="true">{{ noteReason.icon }}</span>
      {{ t('pause.note.label') }}
    </p>
    <input
      ref="noteInput"
      v-model="note"
      class="sp-pause-panel__note-input"
      data-testid="pause-note-input"
      type="text"
      autocomplete="off"
      aria-labelledby="sp-pause-note-label"
      aria-describedby="sp-pause-note-hint"
      :maxlength="PAUSE_NOTE_MAX_LENGTH"
      @keydown.esc.stop="cancelNote"
    />
    <p id="sp-pause-note-hint" class="sp-pause-panel__note-hint">{{ t('pause.note.hint') }}</p>
    <div class="sp-pause-panel__note-actions">
      <button type="button" class="sp-pause-panel__note-cancel" @click="cancelNote">
        {{ t('pause.note.cancel') }}
      </button>
      <button
        type="submit"
        class="sp-pause-panel__note-confirm"
        data-testid="pause-note-confirm"
        :disabled="trimmedNote === ''"
      >
        {{ t('pause.note.confirm') }}
      </button>
    </div>
  </form>
  <div v-else class="sp-pause-panel" role="group" :aria-label="t('pause.label')">
    <button
      v-for="reason in session.snapshot.pauseReasons"
      :key="reason.id"
      type="button"
      class="sp-pause-panel__reason"
      :title="reason.name"
      :aria-label="reason.name"
      @click="choose(reason)"
    >
      <span v-if="reason.icon !== null" aria-hidden="true">{{ reason.icon }}</span>
      <span v-else class="sp-pause-panel__name">{{ reason.name }}</span>
    </button>
  </div>
</template>
