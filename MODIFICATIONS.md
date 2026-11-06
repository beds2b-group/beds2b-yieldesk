# Modificaciones de Beds2B sobre Zammad

Este repositorio es una versión modificada de [Zammad](https://github.com/zammad/zammad), © Zammad Foundation, distribuido bajo la licencia GNU Affero General Public License v3 (ver `LICENSE`). Beds2B ha modificado y ampliado Zammad para integrar el softphone de telefonía.

Este fichero cumple el aviso de modificaciones de la cláusula 5a de la AGPL-3.0. Cada fichero afectado lleva además un comentario en su cabecera con la fecha.

**Cómo mantenerlo:** cada cambio sobre un fichero de Zammad, o cada fichero nuevo, se añade a la tabla correspondiente, y se actualiza la fecha del comentario de cabecera de ese fichero. Las fechas son las de los commits (AAAA-MM-DD).

## Ficheros de Zammad modificados

| Última modificación | Fichero | Cambio |
|---|---|---|
| 2026-10-30 | `app/views/layouts/application.html.erb` | Carga el entrypoint de Vite del softphone (`vite_typescript_tag 'softphone'`) |
| 2026-10-30 | `eslint.config.ts` | Excepción de `zammad-copyright` y `zammad-detect-translatable-string` para el softphone |
| 2026-11-04 | `package.json`, `pnpm-lock.yaml` | Dependencias `@twilio/voice-sdk` y `@microsoft/signalr` |

## Ficheros añadidos por Beds2B

Se distribuyen bajo AGPL-3.0 como parte de esta versión modificada de Zammad.

| Añadido | Última modificación | Fichero | Contenido |
|---|---|---|---|
| 2026-10-30 | 2026-11-06 | `app/frontend/shared/addons/onedesk-softphone/` | Softphone, generado por `zammad:sync` desde `beds2b-softphone` (versión en `VERSION`) |
| 2026-10-30 | 2026-10-30 | `app/frontend/entrypoints/softphone.ts` | Entrypoint de Vite del softphone en la interfaz clásica, generado por `zammad:sync` |
| 2026-11-06 | 2026-11-06 | `config/initializers/onedesk_softphone_csp.rb` | Añade a `connect-src` de la CSP los hosts de Voice Insights de Twilio (`eventgw.twilio.com` y `eventgw.ie1.twilio.com`), a los que el SDK del softphone envía la calidad de las llamadas |
| 2026-11-03 | 2026-11-03 | `public/softphone/config.json` | Configuración del softphone en este entorno (proveedor, ruta de One-Desk, región de Twilio, idioma). No lleva credenciales |

## Ficheros devueltos a la versión de Zammad

Se modificaron en algún momento y hoy son idénticos a los de Zammad. Se dejan aquí para que conste.

| Fecha | Fichero | Motivo |
|---|---|---|
| 2026-11-06 | `app/assets/javascripts/app/controllers/cti.coffee`, `app/assets/javascripts/app/views/navigation/menu_cti_ringing.jst.eco`, `app/assets/stylesheets/zammad.scss` | Los botones de contestar y rechazar del widget de llamada los añade ahora el softphone, sin tocar Zammad. El cambio de `zammad.scss` también quitaba el margen entre botones en todo Zammad |
| 2026-11-06 | `public/assets/images/icons/call-in.svg`, `public/assets/images/icons/call-hang-out.svg` | Borrados: el softphone usa sus propios iconos. Su origen y su licencia no estaban verificados |
| 2026-11-06 | `.gitattributes`, `.devcontainer/default/devcontainer-lock.json`, `.devcontainer/features/add-bin-path/install.sh`, `.devcontainer/features/zammad-deps/install.sh` | Cambios accidentales de un rebase del 2026-07-06: un conflicto sin resolver, un lock antiguo, un BOM delante del shebang y `eol=lf` para todo el repositorio |
