// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { defineStore } from 'pinia'
import { computed, onScopeDispose, shallowRef } from 'vue'

import { canChangeStatusManually, type PauseReason } from '../../core/agent/agentStatus.ts'
import { availableCallActions } from '../../core/call/callActions.ts'
import { useSoftphoneContext } from '../softphoneContext.ts'

import type { AgentProfile } from '../../core/agent/agentProfile.ts'
import type { EngineCommand } from '../../core/session/commands.ts'

// Proyección reactiva del engine (architecture.md §5.4): la foto que publica y sus órdenes. No tiene
// lógica de negocio; las reglas (qué acciones hay, cuándo se puede cambiar de estado) son de core/.
export const useSoftphoneSessionStore = defineStore('onedeskSoftphoneSession', () => {
  const { engine } = useSoftphoneContext()

  // La foto se sustituye entera en cada cambio, así que basta con una referencia superficial.
  const snapshot = shallowRef(engine.snapshot)
  const tabRole = shallowRef(engine.tabRole)
  onScopeDispose(
    engine.subscribe((next) => {
      snapshot.value = next
      tabRole.value = engine.tabRole
    }),
  )

  const agent = computed<AgentProfile | null>(() =>
    snapshot.value.session.status === 'active' ? snapshot.value.session.agent : null,
  )

  const callActions = computed(() =>
    availableCallActions({
      call: snapshot.value.call,
      registration: snapshot.value.registration,
      hasLastDialed: snapshot.value.lastDialed !== null,
      transferPending: snapshot.value.pendingTransfer !== null,
    }),
  )

  const canChangeStatus = computed(() => {
    const { presence } = snapshot.value
    return agent.value !== null && presence !== null && canChangeStatusManually(presence.status)
  })

  const currentPauseReason = computed<PauseReason | null>(() => {
    const { presence, pauseReasons } = snapshot.value
    if (presence?.status !== 'paused') return null
    return pauseReasons.find((reason) => reason.id === presence.pauseReasonId) ?? null
  })

  const dispatch = (command: EngineCommand): void => engine.dispatch(command)

  return { snapshot, tabRole, agent, callActions, canChangeStatus, currentPauseReason, dispatch }
})
