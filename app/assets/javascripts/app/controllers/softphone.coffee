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

  renderSoftphone: ->
    return if $('.navigation').length is 0

    existing = $('.js-softphoneFloating')
    if existing.length > 0
      @bindSoftphoneEvents()
      return

    html = App.view('navigation/softphone_floating')()
    $('body').append(html)

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