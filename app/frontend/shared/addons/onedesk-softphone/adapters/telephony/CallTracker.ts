// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md.

// Papel de una llamada cuando termina: la que estaba en curso, la entrante que estaba sonando, otra
// entrante que esperaba detrás, o una que ya no se seguía (por ejemplo, rechazada).
export type EndedCallRole = 'active' | 'ringing' | 'waiting' | 'untracked'

// Las llamadas de un SDK vistas desde el contrato de TelephonyProvider: los eventos hablan siempre
// de la llamada en curso o, si no hay, de la entrante que suena (la más reciente). Cualquier
// adaptador con SDK lo usa, para que todos decidan igual qué evento llega al engine.
export class CallTracker<TCall> {
  private activeCall: TCall | null = null
  // Entrantes sin contestar; la más reciente, al final.
  private readonly incoming: TCall[] = []
  // La última llamada que terminó siendo la actual. El SDK puede avisar del fallo justo después de
  // avisar del fin (por ejemplo, micrófono denegado al contestar), y ese fallo sí interesa.
  private lastEnded: TCall | null = null

  get active(): TCall | null {
    return this.activeCall
  }

  get current(): TCall | null {
    return this.activeCall ?? this.incoming.at(-1) ?? null
  }

  addIncoming(call: TCall): void {
    this.incoming.push(call)
    this.lastEnded = null
  }

  startOutgoing(call: TCall): void {
    this.activeCall = call
    this.lastEnded = null
  }

  // La entrante que se contesta pasa a ser la llamada en curso. Con otra en curso no hay nada que
  // contestar: el engine rechaza la segunda (core/agent).
  answerLatestIncoming(): TCall | null {
    if (this.activeCall !== null) return null
    this.activeCall = this.incoming.pop() ?? null
    return this.activeCall
  }

  // La entrante rechazada deja de seguirse: el puerto no emite nada más sobre ella.
  takeLatestIncoming(): TCall | null {
    return this.incoming.pop() ?? null
  }

  isActive(call: TCall): boolean {
    return call === this.activeCall
  }

  // Si un fallo de esta llamada debe llegar al engine.
  isReportable(call: TCall): boolean {
    return call === this.current || call === this.lastEnded
  }

  end(call: TCall): EndedCallRole {
    if (call === this.activeCall) {
      this.activeCall = null
      this.lastEnded = call
      return 'active'
    }

    const index = this.incoming.indexOf(call)
    if (index === -1) return 'untracked'

    const ringing = call === this.current
    this.incoming.splice(index, 1)
    if (!ringing) return 'waiting'
    this.lastEnded = call
    return 'ringing'
  }

  clear(): void {
    this.activeCall = null
    this.incoming.length = 0
    this.lastEnded = null
  }
}
