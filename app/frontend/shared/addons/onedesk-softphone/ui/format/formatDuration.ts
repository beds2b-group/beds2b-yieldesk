// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

const twoDigits = (value: number): string => String(value).padStart(2, '0')

// Tiempo transcurrido entre dos instantes (epoch ms) como `mm:ss`, o `h:mm:ss` a partir de una hora.
export const formatDuration = (fromMs: number, toMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor((toMs - fromMs) / 1_000))
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const minutesAndSeconds = `${twoDigits(minutes)}:${twoDigits(seconds)}`
  return hours > 0 ? `${hours}:${minutesAndSeconds}` : minutesAndSeconds
}
