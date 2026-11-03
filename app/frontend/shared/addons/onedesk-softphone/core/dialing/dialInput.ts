// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Lo que el agente puede escribir en el campo de número: cifras, `*` y `#` (teclado), y `+` solo al
// principio (prefijo internacional). Lo demás (espacios, guiones, letras pegadas) se quita. Qué
// números se pueden marcar lo decide One-Desk.
export const sanitizeDialInput = (value: string): string => {
  const kept = value.replace(/[^\d*#+]/g, '')
  return kept.startsWith('+') ? `+${kept.slice(1).replaceAll('+', '')}` : kept.replaceAll('+', '')
}
