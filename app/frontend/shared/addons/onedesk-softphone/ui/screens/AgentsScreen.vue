<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed, watch } from 'vue'

import CallStrip from '../components/CallStrip.vue'
import CountryPicker from '../components/CountryPicker.vue'
import SoftphoneIcon from '../components/SoftphoneIcon.vue'
import { useColleagues } from '../composables/useColleagues.ts'
import { useNow } from '../composables/useNow.ts'
import { usePhoneNumber } from '../composables/usePhoneNumber.ts'
import { formatDuration } from '../format/formatDuration.ts'
import { initials } from '../format/initials.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneContext } from '../softphoneContext.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore } from '../stores/onedeskSoftphoneUi.ts'

import type { TransferTarget } from '../../core/call/transferTarget.ts'
import type { AgentSummary } from '../../core/ports/BackendApi.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { engine, dialing } = useSoftphoneContext()
const { t } = useI18n()
const now = useNow()

// Pantalla de transferencia del diseño: la llamada arriba, los compañeros del endpoint 11 y un pie
// que dice qué se puede hacer. Transferir no la cierra: se cierra cuando la llamada termina.
const colleagues = useColleagues(() => engine.listAgents())
const call = computed(() => session.snapshot.call)
const pendingTransfer = computed(() => session.snapshot.pendingTransfer)
const canTransfer = computed(() => session.callActions.has('transfer'))

const strip = computed(() => {
  const current = call.value
  switch (current.status) {
    case 'in-call':
      return {
        peer: current.peer,
        detail: formatDuration(current.startedAt, now.value),
        live: true,
      }
    case 'incoming':
      return { peer: current.from, detail: t('incoming.title'), live: false }
    case 'ending':
      return { peer: current.peer, detail: t('call.ending'), live: false }
    default:
      return { peer: t('agents.noCall'), detail: '--:--', live: false }
  }
})

// Número externo (R2b, DECISIONES.md transferencia #7), con su propio selector de país: no toca lo
// que hubiera en el marcado.
const external = usePhoneNumber(dialing)
const externalAllowed = computed(() => session.callActions.has('transfer-external'))
const canTransferExternal = computed(() => externalAllowed.value && external.hasNumber.value)
// Mientras suena se transfiere a un compañero, pero no a un número (DECISIONES.md, transferencia #8).
const externalNeedsAnswer = computed(() => canTransfer.value && !externalAllowed.value)

const agents = computed(() =>
  colleagues.state.value.status === 'loaded' ? colleagues.state.value.agents : [],
)

const footer = computed(() => {
  const target = pendingTransfer.value?.target
  if (target !== undefined) {
    if ('externalNumber' in target) {
      return t('agents.transferring', { name: target.externalNumber })
    }
    const agent = agents.value.find(({ id }) => id === target.agentId)
    return agent === undefined
      ? t('agents.transferringUnknown')
      : t('agents.transferring', { name: agent.fullName })
  }
  return canTransfer.value ? t('agents.hintSelect') : t('agents.hintNoCall')
})

// La etiqueta del diseño: el estado, el motivo si está en pausa y, si no está disponible, el tiempo
// que lleva así.
const statusLabel = (agent: AgentSummary): string => {
  const label =
    agent.status === 'paused' && agent.pauseReason !== null
      ? t('status.pausedWith', { reason: agent.pauseReason })
      : t(`status.${agent.status}`)
  return agent.since === null || agent.status === 'available'
    ? label
    : `${label} ${formatDuration(agent.since, now.value)}`
}

const transfer = (target: TransferTarget): void => {
  session.dispatch({ type: 'transfer', target })
}

const transferExternal = (): void => {
  if (canTransferExternal.value) transfer({ externalNumber: external.number.value })
}

const isPendingAgent = (agent: AgentSummary): boolean => {
  const target = pendingTransfer.value?.target
  return target !== undefined && 'agentId' in target && target.agentId === agent.id
}

// Si One-Desk rechaza la transferencia (por ejemplo, `target_unavailable`), la lista ya no está al
// día: se vuelve a pedir.
watch(pendingTransfer, (current, previous) => {
  if (previous !== null && current === null) colleagues.refresh()
})
</script>

<template>
  <div class="sp-screen sp-agents" data-testid="agents-screen">
    <div class="sp-agents__title-row">
      <button
        type="button"
        class="sp-agents__back"
        :title="t('agents.back')"
        :aria-label="t('agents.back')"
        data-testid="agents-back"
        @click="ui.closeAgents()"
      >
        <SoftphoneIcon name="chevron-left" />
      </button>
      <h2 class="sp-agents__title">{{ t('agents.title') }}</h2>
    </div>

    <CallStrip :peer="strip.peer" :detail="strip.detail" :live="strip.live" />

    <div class="sp-agents__external">
      <div class="sp-agents__external-field">
        <CountryPicker
          :country="external.country.value"
          :countries="dialing.countries"
          @select="external.selectCountry"
        />
        <label class="sp-agents__external-number" for="sp-agents-external">
          <span class="sp-visually-hidden">{{ t('agents.externalLabel') }}</span>
          <input
            id="sp-agents-external"
            class="sp-agents__external-input"
            type="tel"
            inputmode="tel"
            autocomplete="off"
            data-testid="external-input"
            :value="external.number.value"
            :placeholder="
              externalNeedsAnswer
                ? t('agents.externalAnswerFirst')
                : t('agents.externalPlaceholder')
            "
            @input="external.setNumber(($event.target as HTMLInputElement).value)"
            @keydown.enter.prevent="transferExternal"
          />
        </label>
      </div>
      <button
        type="button"
        class="sp-agents__transfer"
        :class="{
          'sp-agents__transfer--pending':
            pendingTransfer !== null && 'externalNumber' in pendingTransfer.target,
        }"
        :disabled="!canTransferExternal"
        :title="
          externalNeedsAnswer ? t('agents.externalAnswerFirst') : t('agents.externalTransfer')
        "
        :aria-label="t('agents.externalTransfer')"
        data-testid="external-transfer"
        @click="transferExternal"
      >
        <SoftphoneIcon name="transfer" :size="17" />
      </button>
    </div>

    <p v-if="colleagues.state.value.status === 'loading'" class="sp-agents__message">
      {{ t('agents.loading') }}
    </p>
    <div
      v-else-if="colleagues.state.value.status === 'failed'"
      class="sp-agents__message"
      role="alert"
      data-testid="agents-failed"
    >
      <p>{{ t('agents.loadFailed') }}</p>
      <button type="button" class="sp-agents__retry" @click="colleagues.refresh()">
        {{ t('connection.retry') }}
      </button>
    </div>
    <p v-else-if="agents.length === 0" class="sp-agents__message">{{ t('agents.empty') }}</p>
    <ul v-else class="sp-agents__list" :aria-label="t('agents.list')">
      <li v-for="agent in agents" :key="agent.id" class="sp-agents__item" data-testid="agent-row">
        <span class="sp-agents__avatar" aria-hidden="true">
          {{ initials(agent.fullName) }}
          <span
            class="sp-agents__avatar-dot sp-status-dot"
            :class="`sp-status-dot--${agent.status}`"
          />
        </span>
        <span class="sp-agents__info">
          <span class="sp-agents__name">{{ agent.fullName }}</span>
          <span class="sp-agents__meta">
            <span class="sp-agents__badge" :class="`sp-agents__badge--${agent.status}`">
              {{ statusLabel(agent) }}
            </span>
            <span class="sp-agents__extension">
              {{ t('agents.extension', { extension: agent.extension }) }}
            </span>
          </span>
        </span>
        <button
          type="button"
          class="sp-agents__transfer"
          :class="{ 'sp-agents__transfer--pending': isPendingAgent(agent) }"
          :disabled="!agent.transferable || !canTransfer"
          :title="t('agents.transferTo', { name: agent.fullName })"
          :aria-label="t('agents.transferTo', { name: agent.fullName })"
          data-testid="agent-transfer"
          @click="transfer({ agentId: agent.id })"
        >
          <SoftphoneIcon name="transfer" :size="17" />
        </button>
      </li>
    </ul>

    <p
      class="sp-agents__footer"
      :class="{ 'sp-agents__footer--pending': pendingTransfer !== null }"
      aria-live="polite"
      data-testid="agents-footer"
    >
      {{ footer }}
    </p>
  </div>
</template>
