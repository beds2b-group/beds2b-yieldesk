# Allow Beds2B softphone iframe inside Zammad.
Rails.application.config.after_initialize do
  policy = Rails.application.config.content_security_policy

  policy.directives['frame-src'] ||= []
  policy.directives['frame-src'] |= [
    'https://beds2b-softphone.senator.tools'
  ]
end