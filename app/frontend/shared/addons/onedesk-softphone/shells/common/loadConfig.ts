// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { parseConfig, type ConfigResult } from '../../config/parseConfig.ts'

// Lo sirve openresty fuera del build, uno por entorno (ADR-009).
export const CONFIG_URL = '/softphone/config.json'

const CONFIG_TIMEOUT_MS = 8_000

const failure = (error: string): ConfigResult => ({ ok: false, errors: [error] })

// Descarga y valida config.json. Nunca lanza: si falta o no es válido, el teléfono no se monta y
// Zammad sigue funcionando (architecture.md §8.3).
export const loadConfig = async (fetchConfig: typeof fetch): Promise<ConfigResult> => {
  let response: Response
  try {
    // no-cache: se revalida siempre, para que un cambio de config.json llegue al recargar.
    response = await fetchConfig(CONFIG_URL, {
      cache: 'no-cache',
      signal: AbortSignal.timeout(CONFIG_TIMEOUT_MS),
    })
  } catch {
    return failure(`${CONFIG_URL} could not be downloaded`)
  }
  if (!response.ok) return failure(`${CONFIG_URL} answered HTTP ${response.status}`)

  let raw: unknown
  try {
    raw = await response.json()
  } catch {
    return failure(`${CONFIG_URL} is not valid JSON`)
  }
  return parseConfig(raw)
}
