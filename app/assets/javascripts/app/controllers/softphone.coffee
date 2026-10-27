# Copyright (C) 2026 Beds2B. Fichero añadido por Beds2B el 2026-07-06, última
# modificación el 2026-07-10. Se distribuye bajo AGPL-3.0 como parte de esta
# versión modificada de Zammad. Ver MODIFICATIONS.md.

class App.Softphone extends App.ControllerPermanent

  constructor: ->
    super

    console.log 'Softphone permanent controller cargado'

    @controllerBind(
      'menu:render',
      =>
        console.log 'Navbar renderizado, pinto softphone flotante'
        if @permissionCheck('ticket.agent') or @permissionCheck('admin')
          @renderSoftphone()
        else
          @removeSoftphone()

      'softphone_menu_render'
    )

    @controllerBind(
      'ui:rerender',
      =>
        if @permissionCheck('ticket.agent') or @permissionCheck('admin')
          @renderSoftphone()
        else
          @removeSoftphone()
      'softphone_ui_rerender'
    )
  
  bindSoftphoneResize: =>
    $(window).off('message.softphoneResize')

    $(window).on 'message.softphoneResize', (event) =>
      originalEvent = event.originalEvent

      return if originalEvent.origin isnt 'https://beds2b-softphone.senator.tools'
      return if !originalEvent.data
      return if originalEvent.data.type isnt 'resize'

      height = parseInt(originalEvent.data.height, 10)
      return if isNaN(height)

      minHeight = 200
      maxHeight = 500

      height = Math.max(minHeight, height)
      height = Math.min(maxHeight, height)

      $('#saraphone_iframe').css('height', "#{height}px")

  renderSoftphone: ->
    return if $('.navigation').length is 0

    existing = $('.js-softphoneFloating')
    if existing.length > 0
      @bindSoftphoneEvents()
      return

    html = App.view('navigation/softphone_floating')()
    $('body').append(html)

    @bindSoftphoneResize()
    @bindSoftphoneEvents()

  bindSoftphoneEvents: ->
    $('.js-softphoneToggle')
      .off('click.softphone')
      .on('click.softphone', (e) ->
        e.preventDefault()
        $('.js-softphonePanel').toggleClass('is-open')
      )

    $('.js-softphoneClose')
      .off('click.softphone')
      .on('click.softphone', (e) ->
        e.preventDefault()
        $('.js-softphonePanel').removeClass('is-open')
      )
  
  removeSoftphone: =>
    console.log 'Eliminando softphone flotante'

    iframe = document.getElementById('saraphone_iframe')

    if !iframe? || !iframe.contentWindow?
      console.warn(__('No se encontró el iframe de SaraPhone'))
      return

    iframe.contentWindow.postMessage(
      {
        source: 'zammad'
        action: 'reject-call'
      },
      'https://beds2b-softphone.senator.tools'
    )

    $('#floating-softphone').remove()


App.Config.set('Softphone',
  {
    controller: 'Softphone'
    permission: ['ticket.agent']
  },
  'permanentTask'
)