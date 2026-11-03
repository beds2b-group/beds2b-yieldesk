// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import type { Unsubscribe } from '../../core/ports/events.ts'
import type { TabCoordinator, TabRole } from '../../core/ports/TabCoordinator.ts'

const NO_SUBSCRIPTION: Unsubscribe = () => {}

// Una sola pestaña, siempre líder y sin réplicas (architecture.md §5.5). Para las pruebas y para la
// página standalone cuando no interesa probar varias pestañas.
export class SingleTabCoordinator<TState, TCommand> implements TabCoordinator<TState, TCommand> {
  readonly role: TabRole = 'leader'

  onRoleChange(): Unsubscribe {
    return NO_SUBSCRIPTION
  }

  publishState(): void {}

  onState(): Unsubscribe {
    return NO_SUBSCRIPTION
  }

  sendCommand(): void {}

  onCommand(): Unsubscribe {
    return NO_SUBSCRIPTION
  }

  destroy(): void {}
}
