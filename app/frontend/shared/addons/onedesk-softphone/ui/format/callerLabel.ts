// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { Translate } from '../i18n/translate.ts'

// Lo que llega en `From` cuando el cliente oculta su número. Twilio pone `client:anonymous` al
// pasar la llamada al navegador del agente (visto en producción el 18-11-2026); los demás valores
// son los textos con los que los operadores marcan un número oculto o no disponible.
const HIDDEN_CALLER_IDS: ReadonlySet<string> = new Set([
  '',
  'anonymous',
  'restricted',
  'private',
  'unknown',
  'unavailable',
])

export const isHiddenCaller = (from: string): boolean =>
  HIDDEN_CALLER_IDS.has(
    from
      .trim()
      .replace(/^client:/i, '')
      .toLowerCase(),
  )

// El cliente tal como se enseña: su número o «Número oculto».
export const callerLabel = (t: Translate, from: string): string =>
  isHiddenCaller(from) ? t('call.hiddenNumber') : from
