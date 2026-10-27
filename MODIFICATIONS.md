# Modificaciones de Beds2B sobre Zammad

Este repositorio es una versión modificada de [Zammad](https://github.com/zammad/zammad), © Zammad Foundation, distribuido bajo la licencia GNU Affero General Public License v3 (ver `LICENSE`). Beds2B ha modificado y ampliado Zammad para integrar el softphone de telefonía.

Este fichero cumple el aviso de modificaciones de la cláusula 5a de la AGPL-3.0. Cada fichero afectado lleva además un comentario en su cabecera con la fecha.

**Cómo mantenerlo:** cada cambio sobre un fichero de Zammad, o cada fichero nuevo, se añade a la tabla correspondiente, y se actualiza la fecha del comentario de cabecera de ese fichero. Las fechas son las de los commits (AAAA-MM-DD).

## Ficheros de Zammad modificados

| Última modificación | Fichero | Cambio |
|---|---|---|
| 2026-07-13 | `app/assets/stylesheets/zammad.scss` | Estilos del softphone flotante y del widget de llamada entrante |
| 2026-07-06 | `app/assets/javascripts/app/controllers/cti.coffee` | Los botones de aceptar y rechazar del widget de llamada envían órdenes al softphone (`sendSoftphoneCommand`) |
| 2026-07-06 | `app/assets/javascripts/app/views/navigation/menu_cti_ringing.jst.eco` | Iconos y textos de los botones de aceptar y rechazar |

## Ficheros añadidos por Beds2B

Se distribuyen bajo AGPL-3.0 como parte de esta versión modificada de Zammad.

| Añadido | Última modificación | Fichero | Contenido |
|---|---|---|---|
| 2026-07-06 | 2026-07-13 | `app/assets/javascripts/app/views/navigation/softphone_floating.jst.eco` | Plantilla del softphone flotante (iframe) |
| 2026-07-06 | 2026-07-10 | `app/assets/javascripts/app/controllers/softphone.coffee` | Controlador del softphone flotante: apertura, cierre, tamaño y permisos |
| 2026-07-08 | 2026-07-08 | `config/initializers/softphone_csp.rb` | Política de seguridad de contenido (CSP) que permite cargar el iframe del softphone |
| 2026-07-06 | 2026-07-06 | `public/assets/images/icons/call-in.svg` | Icono de aceptar llamada **[VERIFICAR origen y licencia]** |
| 2026-07-06 | 2026-07-06 | `public/assets/images/icons/call-hang-out.svg` | Icono de colgar llamada **[VERIFICAR origen y licencia]** |

## Contenido que no forma parte de Zammad

| Ruta | Qué es |
|---|---|
| `ChatbotDispo/` | Chatbot de disponibilidad en Python. Es un programa independiente que solo comparte repositorio; está previsto sacarlo a su propio repositorio |
