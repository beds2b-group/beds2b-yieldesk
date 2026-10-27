# Copyright (C) 2026 Beds2B. Fichero añadido por Beds2B el 2026-07-08. Se
# distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad.
# Ver MODIFICATIONS.md.

# Allow Beds2B softphone iframe inside Zammad.
Rails.application.config.after_initialize do
  policy = Rails.application.config.content_security_policy

  policy.directives['frame-src'] ||= []
  policy.directives['frame-src'] |= [
    'https://beds2b-softphone.senator.tools'
  ]
end