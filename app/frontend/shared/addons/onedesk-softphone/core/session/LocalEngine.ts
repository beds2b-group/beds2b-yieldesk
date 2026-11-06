// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

import { IDLE_CALL } from '../call/callMachine.ts'

import { CallController } from './CallController.ts'
import { EngineState } from './EngineState.ts'
import { ProviderHandle } from './ProviderHandle.ts'
import { RealtimeController } from './RealtimeController.ts'
import { RegistrationController } from './RegistrationController.ts'
import { SessionController } from './SessionController.ts'
import { SettingsPersistence } from './SettingsPersistence.ts'
import { INITIAL_SNAPSHOT, type SoftphoneSnapshot } from './snapshot.ts'
import { SupervisionController } from './SupervisionController.ts'

import type { EngineCommand } from './commands.ts'
import type { EngineTabCoordinator, SoftphoneEngine } from './SoftphoneEngine.ts'
import type { AgentSettings } from '../agent/agentSettings.ts'
import type { AgentSummary, BackendApi } from '../ports/BackendApi.ts'
import type { Clock } from '../ports/Clock.ts'
import type { Listener, Unsubscribe } from '../ports/events.ts'
import type { KeyValueStore } from '../ports/KeyValueStore.ts'
import type { Logger } from '../ports/Logger.ts'
import type { Notifier } from '../ports/Notifier.ts'
import type { RealtimeChannel } from '../ports/RealtimeChannel.ts'
import type { SoundPlayer } from '../ports/SoundPlayer.ts'
import type { TelephonyProvider } from '../ports/TelephonyProvider.ts'

export interface LocalEngineDependencies {
  // Carga el SDK con import() la primera vez que hace falta (architecture.md §8.5).
  createProvider: () => Promise<TelephonyProvider>
  backend: BackendApi
  // Hub de One-Desk: sin él, One-Desk da el teléfono por cerrado y no le ofrece llamadas.
  realtime: RealtimeChannel
  tabs: EngineTabCoordinator
  sounds: SoundPlayer
  notifier: Notifier
  store: KeyValueStore
  clock: Clock
  logger: Logger
}

export interface StartOptions {
  // El agente pulsó Salir en la líder anterior: esta pestaña no vuelve a conectarse hasta que se
  // recargue la página (DECISIONES.md, diseño #11).
  signedOut?: boolean
}

// Engine de la pestaña líder (architecture.md §5.4): conecta las máquinas con los puertos reales,
// publica cada foto a las réplicas y atiende las órdenes que le reenvían. Solo compone y reparte;
// el trabajo lo hacen SessionController, RegistrationController y CallController.
export class LocalEngine implements SoftphoneEngine {
  readonly tabRole = 'leader'

  private readonly deps: LocalEngineDependencies
  private readonly state = new EngineState(INITIAL_SNAPSHOT)
  private readonly persistence: SettingsPersistence
  private readonly provider: ProviderHandle
  private readonly session: SessionController
  private readonly registration: RegistrationController
  private readonly calls: CallController
  private readonly realtime: RealtimeController
  private readonly supervision: SupervisionController
  private readonly subscriptions: Unsubscribe[] = []

  constructor(deps: LocalEngineDependencies) {
    this.deps = deps
    this.persistence = new SettingsPersistence(deps.store, deps.logger)
    this.provider = new ProviderHandle(deps.createProvider, (provider) => this.listenTo(provider))
    this.registration = new RegistrationController({
      ...deps,
      state: this.state,
      provider: this.provider,
    })
    this.realtime = new RealtimeController({
      ...deps,
      state: this.state,
      onConnected: () => void this.supervision.load(),
    })
    this.session = new SessionController({
      ...deps,
      state: this.state,
      onActive: () => {
        this.realtime.start()
        this.registration.register()
      },
    })
    this.calls = new CallController({ ...deps, state: this.state, provider: this.provider })
    this.supervision = new SupervisionController({
      ...deps,
      state: this.state,
      answerMonitor: (monitored) => this.calls.answerMonitor(monitored),
      ringIncoming: (from) => this.calls.handleIncoming(from),
    })

    this.subscriptions.push(
      this.state.subscribe((snapshot) => deps.tabs.publishState(snapshot)),
      deps.tabs.onCommand((command) => this.dispatch(command)),
    )
  }

  get snapshot(): SoftphoneSnapshot {
    return this.state.snapshot
  }

  // Al abrir Zammad, o al pasar a ser la líder, el teléfono se conecta solo (architecture.md §6.1).
  start({ signedOut = false }: StartOptions = {}): void {
    this.persistence.forgetLegacySession()
    this.state.patch({ settings: this.persistence.loadSettings() })
    this.deps.tabs.publishState(this.state.snapshot)
    if (signedOut) this.state.patch({ session: { status: 'signed-out' } })
    else this.session.connect()
  }

  subscribe(listener: Listener<SoftphoneSnapshot>): Unsubscribe {
    return this.state.subscribe(listener)
  }

  dispatch(command: EngineCommand): void {
    switch (command.type) {
      case 'logout':
        void this.logout()
        return
      case 'retry':
        this.retry()
        return
      case 'set-status':
        void this.session.setStatus(command.change)
        return
      case 'dial':
        this.calls.dial(command.to)
        return
      case 'redial':
        this.calls.redial()
        return
      case 'answer':
        this.calls.answer()
        return
      case 'reject':
        this.calls.reject()
        return
      case 'hangup':
        this.calls.hangup()
        return
      case 'set-muted':
        this.calls.setMuted(command.muted)
        return
      case 'press-key':
        this.calls.pressKey(command.digit)
        return
      case 'transfer':
        void this.calls.transfer(command.target)
        return
      case 'hold':
        void this.calls.hold()
        return
      case 'resume':
        void this.calls.resume()
        return
      case 'monitor-call':
        void this.supervision.startMonitoring(command.callId)
        return
      case 'stop-monitoring':
        void this.calls.leaveMonitoring((callId) => this.deps.backend.stopMonitoring(callId))
        return
      case 'update-settings':
        this.updateSettings(command.settings)
        return
      case 'dismiss-error':
        this.state.patch({ error: null })
        return
      default:
        command satisfies never
    }
  }

  listAgents(): Promise<readonly AgentSummary[]> {
    return this.deps.backend.listAgents()
  }

  // Cierre de sesión en Zammad o pestaña que deja de ser líder: cuelga, da de baja y libera el SDK
  // (architecture.md §8.3). El agente no pasa a `offline`: la siguiente líder sigue con la sesión.
  async destroy(): Promise<void> {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe()
    this.session.dispose()
    this.supervision.dispose()
    this.calls.endActiveCall()
    await Promise.all([this.registration.unregister(), this.realtime.dispose()])
    this.provider.destroy()
    this.state.clear()
  }

  // Salir (DECISIONES.md, diseño #11). La confirmación con una llamada activa la pide la interfaz
  // antes de enviar la orden.
  private async logout(): Promise<void> {
    if (this.state.snapshot.session.status === 'signed-out') return

    this.calls.endActiveCall()
    // El cierre del canal empieza ya, para que no reconecte (One-Desk pasaría el agente de `offline`
    // a `paused`), pero no retrasa la baja de la sesión: una respuesta suya podría colarse.
    const closingRealtime = this.realtime.stop()
    await this.registration.unregister()
    await this.session.signOut()
    await closingRealtime
    this.supervision.clear()
    // Ya sin registro no llegará el aviso de fin de la llamada que se acaba de colgar.
    this.state.patch({ call: IDLE_CALL, pendingTransfer: null, error: null })
  }

  private retry(): void {
    const { session, registration } = this.state.snapshot
    if (session.status !== 'active') this.session.retry()
    else if (registration.status === 'error') this.registration.register()
  }

  private updateSettings(changes: Partial<AgentSettings>): void {
    const settings = { ...this.state.snapshot.settings, ...changes }
    this.persistence.saveSettings(settings)
    this.state.patch({ settings })
  }

  private listenTo(provider: TelephonyProvider): void {
    this.subscriptions.push(
      provider.on('registered', () => this.registration.handleRegistered()),
      provider.on('unregistered', () => this.registration.handleUnregistered()),
      provider.on('tokenWillExpire', () => this.registration.handleTokenWillExpire()),
      // La llamada de escucha del supervisor se contesta sola (SupervisionController).
      provider.on('incoming', ({ from, callSid = null }) => {
        if (!this.supervision.claimIncoming(callSid, from)) this.calls.handleIncoming(from)
      }),
      provider.on('accepted', () => this.calls.handleAccepted()),
      provider.on('disconnected', () => this.calls.handleDisconnected()),
      provider.on('cancelled', () => {
        this.supervision.handleIncomingEnded()
        this.calls.handleCancelled()
      }),
      provider.on('error', (error) => {
        if (error.code === 'token-expired') this.registration.handleTokenExpired(error)
        else this.calls.handleError(error)
      }),
    )
  }
}
