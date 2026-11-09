// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import { defineStore } from 'pinia'
import { onScopeDispose, ref } from 'vue'

import { usePhoneNumber } from '../composables/usePhoneNumber.ts'
import { useSoftphoneContext } from '../softphoneContext.ts'

export type SupervisionTab = 'active' | 'waiting' | 'agents'

// Estado que solo es de la interfaz de esta pestaña (architecture.md §5.4): qué está abierto y el
// número que se está escribiendo, con el país del selector. No viaja a las demás pestañas.
export const useSoftphoneUiStore = defineStore('onedeskSoftphoneUi', () => {
  const { sound, dialing } = useSoftphoneContext()

  // El panel empieza cerrado, como el softphone flotante actual; se abre solo con una entrante.
  const panelOpen = ref(false)
  const pausePanelOpen = ref(false)
  const confirmingLogout = ref(false)
  // Pantalla Agentes, la de transferir. Se abre desde el marcado, la entrante o la llamada.
  const agentsOpen = ref(false)
  // Panel de supervisión (DECISIONES.md, panel de supervisión #1), con la pestaña elegida. Se abre
  // desde el icono de la cabecera, encima de cualquier pantalla.
  const supervisionOpen = ref(false)
  const supervisionTab = ref<SupervisionTab>('active')
  // El número del marcado lleva delante el prefijo del país elegido, como en el diseño.
  const dial = usePhoneNumber(dialing)
  const soundLocked = ref(sound.locked)
  onScopeDispose(
    sound.onUnlock(() => {
      soundLocked.value = false
    }),
  )

  const togglePanel = (): void => {
    panelOpen.value = !panelOpen.value
  }

  const openPanel = (): void => {
    panelOpen.value = true
  }

  const togglePausePanel = (): void => {
    pausePanelOpen.value = !pausePanelOpen.value
  }

  const closePausePanel = (): void => {
    pausePanelOpen.value = false
  }

  const setConfirmingLogout = (confirming: boolean): void => {
    confirmingLogout.value = confirming
  }

  const openAgents = (): void => {
    agentsOpen.value = true
    pausePanelOpen.value = false
  }

  const closeAgents = (): void => {
    agentsOpen.value = false
  }

  const toggleSupervision = (): void => {
    supervisionOpen.value = !supervisionOpen.value
    pausePanelOpen.value = false
  }

  const closeSupervision = (): void => {
    supervisionOpen.value = false
  }

  const selectSupervisionTab = (tab: SupervisionTab): void => {
    supervisionTab.value = tab
  }

  return {
    supervisionOpen,
    supervisionTab,
    toggleSupervision,
    closeSupervision,
    selectSupervisionTab,
    panelOpen,
    pausePanelOpen,
    confirmingLogout,
    agentsOpen,
    country: dial.country,
    countries: dialing.countries,
    dialNumber: dial.number,
    canDialNumber: dial.hasNumber,
    soundLocked,
    togglePanel,
    openPanel,
    togglePausePanel,
    closePausePanel,
    setConfirmingLogout,
    openAgents,
    closeAgents,
    setDialNumber: dial.setNumber,
    selectCountry: dial.selectCountry,
    appendDigit: dial.appendDigit,
    deleteLastDigit: dial.deleteLastDigit,
    // Después de marcar queda solo el prefijo del país, listo para el siguiente número.
    clearDialNumber: dial.clear,
  }
})
