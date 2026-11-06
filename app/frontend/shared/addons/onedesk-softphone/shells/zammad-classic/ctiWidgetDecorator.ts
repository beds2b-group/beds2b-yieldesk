// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import {
  CTI_CALL_ACTIONS_TAG,
  defineCtiCallActionsElement,
  type CtiCallActionsElement,
  type CtiCallActionsLabels,
} from './ctiCallActions.ts'

import type { Unsubscribe } from '../../core/ports/events.ts'
import type { HostCommand } from '../../core/ports/HostBridge.ts'

// Aviso de llamada del widget CTI de la interfaz clásica: un `.call-widget` por llamada, que
// cti.coffee vuelve a pintar entero (navigation/menu_cti_ringing.jst.eco) con cada evento CTI. Es
// código interno de Zammad: si cambia al actualizar, el arreglo va aquí (architecture.md §11).
const CALL_WIDGET_SELECTOR = '.call-widget'

export interface CtiWidgetDecoratorOptions {
  document: Document
  labels: CtiCallActionsLabels
  // Orden al teléfono, como la que emitía cti.coffee (onedesk-softphone:command).
  send: (command: HostCommand) => void
}

// Mientras el teléfono está montado, añade los botones de contestar y rechazar a cada aviso de
// llamada, sin tocar los ficheros de Zammad (DECISIONES.md, widget CTI #1). Devuelve cómo dejar de
// hacerlo: desconecta el observador y quita los botones añadidos.
export const decorateCtiWidget = ({
  document,
  labels,
  send,
}: CtiWidgetDecoratorOptions): Unsubscribe => {
  const registry = document.defaultView?.customElements
  if (registry === undefined) return () => {}
  defineCtiCallActionsElement(registry)

  const decorate = (): void => {
    for (const widget of document.querySelectorAll(CALL_WIDGET_SELECTOR)) {
      if (widget.querySelector(CTI_CALL_ACTIONS_TAG) !== null) continue
      const actions = document.createElement(CTI_CALL_ACTIONS_TAG) as CtiCallActionsElement
      actions.labels = labels
      actions.onCommand = send
      widget.append(actions)
    }
  }

  const observer = new MutationObserver(decorate)
  observer.observe(document.body, { childList: true, subtree: true })
  decorate()

  return () => {
    observer.disconnect()
    for (const actions of document.querySelectorAll(CTI_CALL_ACTIONS_TAG)) actions.remove()
  }
}
