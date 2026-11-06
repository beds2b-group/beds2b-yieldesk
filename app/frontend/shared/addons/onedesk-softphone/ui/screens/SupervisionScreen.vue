<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import SoftphoneIcon from '../components/SoftphoneIcon.vue'
import { useNow } from '../composables/useNow.ts'
import { formatDuration } from '../format/formatDuration.ts'
import { initials } from '../format/initials.ts'
import { useI18n } from '../i18n/useI18n.ts'
import { useSoftphoneSessionStore } from '../stores/onedeskSoftphoneSession.ts'
import { useSoftphoneUiStore, type SupervisionTab } from '../stores/onedeskSoftphoneUi.ts'

import type { AgentStatus } from '../../core/agent/agentStatus.ts'
import type { ActiveCall, SupervisedAgent } from '../../core/supervision/supervisionOverview.ts'

const session = useSoftphoneSessionStore()
const ui = useSoftphoneUiStore()
const { t } = useI18n()
const now = useNow()

// Panel de supervisión (DECISIONES.md, panel de supervisión #1–4): tres pestañas con la vista
// general de One-Desk (endpoint 13), que el engine mantiene al día con el hub.
const overview = computed(() => session.snapshot.supervision)
const me = computed(() => session.agent?.id ?? null)
const pendingMonitor = computed(() => session.snapshot.pendingMonitor)
const monitoringCallId = computed(() => {
  const { call } = session.snapshot
  return call.status === 'monitoring' ? call.callId : null
})

// Orden de la pestaña Agentes (#3): en llamada, post-llamada, disponibles, en pausa y, al final, los
// desconectados. Dentro de cada grupo, por nombre.
const STATUS_ORDER: Readonly<Record<AgentStatus, number>> = {
  'on-call': 0,
  reserved: 1,
  'wrap-up': 2,
  available: 3,
  paused: 4,
  offline: 5,
}

const agents = computed<readonly SupervisedAgent[]>(() =>
  [...(overview.value?.agents ?? [])].sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.fullName.localeCompare(b.fullName),
  ),
)
const activeCalls = computed(() => overview.value?.activeCalls ?? [])
const waitingCalls = computed(() => overview.value?.waitingCalls ?? [])

const tabs = computed<readonly { id: SupervisionTab; label: string; count: number }[]>(() => [
  { id: 'active', label: t('supervision.tabActive'), count: activeCalls.value.length },
  { id: 'waiting', label: t('supervision.tabWaiting'), count: waitingCalls.value.length },
  { id: 'agents', label: t('supervision.tabAgents'), count: agents.value.length },
])

const since = (instant: number | null): string =>
  instant === null ? '--:--' : formatDuration(instant, now.value)

const agentStatusLabel = (agent: SupervisedAgent): string => {
  const label =
    agent.status === 'paused' && agent.pauseReason !== null
      ? t('status.pausedWith', { reason: agent.pauseReason })
      : t(`status.${agent.status}`)
  return agent.since === null || agent.status === 'offline'
    ? label
    : `${label} ${formatDuration(agent.since, now.value)}`
}

const isListening = (call: ActiveCall): boolean =>
  monitoringCallId.value === call.id || (me.value !== null && call.monitoredBy.includes(me.value))

// Se escucha la llamada de otro agente, con el teléfono libre (lo decide core/: acción `monitor`).
const canListen = (call: ActiveCall): boolean =>
  session.callActions.has('monitor') &&
  pendingMonitor.value === null &&
  call.agent !== null &&
  call.agent.id !== me.value

const listen = (call: ActiveCall): void => {
  if (canListen(call)) session.dispatch({ type: 'monitor-call', callId: call.id })
}
</script>

<template>
  <div class="sp-screen sp-supervision" data-testid="supervision-screen">
    <div class="sp-supervision__title-row">
      <button
        type="button"
        class="sp-supervision__back"
        :title="t('supervision.back')"
        :aria-label="t('supervision.back')"
        data-testid="supervision-back"
        @click="ui.closeSupervision()"
      >
        <SoftphoneIcon name="chevron-left" />
      </button>
      <h2 class="sp-supervision__title">{{ t('supervision.title') }}</h2>
    </div>

    <div class="sp-supervision__tabs" role="tablist" :aria-label="t('supervision.title')">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="sp-supervision__tab"
        :class="{ 'sp-supervision__tab--selected': ui.supervisionTab === tab.id }"
        :aria-selected="ui.supervisionTab === tab.id"
        :data-testid="`supervision-tab-${tab.id}`"
        @click="ui.selectSupervisionTab(tab.id)"
      >
        {{ tab.label }}
        <span class="sp-supervision__count">{{ tab.count }}</span>
      </button>
    </div>

    <p v-if="overview === null" class="sp-supervision__message" data-testid="supervision-loading">
      {{ t('supervision.loading') }}
    </p>

    <template v-else-if="ui.supervisionTab === 'active'">
      <p v-if="activeCalls.length === 0" class="sp-supervision__message">
        {{ t('supervision.noActive') }}
      </p>
      <ul
        v-else
        class="sp-supervision__list"
        role="tabpanel"
        :aria-label="t('supervision.tabActive')"
      >
        <li
          v-for="call in activeCalls"
          :key="call.id"
          class="sp-supervision__item"
          data-testid="active-call-row"
        >
          <span class="sp-supervision__info">
            <span class="sp-supervision__primary">{{ call.customerNumber }}</span>
            <span class="sp-supervision__meta">
              <span class="sp-supervision__agent">
                {{ call.agent?.fullName ?? t('supervision.noAgent') }}
              </span>
              <span class="sp-supervision__time">{{ since(call.answeredAt) }}</span>
            </span>
            <span class="sp-supervision__badges">
              <span
                v-if="call.heldAt !== null"
                class="sp-supervision__badge sp-supervision__badge--held"
                data-testid="call-held"
              >
                {{ t('supervision.held', { duration: since(call.heldAt) }) }}
              </span>
              <span
                v-if="isListening(call)"
                class="sp-supervision__badge sp-supervision__badge--listening"
                data-testid="call-listening"
              >
                {{ t('supervision.listening') }}
              </span>
            </span>
          </span>
          <button
            type="button"
            class="sp-supervision__listen"
            :class="{ 'sp-supervision__listen--pending': pendingMonitor === call.id }"
            :disabled="!canListen(call)"
            :title="
              t('supervision.listenTo', { name: call.agent?.fullName ?? call.customerNumber })
            "
            :aria-label="
              t('supervision.listenTo', { name: call.agent?.fullName ?? call.customerNumber })
            "
            data-testid="listen"
            @click="listen(call)"
          >
            <SoftphoneIcon name="headphones" :size="17" />
          </button>
        </li>
      </ul>
    </template>

    <template v-else-if="ui.supervisionTab === 'waiting'">
      <p v-if="waitingCalls.length === 0" class="sp-supervision__message">
        {{ t('supervision.noWaiting') }}
      </p>
      <ul
        v-else
        class="sp-supervision__list"
        role="tabpanel"
        :aria-label="t('supervision.tabWaiting')"
      >
        <li
          v-for="call in waitingCalls"
          :key="call.id"
          class="sp-supervision__item"
          data-testid="waiting-call-row"
        >
          <span class="sp-supervision__info">
            <span class="sp-supervision__primary">{{ call.customerNumber }}</span>
            <span class="sp-supervision__meta">
              {{ t('supervision.waitingFor', { duration: since(call.receivedAt) }) }}
            </span>
          </span>
        </li>
      </ul>
    </template>

    <template v-else>
      <p v-if="agents.length === 0" class="sp-supervision__message">
        {{ t('supervision.noAgents') }}
      </p>
      <ul
        v-else
        class="sp-supervision__list"
        role="tabpanel"
        :aria-label="t('supervision.tabAgents')"
      >
        <li
          v-for="agent in agents"
          :key="agent.id"
          class="sp-supervision__item"
          :class="{ 'sp-supervision__item--offline': agent.status === 'offline' }"
          data-testid="supervised-agent-row"
        >
          <span class="sp-supervision__avatar" aria-hidden="true">
            {{ initials(agent.fullName) }}
            <span
              class="sp-supervision__avatar-dot sp-status-dot"
              :class="`sp-status-dot--${agent.status}`"
            />
          </span>
          <span class="sp-supervision__info">
            <span class="sp-supervision__primary">{{ agent.fullName }}</span>
            <span class="sp-supervision__meta">
              <span class="sp-supervision__badge" :class="`sp-supervision__badge--${agent.status}`">
                {{ agentStatusLabel(agent) }}
              </span>
              <span class="sp-supervision__extension">
                {{ t('agents.extension', { extension: agent.extension }) }}
              </span>
            </span>
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>
