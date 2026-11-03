<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import ActionBar from '../components/ActionBar.vue'
import CallStrip from '../components/CallStrip.vue'
import DialKeypad from '../components/DialKeypad.vue'
import SoftphoneIcon from '../components/SoftphoneIcon.vue'
import { useNow } from '../composables/useNow.ts'
import { formatDuration } from '../format/formatDuration.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import type { DtmfDigit } from '../../core/call/dtmf.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()
const now = useNow()

// En llamada y mientras se cuelga. El teclado envía DTMF y Transferir abre la pantalla Agentes,
// también con la transferencia ya pedida, para ver a quién.
const call = computed(() => session.snapshot.call)
const muted = computed(() => call.value.status === 'in-call' && call.value.muted)
const peer = computed(() =>
  call.value.status === 'in-call' || call.value.status === 'ending' ? call.value.peer : '',
)
const detail = computed(() =>
  call.value.status === 'in-call'
    ? formatDuration(call.value.startedAt, now.value)
    : t('call.ending'),
)

const pressKey = (digit: DtmfDigit): void => {
  session.dispatch({ type: 'press-key', digit })
}
</script>

<template>
  <div class="sp-screen sp-in-call" data-testid="in-call-screen">
    <CallStrip :peer="peer" :detail="detail" :live="call.status === 'in-call'" />
    <p v-if="muted" class="sp-in-call__muted" aria-live="polite">{{ t('call.muted') }}</p>

    <ActionBar />

    <DialKeypad :disabled="!session.callActions.has('dtmf')" @press="pressKey" />

    <div class="sp-bottom-row">
      <button
        type="button"
        class="sp-button"
        :class="{ 'sp-button--toggled': muted }"
        :aria-pressed="muted"
        :disabled="!session.callActions.has('mute')"
        :title="muted ? t('call.unmute') : t('call.mute')"
        data-testid="mute"
        @click="session.dispatch({ type: 'set-muted', muted: !muted })"
      >
        <SoftphoneIcon :name="muted ? 'mic-off' : 'mic'" :size="16" />
        <span class="sp-visually-hidden">{{ muted ? t('call.unmute') : t('call.mute') }}</span>
      </button>
      <button
        type="button"
        class="sp-button sp-button--danger"
        :disabled="!session.callActions.has('hangup')"
        data-testid="hangup"
        @click="session.dispatch({ type: 'hangup' })"
      >
        <SoftphoneIcon name="phone-off" :size="16" />
        {{ t('call.hangup') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--primary sp-button--square"
        :title="t('call.transfer')"
        :aria-label="t('call.transfer')"
        :disabled="call.status !== 'in-call'"
        data-testid="open-transfer"
        @click="ui.openAgents()"
      >
        <SoftphoneIcon name="transfer" :size="20" />
      </button>
    </div>
  </div>
</template>
