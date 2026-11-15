// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { Unsubscribe } from '../../core/ports/events.ts'
import type { HostCommand } from '../../core/ports/HostBridge.ts'

// Aviso de llamada del widget CTI de la interfaz clásica: un `.call-widget` por llamada, que
// cti.coffee vuelve a pintar entero (navigation/menu_cti_ringing.jst.eco) con cada evento CTI. Cada
// aviso empieza por una cabecera flex (`.call-widget-header`: icono de estado y «Llamada entrante»)
// en la que la plantilla de Zammad ya reserva, comentado, un botón de texto a la derecha tras un
// `.flex-spacer`. Ahí van contestar y rechazar: las fichas del cliente no se tocan. Es código
// interno de Zammad: si cambia al actualizar, el arreglo va aquí (architecture.md §11).
const CALL_WIDGET_SELECTOR = '.call-widget'
const HEADER_SELECTOR = '.call-widget-header'

// Marca de los nodos que añade el teléfono, para no repetirlos y para quitarlos al parar.
export const CTI_CALL_ACTIONS_CLASS = 'onedesk-cti-actions'

// Hoja de iconos de Zammad (App.Config `icons_url`). Se toma de un icono que ya esté en el aviso
// para respetar la ruta con huella; esta es la de respaldo.
const FALLBACK_ICONS_URL = 'assets/images/icons.svg'
const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

// Botones redondos de solo icono, con el verde y el rojo de los botones de Zammad. Diámetro y
// separación pensados para que la cabecera crezca lo justo y la ficha del cliente no se toque.
const BUTTON_SIZE_PX = 28
const ICON_SIZE_PX: Readonly<Record<string, number>> = { phone: 16, 'diagonal-cross': 11 }
const BUTTON_GAP_PX = 8

// «Nuevo ticket» de cada ficha: un botón cuadrado verde con `+`, en posición absoluta a la derecha
// (`.user-card .btn.js-newTicket`), para el que la ficha reserva 48 px. cti.coffee le engancha el clic
// directamente al pintar el aviso, así que se conserva el elemento y su clase `js-newTicket`.
const USER_CARD_SELECTOR = '.user-card'
const NEW_TICKET_SELECTOR = '.js-newTicket'
// Clases de «Nuevo usuario» (`btn btn--text btn--create no-padding js-newUser`).
const NEW_TICKET_CLASSES = 'btn btn--text btn--create no-padding js-newTicket'

interface RestyledNewTicket {
  className: string
  children: Node[]
}

export interface CtiCallActionsLabels {
  answer: string
  reject: string
}

export interface CtiWidgetDecoratorOptions {
  document: Document
  labels: CtiCallActionsLabels
  // Orden al teléfono, como la que emitía cti.coffee (onedesk-softphone:command).
  send: (command: HostCommand) => void
}

interface ButtonSpec {
  command: 'answer' | 'reject'
  modifier: string
  icon: string
  label: string
}

const iconsUrl = (widget: Element): string => {
  const use = widget.querySelector('use')
  const href = use?.getAttribute('href') ?? use?.getAttributeNS(XLINK_NAMESPACE, 'href') ?? null
  if (href === null) return FALLBACK_ICONS_URL
  const hash = href.indexOf('#')
  return hash === -1 ? href : href.slice(0, hash)
}

// Mismo marcado que App.Utils.icon de Zammad, creado como nodos: sin innerHTML.
const zammadIcon = (document: Document, url: string, name: string): SVGSVGElement => {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('class', `icon icon-${name}`)
  svg.setAttribute('aria-hidden', 'true')
  const use = document.createElementNS(SVG_NAMESPACE, 'use')
  use.setAttributeNS(XLINK_NAMESPACE, 'xlink:href', `${url}#icon-${name}`)
  svg.append(use)
  return svg
}

// Botón redondo de Zammad (`btn btn--quad btn--success` / `btn--danger`) con su icono y el texto en
// `title` y `aria-label`. Forma y tamaño por CSSOM (no son atributos `style`, la CSP no los bloquea).
const actionButton = (
  document: Document,
  url: string,
  spec: ButtonSpec,
  send: (command: HostCommand) => void,
): HTMLButtonElement => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = `btn btn--quad ${spec.modifier} ${CTI_CALL_ACTIONS_CLASS}`
  button.title = spec.label
  button.setAttribute('aria-label', spec.label)
  Object.assign(button.style, {
    width: `${BUTTON_SIZE_PX}px`,
    height: `${BUTTON_SIZE_PX}px`,
    padding: '0',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: '0',
  })
  const icon = zammadIcon(document, url, spec.icon)
  // La cabecera encoge y sube el aspa pensando en su botón de cerrar (`.call-widget-header
  // .icon-diagonal-cross`); aquí va centrada en el círculo.
  const size = `${ICON_SIZE_PX[spec.icon] ?? 16}px`
  Object.assign(icon.style, { width: size, height: size, margin: '0' })
  button.append(icon)
  button.addEventListener('click', (event) => {
    // El aviso de Zammad tiene sus propios enlaces: el clic no debe llegar a ellos.
    event.stopPropagation()
    send(spec.command)
  })
  return button
}

// Contestar y rechazar a la derecha de la cabecera del aviso, uno por llamada.
const decorateHeader = (
  document: Document,
  widget: Element,
  header: HTMLElement,
  labels: CtiCallActionsLabels,
  send: (command: HostCommand) => void,
): void => {
  const url = iconsUrl(widget)
  const spacer = document.createElement('div')
  spacer.className = `flex-spacer ${CTI_CALL_ACTIONS_CLASS}`
  const specs: ButtonSpec[] = [
    { command: 'answer', modifier: 'btn--success', icon: 'phone', label: labels.answer },
    { command: 'reject', modifier: 'btn--danger', icon: 'diagonal-cross', label: labels.reject },
  ]
  const [answer, reject] = specs.map((spec) => actionButton(document, url, spec, send))
  reject!.style.marginLeft = `${BUTTON_GAP_PX}px`
  // La cabecera crece hasta el alto de los botones; su icono y su texto quedan centrados con ellos.
  header.style.alignItems = 'center'
  header.append(spacer, answer!, reject!)
}

// «Nuevo ticket» pasa a ser como «Nuevo usuario»: icono `plus-small` y el texto de su `title`, que
// ya viene traducido por Zammad, en su propia línea de la ficha. Sin la posición absoluta, la ficha
// no necesita el hueco de la derecha y el número cabe entero (DECISIONES.md, widget CTI #4).
const restyleNewTicket = (
  document: Document,
  card: HTMLElement,
  button: HTMLElement,
  restyled: Map<HTMLElement, RestyledNewTicket>,
): void => {
  const url = iconsUrl(card)
  restyled.set(button, { className: button.className, children: [...button.childNodes] })
  button.className = NEW_TICKET_CLASSES
  button.style.position = 'static'
  const label = document.createElement('span')
  label.textContent = button.getAttribute('title') ?? ''
  button.replaceChildren(
    zammadIcon(document, url, 'plus-small'),
    document.createTextNode(' '),
    label,
  )
  card.style.paddingRight = '0'
}

const restoreNewTicket = (button: HTMLElement, original: RestyledNewTicket): void => {
  button.className = original.className
  button.style.removeProperty('position')
  button.replaceChildren(...original.children)
  button.closest<HTMLElement>(USER_CARD_SELECTOR)?.style.removeProperty('padding-right')
}

// Mientras el teléfono está montado, añade los botones de contestar y rechazar a cada aviso de
// llamada, sin tocar los ficheros de Zammad (DECISIONES.md, widget CTI #1, #3 y #4). Devuelve cómo
// dejar de hacerlo: desconecta el observador y quita los botones añadidos.
export const decorateCtiWidget = ({
  document,
  labels,
  send,
}: CtiWidgetDecoratorOptions): Unsubscribe => {
  // Los «Nuevo ticket» cambiados y cómo eran, para dejarlos como estaban al parar.
  const restyled = new Map<HTMLElement, RestyledNewTicket>()

  const decorate = (): void => {
    for (const [button] of restyled) if (!button.isConnected) restyled.delete(button)
    for (const widget of document.querySelectorAll(CALL_WIDGET_SELECTOR)) {
      for (const card of widget.querySelectorAll<HTMLElement>(USER_CARD_SELECTOR)) {
        const button = card.querySelector<HTMLElement>(NEW_TICKET_SELECTOR)
        if (button !== null && !restyled.has(button)) {
          restyleNewTicket(document, card, button, restyled)
        }
      }
      if (widget.querySelector(`.${CTI_CALL_ACTIONS_CLASS}`) !== null) continue
      const header = widget.querySelector<HTMLElement>(HEADER_SELECTOR)
      if (header === null) continue
      decorateHeader(document, widget, header, labels, send)
    }
  }

  const observer = new MutationObserver(decorate)
  observer.observe(document.body, { childList: true, subtree: true })
  decorate()

  return () => {
    observer.disconnect()
    for (const node of document.querySelectorAll(`.${CTI_CALL_ACTIONS_CLASS}`)) {
      node.parentElement?.style.removeProperty('align-items')
      node.remove()
    }
    for (const [button, original] of restyled) restoreNewTicket(button, original)
    restyled.clear()
  }
}
