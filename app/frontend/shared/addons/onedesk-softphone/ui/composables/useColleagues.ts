// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { onScopeDispose, readonly, ref, shallowRef, watch, type Ref } from 'vue'

import type { AgentSummary } from '../../core/ports/BackendApi.ts'

export type ColleaguesState =
  | { status: 'loading' }
  | { status: 'loaded'; agents: readonly AgentSummary[] }
  | { status: 'failed' }

export interface Colleagues {
  state: Readonly<Ref<ColleaguesState>>
  refresh(): void
}

// Los avisos del hub que llegan seguidos (por ejemplo, una llamada que pasa a dos agentes de
// `available` a `reserved`) se juntan en una sola petición.
export const COLLEAGUES_GROUP_MS = 300

// Lista de compañeros de la pantalla Agentes (endpoint 11). Se pide al abrirla y se vuelve a pedir
// cada vez que cambia `revision`, que sube con cada `agent.status_changed` y cada conexión del hub
// (DECISIONES.md, transferencia #2). Los avisos se juntan durante `groupMs` desde el primero. Si una
// recarga falla, se queda la última lista buena; solo sin lista se muestra el error.
export const useColleagues = (
  load: () => Promise<readonly AgentSummary[]>,
  revision: () => number,
  groupMs = COLLEAGUES_GROUP_MS,
): Colleagues => {
  const state = shallowRef<ColleaguesState>({ status: 'loading' })
  // Solo cuenta la respuesta de la última petición: una lenta no pisa a otra más reciente.
  const latest = ref(0)
  let grouped: ReturnType<typeof setTimeout> | null = null

  const cancelGrouped = (): void => {
    if (grouped !== null) clearTimeout(grouped)
    grouped = null
  }

  const refresh = (): void => {
    cancelGrouped()
    latest.value += 1
    const request = latest.value
    load().then(
      (agents) => {
        if (request === latest.value) state.value = { status: 'loaded', agents }
      },
      () => {
        if (request === latest.value && state.value.status !== 'loaded') {
          state.value = { status: 'failed' }
        }
      },
    )
  }

  refresh()
  watch(revision, () => {
    grouped ??= setTimeout(refresh, groupMs)
  })
  onScopeDispose(() => {
    cancelGrouped()
    // Lo que llegue después de cerrar la pantalla ya no se pinta.
    latest.value += 1
  })

  return { state: readonly(state), refresh }
}
