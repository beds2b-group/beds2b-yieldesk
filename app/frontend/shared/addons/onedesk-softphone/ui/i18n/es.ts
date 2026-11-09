// Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí.
// Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md.

// Textos en español, el idioma por defecto (architecture.md §8.6). Las claves son planas y los datos
// van entre llaves: `{reason}`. `en.ts` tiene que traducir todas.
export const es = {
  'header.agent': '{extension} ({name})',
  'header.connecting': 'Conectando…',

  'status.offline': 'Desconectado',
  'status.available': 'Disponible',
  'status.reserved': 'Reservado',
  'status.on-call': 'En llamada',
  'status.wrap-up': 'Post-llamada',
  'status.paused': 'Pausa',
  'status.pausedWith': 'Pausa · {reason}',

  'actions.label': 'Acciones del agente',
  'actions.redial': 'Rellamar',
  'actions.ringMute': 'Silenciar',
  'actions.ringMuteTitle': 'Silenciar el timbre',
  'actions.ringUnmuteTitle': 'Activar el timbre',
  'actions.pause': 'Pausa',
  'actions.resume': 'Volver',
  'actions.resumeTitle': 'Volver a disponible',
  'actions.logout': 'Salir',

  'pause.label': 'Motivo de la pausa',

  'logout.withCall': 'Hay una llamada en curso. Si sales, se colgará.',
  'logout.confirm': 'Salir y colgar',
  'logout.cancel': 'Cancelar',

  'dial.numberLabel': 'Número',
  'dial.placeholder': 'Número a marcar',
  'dial.delete': 'Borrar',
  'dial.call': 'Llamar',
  'dial.hangup': 'Colgar',
  'dial.calling': 'Llamando a {number}…',
  'dial.agents': 'Agentes',
  'dial.country': 'País: {name}',
  'dial.countrySearch': 'Buscar país o prefijo',
  'dial.countryList': 'Países',
  'dial.noCountries': 'Ningún país coincide',

  'keypad.label': 'Teclado',

  'incoming.title': 'Llamada entrante',
  'incoming.answer': 'Contestar',
  'incoming.reject': 'Rechazar',

  'call.mute': 'Silenciar',
  'call.unmute': 'Activar micro',
  'call.muted': 'Micrófono silenciado',
  'call.hangup': 'Colgar',
  'call.transfer': 'Transferir',
  'call.ending': 'Finalizando…',
  'call.hold': 'Poner en espera',
  'call.resume': 'Retomar',
  'call.onHold': 'Cliente en espera · {duration}',

  'hangup.onHold': 'El cliente está en espera. ¿Colgar la llamada?',
  'hangup.confirm': 'Colgar',
  'hangup.cancel': 'Cancelar',

  'agents.title': 'Transferir llamada',
  'agents.back': 'Volver',
  'agents.list': 'Agentes',
  'agents.noCall': 'Sin llamada activa',
  'agents.loading': 'Cargando agentes…',
  'agents.loadFailed': 'No se ha podido cargar la lista de agentes.',
  'agents.empty': 'No hay otros agentes conectados.',
  'agents.extension': 'Ext. {extension}',
  'agents.transferTo': 'Transferir a {name}',
  'agents.hintNoCall': 'Inicia una llamada para poder transferirla',
  'agents.hintSelect': 'Elige a quién transferir la llamada',
  'agents.transferring': 'Transfiriendo a {name}…',
  'agents.transferringUnknown': 'Transfiriendo la llamada…',
  'agents.externalLabel': 'Número externo',
  'agents.externalPlaceholder': 'Transferir a un número',
  'agents.externalTransfer': 'Transferir a este número',
  'agents.externalAnswerFirst': 'Contesta para transferir a un número',

  'supervision.open': 'Panel de supervisión',
  'supervision.title': 'Supervisión',
  'supervision.back': 'Volver',
  'supervision.tabActive': 'En curso',
  'supervision.tabWaiting': 'En espera',
  'supervision.tabAgents': 'Agentes',
  'supervision.loading': 'Cargando la supervisión…',
  'supervision.noActive': 'No hay llamadas en curso.',
  'supervision.noWaiting': 'No hay llamadas en espera.',
  'supervision.noAgents': 'No hay agentes.',
  'supervision.noAgent': 'Sin agente',
  'supervision.held': 'En espera · {duration}',
  'supervision.listening': 'Escuchando',
  'supervision.listenTo': 'Escuchar la llamada de {name}',
  'supervision.waitingFor': 'Esperando {duration}',

  'monitoring.title': 'Escuchando',
  'monitoring.agent': 'Llamada de {name}',
  'monitoring.unknownAgent': 'Llamada de otro agente',
  'monitoring.hint': 'Solo escuchas: ni el agente ni el cliente te oyen.',
  'monitoring.panel': 'Ver panel',
  'monitoring.stop': 'Salir',

  'connection.connecting': 'Conectando con One-Desk…',
  'connection.registering': 'Registrando el teléfono…',
  'connection.retrying': 'Se reintentará automáticamente.',
  'connection.retry': 'Reintentar',
  'connection.signedOut': 'Has salido del teléfono. Recarga la página para volver a conectarte.',

  'notice.soundLocked': 'Sonido desactivado: haz clic en cualquier sitio',
  'notice.dismiss': 'Cerrar',

  'launcher.open': 'Abrir el teléfono',
  'launcher.close': 'Cerrar el teléfono',

  'notification.title': 'Llamada entrante',
  'notification.body': 'Llamada de {from}',

  'errors.mic-denied':
    'El navegador no deja usar el micrófono. Permítelo en la barra de direcciones y pulsa Reintentar.',
  'errors.not-registered': 'El teléfono no está registrado.',
  'errors.token-expired': 'La sesión del teléfono ha caducado.',
  'errors.network': 'No hay conexión con el servidor.',
  'errors.provider': 'Ha fallado el servicio de voz.',
  'errors.backend': 'One-Desk ha devuelto un error.',
  'errors.unauthenticated': 'No hay sesión en Zammad. Entra en Zammad para usar el teléfono.',
  'errors.forbidden': 'Tu usuario no es un agente activo de One-Desk.',
  'errors.conflict': 'Ahora no se puede hacer.',

  'problems.target_unavailable': 'Ese agente ya no está disponible.',
  'problems.transfer_in_progress': 'Ya hay una transferencia en curso.',
  'problems.call_not_active': 'La llamada ya no está activa.',
  'problems.not_your_call': 'Esta llamada ya no es tuya.',
  'problems.invalid_number': 'El número no es válido: escríbelo con el prefijo del país.',
  'problems.number_not_allowed': 'No se puede transferir a ese número.',
  'problems.agent_busy': 'No puedes cambiar de estado mientras atiendes una llamada.',
  'problems.invalid_status_transition': 'Ahora no puedes pasar a ese estado.',
  'problems.invalid_pause_reason': 'Ese motivo de pausa ya no existe.',
  'problems.twilio_error': 'La centralita no ha respondido. Inténtalo de nuevo.',
  'problems.supervisor_busy': 'Para escuchar tienes que estar disponible, en pausa o desconectado.',
  'problems.already_monitoring': 'Ya estás escuchando esa llamada.',
  'problems.call_not_found': 'Esa llamada ya no existe.',
} as const

export type MessageKey = keyof typeof es

export type Messages = Readonly<Record<MessageKey, string>>
