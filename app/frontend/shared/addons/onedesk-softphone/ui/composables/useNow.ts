// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { onScopeDispose, readonly, ref, type Ref } from 'vue'

// Hora actual (epoch ms) que se refresca sola, para los contadores de la pantalla.
export const useNow = (intervalMs = 1_000): Readonly<Ref<number>> => {
  const now = ref(Date.now())
  const timer = setInterval(() => {
    now.value = Date.now()
  }, intervalMs)
  onScopeDispose(() => clearInterval(timer))
  return readonly(now)
}
