// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import actionBar from './ActionBar.css?inline'
import agentsScreen from './AgentsScreen.css?inline'
import callStrip from './CallStrip.css?inline'
import common from './common.css?inline'
import connectionScreen from './ConnectionScreen.css?inline'
import countryPicker from './CountryPicker.css?inline'
import dialKeypad from './DialKeypad.css?inline'
import dialScreen from './DialScreen.css?inline'
import inCallScreen from './InCallScreen.css?inline'
import incomingScreen from './IncomingScreen.css?inline'
import launcherButton from './LauncherButton.css?inline'
import logoutConfirm from './LogoutConfirm.css?inline'
import pauseReasonPanel from './PauseReasonPanel.css?inline'
import softphoneHeader from './SoftphoneHeader.css?inline'
import softphoneRoot from './SoftphoneRoot.css?inline'
import statusNotices from './StatusNotices.css?inline'
import supervisionScreen from './SupervisionScreen.css?inline'
import tokens from './tokens.css?inline'

// Hojas que la shell pasa a defineCustomElement en `styles`, que las coloca en la raíz del Shadow
// DOM (ADR-008). Primero las variables y lo común; después, una por componente.
export const SOFTPHONE_STYLES: readonly string[] = [
  tokens,
  common,
  softphoneRoot,
  softphoneHeader,
  statusNotices,
  actionBar,
  pauseReasonPanel,
  logoutConfirm,
  dialKeypad,
  callStrip,
  connectionScreen,
  dialScreen,
  countryPicker,
  incomingScreen,
  inCallScreen,
  agentsScreen,
  supervisionScreen,
  launcherButton,
]
