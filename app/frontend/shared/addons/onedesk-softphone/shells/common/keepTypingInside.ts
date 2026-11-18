// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Las teclas que el agente pulsa al escribir en un campo del teléfono no deben llegar a `document`.
// Zammad tiene atajos de una sola tecla (`d` cambia el modo oscuro, por ejemplo) y solo los calla si
// `document.activeElement` es un campo de texto. Con el Shadow DOM, `document.activeElement` es
// <onedesk-softphone> y no el <input> de dentro, así que Zammad no lo ve como un campo. Se corta la
// propagación en el propio elemento, en fase de burbuja: los manejadores del teléfono ya se han
// ejecutado, y el desbloqueo del sonido escucha en captura (firstGestureSoundUnlock.ts), antes.
const KEY_EVENTS = ['keydown', 'keypress', 'keyup'] as const

// Tipos de <input> en los que no se escribe texto: con el foco en ellos los atajos siguen valiendo.
const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

export const isTypingTarget = (target: EventTarget | undefined): boolean => {
  if (target === undefined || !('tagName' in target)) return false
  const element = target as HTMLElement
  if (element.isContentEditable) return true
  switch (element.tagName) {
    case 'TEXTAREA':
    case 'SELECT':
      return true
    case 'INPUT':
      return !NON_TEXT_INPUT_TYPES.has((element as HTMLInputElement).type)
    default:
      return false
  }
}

// Devuelve la función que quita los escuchadores.
export const keepTypingInside = (element: HTMLElement): (() => void) => {
  const stopTyping = (event: Event): void => {
    if (isTypingTarget(event.composedPath()[0])) event.stopPropagation()
  }
  for (const type of KEY_EVENTS) element.addEventListener(type, stopTyping)
  return () => {
    for (const type of KEY_EVENTS) element.removeEventListener(type, stopTyping)
  }
}
