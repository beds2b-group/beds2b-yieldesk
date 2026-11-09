// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Iniciales del avatar de la pantalla Agentes: la primera letra de las dos primeras palabras.
export const initials = (fullName: string): string =>
  fullName
    .split(/\s+/)
    .filter((word) => word !== '')
    .slice(0, 2)
    .map((word) => (Array.from(word)[0] ?? '').toLocaleUpperCase())
    .join('')
