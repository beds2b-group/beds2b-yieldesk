// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { CountryCode } from '../../../core/dialing/countries.ts'

// Banderas 4:3 del paquete flag-icons 7.5.0 (MIT, ver LICENSE), copiadas al bundle: sin peticiones a
// terceros (DECISIONES.md, diseño #2). Solo las de los países del catálogo; Vite incrusta las
// pequeñas y sirve aparte las grandes, que se descargan cuando se muestran.
const FLAG_URLS = import.meta.glob<string>('./*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const flagUrl = (country: CountryCode): string | undefined => FLAG_URLS[`./${country}.svg`]
