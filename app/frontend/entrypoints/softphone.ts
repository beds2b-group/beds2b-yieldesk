// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Entrypoint de Vite de la interfaz clásica: zammad:sync lo copia como
// app/frontend/entrypoints/softphone.ts y application.html.erb lo carga después de application.js
// (architecture.md §7.3). Fuera del fork, el alias apunta a src/ (tsconfig.json).
import { startClassicSoftphone } from '#shared/addons/onedesk-softphone/shells/zammad-classic/startClassicSoftphone.ts'

startClassicSoftphone({ window })
