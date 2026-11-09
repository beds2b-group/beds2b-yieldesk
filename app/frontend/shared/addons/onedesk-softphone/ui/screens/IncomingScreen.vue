<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import ActionBar from '../components/ActionBar.vue'
import CallStrip from '../components/CallStrip.vue'
import SoftphoneIcon from '../components/SoftphoneIcon.vue'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

const from = computed(() =>
  session.snapshot.call.status === 'incoming' ? session.snapshot.call.from : '',
)
</script>

<template>
  <div class="sp-screen sp-incoming" data-testid="incoming-screen">
    <CallStrip :peer="from" :detail="t('incoming.title')" :live="false" />

    <ActionBar />

    <div class="sp-incoming__ring" aria-live="assertive">
      <span class="sp-incoming__icon">
        <SoftphoneIcon name="phone" :size="34" />
      </span>
      <p class="sp-incoming__title">{{ t('incoming.title') }}</p>
      <p class="sp-incoming__from">{{ from }}</p>
    </div>

    <!-- Se puede transferir sin contestar (DECISIONES.md, núcleo #4). -->
    <div class="sp-bottom-row sp-bottom-row--incoming">
      <button
        type="button"
        class="sp-button sp-button--danger-soft"
        :disabled="!session.callActions.has('reject')"
        data-testid="reject"
        @click="session.dispatch({ type: 'reject' })"
      >
        {{ t('incoming.reject') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--success"
        :disabled="!session.callActions.has('answer')"
        data-testid="answer"
        @click="session.dispatch({ type: 'answer' })"
      >
        <SoftphoneIcon name="phone" :size="16" />
        {{ t('incoming.answer') }}
      </button>
      <button
        type="button"
        class="sp-button sp-button--primary sp-button--square"
        :title="t('call.transfer')"
        :aria-label="t('call.transfer')"
        data-testid="open-transfer"
        @click="ui.openAgents()"
      >
        <SoftphoneIcon name="transfer" :size="20" />
      </button>
    </div>
  </div>
</template>
