<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import SoftphoneIcon from './SoftphoneIcon.vue'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()

const title = computed(() => {
  const { agent } = session
  return agent === null
    ? t('header.connecting')
    : t('header.agent', { extension: agent.extension, name: agent.fullName })
})

const presence = computed(() => session.snapshot.presence)

const statusLabel = computed(() => {
  const reason = session.currentPauseReason
  if (reason !== null) {
    return t('status.pausedWith', { reason: [reason.icon, reason.name].filter(Boolean).join(' ') })
  }
  return presence.value === null ? '' : t(`status.${presence.value.status}`)
})
</script>

<template>
  <header class="sp-header">
    <div class="sp-header__avatar" aria-hidden="true" />
    <div class="sp-header__identity">
      <p class="sp-header__name">{{ title }}</p>
      <p v-if="presence !== null" class="sp-header__status" data-testid="agent-status">
        <span class="sp-status-dot" :class="`sp-status-dot--${presence.status}`" />
        {{ statusLabel }}
      </p>
    </div>
    <button
      v-if="session.canSupervise"
      type="button"
      class="sp-header__supervision"
      :class="{ 'sp-header__supervision--open': ui.supervisionOpen }"
      :aria-pressed="ui.supervisionOpen"
      :title="t('supervision.open')"
      :aria-label="t('supervision.open')"
      data-testid="open-supervision"
      @click="ui.toggleSupervision()"
    >
      <SoftphoneIcon name="eye" :size="18" />
    </button>
  </header>
</template>
