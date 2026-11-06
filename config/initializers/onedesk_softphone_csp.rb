# Copyright (C) 2026 Beds2B. Fichero añadido por Beds2B el 2026-11-06. Se
# distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad.
# Ver MODIFICATIONS.md.

# Softphone de Beds2B: el SDK de Twilio (@twilio/voice-sdk 2.18) envía por
# HTTPS (fetch) los eventos y las métricas de calidad de cada llamada
# (Voice Insights) a eventgw.twilio.com, o a eventgw.<región>.twilio.com
# cuando el teléfono se registra en una región (ie1 con el edge dublin de
# config.json). La CSP de Zammad solo permite connect-src 'self', ws: y wss:
# en producción, y en desarrollo permite https: entero, así que el bloqueo
# solo se ve en producción. La señalización va por wss: y ya está permitida.
# Si se cambia el edge de config.json, revisar la región de esta lista.
ONEDESK_SOFTPHONE_CONNECT_SOURCES = %w[
  https://eventgw.twilio.com
  https://eventgw.ie1.twilio.com
].freeze

Rails.application.config.after_initialize do
  policy = Rails.application.config.content_security_policy

  policy.directives['connect-src'] ||= []
  policy.directives['connect-src'] |= ONEDESK_SOFTPHONE_CONNECT_SOURCES
end
