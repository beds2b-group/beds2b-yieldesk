// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Almacén de preferencias y de la sesión del teléfono (architecture.md §8.2). Nunca guarda
// contraseñas ni tokens (architecture.md §8.1). El adaptador pone el prefijo de las claves.
export interface KeyValueStore {
  get(key: string): string | null
  set(key: string, value: string): void
  remove(key: string): void
}
