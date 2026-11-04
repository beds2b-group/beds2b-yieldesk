# Modificaciones de Beds2B sobre Zammad

Este repositorio es una versión modificada de [Zammad](https://github.com/zammad/zammad), © Zammad Foundation, distribuido bajo la licencia GNU Affero General Public License v3 (ver `LICENSE`). Beds2B ha modificado y ampliado Zammad para integrar el softphone de telefonía.

Este fichero cumple el aviso de modificaciones de la cláusula 5a de la AGPL-3.0. Cada fichero afectado lleva además un comentario en su cabecera con la fecha.

**Cómo mantenerlo:** cada cambio sobre un fichero de Zammad, o cada fichero nuevo, se añade a la tabla correspondiente, y se actualiza la fecha del comentario de cabecera de ese fichero. Las fechas son las de los commits (AAAA-MM-DD).

## Ficheros de Zammad modificados

| Última modificación | Fichero | Cambio |
|---|---|---|
| 2026-10-30 | `app/views/layouts/application.html.erb` | Carga el entrypoint de Vite del softphone (`vite_typescript_tag 'softphone'`) |
| 2026-10-31 | `app/assets/javascripts/app/controllers/cti.coffee` | Los botones de aceptar y rechazar del widget de llamada envían órdenes al softphone (`sendSoftphoneCommand`, `CustomEvent`) |
| 2026-10-31 | `app/assets/stylesheets/zammad.scss` | Estilos del widget de llamada entrante |
| 2026-10-30 | `eslint.config.ts` | Excepción de `zammad-copyright` y `zammad-detect-translatable-string` para el softphone |
| 2026-11-04 | `package.json`, `pnpm-lock.yaml` | Dependencias `@twilio/voice-sdk` y `@microsoft/signalr` |
| 2026-07-06 | `app/assets/javascripts/app/views/navigation/menu_cti_ringing.jst.eco` | Iconos y textos de los botones de aceptar y rechazar |

## Ficheros añadidos por Beds2B

Se distribuyen bajo AGPL-3.0 como parte de esta versión modificada de Zammad.

| Añadido | Última modificación | Fichero | Contenido |
|---|---|---|---|
| 2026-10-30 | 2026-10-30 | `app/frontend/shared/addons/onedesk-softphone/` | Softphone, generado por `zammad:sync` desde `beds2b-softphone` (versión en `VERSION`) |
| 2026-10-30 | 2026-10-30 | `app/frontend/entrypoints/softphone.ts` | Entrypoint de Vite del softphone en la interfaz clásica, generado por `zammad:sync` |
| 2026-07-06 | 2026-07-06 | `public/assets/images/icons/call-in.svg` | Icono de aceptar llamada **[VERIFICAR origen y licencia]** |
| 2026-07-06 | 2026-07-06 | `public/assets/images/icons/call-hang-out.svg` | Icono de colgar llamada **[VERIFICAR origen y licencia]** |

## Contenido que no forma parte de Zammad

| Ruta | Qué es |
|---|---|
| `ChatbotDispo/` | Chatbot de disponibilidad en Python. Es un programa independiente que solo comparte repositorio; está previsto sacarlo a su propio repositorio |
