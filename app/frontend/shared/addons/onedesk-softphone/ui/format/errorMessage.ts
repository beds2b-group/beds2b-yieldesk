// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { SoftphoneFailure } from '../../core/session/snapshot.ts'
import type { MessageKey } from '../i18n/es.ts'
import type { Translate } from '../i18n/translate.ts'

// `code` de One-Desk que tienen texto propio (DECISIONES.md, transferencia #6). Los demás se
// explican con el texto del código del error.
const PROBLEM_MESSAGES: Readonly<Record<string, MessageKey>> = {
  target_unavailable: 'problems.target_unavailable',
  transfer_in_progress: 'problems.transfer_in_progress',
  call_not_active: 'problems.call_not_active',
  not_your_call: 'problems.not_your_call',
  invalid_number: 'problems.invalid_number',
  number_not_allowed: 'problems.number_not_allowed',
  agent_busy: 'problems.agent_busy',
  invalid_status_transition: 'problems.invalid_status_transition',
  invalid_pause_reason: 'problems.invalid_pause_reason',
  twilio_error: 'problems.twilio_error',
  supervisor_busy: 'problems.supervisor_busy',
  already_monitoring: 'problems.already_monitoring',
  call_not_found: 'problems.call_not_found',
}

export const errorMessage = (t: Translate, failure: SoftphoneFailure): string => {
  const key = failure.problem === null ? undefined : PROBLEM_MESSAGES[failure.problem]
  return t(key ?? `errors.${failure.code}`)
}
