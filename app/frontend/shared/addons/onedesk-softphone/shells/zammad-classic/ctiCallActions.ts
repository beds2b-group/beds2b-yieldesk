// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { ICONS, type IconName } from '../../ui/components/icons.ts'
import styles from '../../ui/styles/CtiCallActions.css?inline'

import type { HostCommand } from '../../core/ports/HostBridge.ts'

export const CTI_CALL_ACTIONS_TAG = 'onedesk-cti-actions'

export interface CtiCallActionsLabels {
  answer: string
  reject: string
}

// Botones de contestar y rechazar que el teléfono añade a cada aviso de llamada del widget CTI de
// la interfaz clásica (DECISIONES.md, widget CTI #1). Shadow DOM: ni el CSS de Zammad les afecta ni
// el suyo sale a la página. La shell asigna `labels` y `onCommand` antes de añadirlo.
export class CtiCallActionsElement extends HTMLElement {
  labels: CtiCallActionsLabels = { answer: '', reject: '' }
  onCommand: (command: HostCommand) => void = () => {}

  connectedCallback(): void {
    if (this.shadowRoot !== null) return
    const root = this.attachShadow({ mode: 'open' })
    const style = this.ownerDocument.createElement('style')
    style.textContent = styles
    root.append(
      style,
      this.button('answer', 'phone', this.labels.answer),
      this.button('reject', 'phone-off', this.labels.reject),
    )
  }

  private button(command: HostCommand, icon: IconName, label: string): HTMLButtonElement {
    const button = this.ownerDocument.createElement('button')
    button.type = 'button'
    button.className = `sp-cti-actions__button sp-cti-actions__button--${command}`
    button.title = label
    button.setAttribute('aria-label', label)
    button.append(this.icon(icon))
    button.addEventListener('click', (event) => {
      // El aviso de Zammad tiene sus propios enlaces: el clic no debe llegar a ellos.
      event.stopPropagation()
      this.onCommand(command)
    })
    return button
  }

  // Mismos iconos que el teléfono (ui/components/icons.ts), creados como nodos SVG: sin innerHTML.
  private icon(name: IconName): SVGSVGElement {
    const svgNamespace = 'http://www.w3.org/2000/svg'
    const svg = this.ownerDocument.createElementNS(svgNamespace, 'svg')
    const attributes: Readonly<Record<string, string>> = {
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2.2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    }
    for (const [key, value] of Object.entries(attributes)) svg.setAttribute(key, value)
    for (const shape of ICONS[name]) {
      const node = this.ownerDocument.createElementNS(svgNamespace, shape.tag)
      for (const [key, value] of Object.entries(shape.attrs)) node.setAttribute(key, value)
      svg.append(node)
    }
    return svg
  }
}

export const defineCtiCallActionsElement = (registry: CustomElementRegistry): void => {
  if (registry.get(CTI_CALL_ACTIONS_TAG) !== undefined) return
  registry.define(CTI_CALL_ACTIONS_TAG, CtiCallActionsElement)
}
