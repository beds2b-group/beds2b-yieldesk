// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

import type { SoftphoneSnapshot } from './snapshot.ts'
import type { HostBridge } from '../ports/HostBridge.ts'
import type { TabRole } from '../ports/TabCoordinator.ts'

// Al contestar una entrante se abre el formulario de «Nuevo ticket» del anfitrión, sin crear el
// ticket: lo rellena y lo guarda el agente (DECISIONES.md, «Nuevo ticket al contestar»). Lo abre una
// sola pestaña: la que dio la orden de contestar (botón del teléfono o del aviso CTI) o, si el
// teléfono contestó solo (`autoAnswer`), la líder.
export class NewTicketOnAnswer {
  private readonly host: HostBridge
  private previous: SoftphoneSnapshot['call']['status'] = 'idle'
  // Esta pestaña dio la orden de contestar la llamada que suena.
  private answeredHere = false

  constructor(host: HostBridge) {
    this.host = host
  }

  // Una orden atrasada, sin nada sonando, no cuenta: la llamada siguiente podría contestarla otra.
  answerRequested(): void {
    if (this.previous === 'incoming') this.answeredHere = true
  }

  observe(snapshot: SoftphoneSnapshot, role: TabRole): void {
    const { status } = snapshot.call
    const { previous } = this
    this.previous = status
    if (status === previous) return

    if (previous === 'incoming' && status === 'in-call') {
      const autoAnswered = role === 'leader' && snapshot.settings.autoAnswer
      if (this.answeredHere || autoAnswered) this.host.newTicket()
    }
    if (status !== 'incoming') this.answeredHere = false
  }
}
