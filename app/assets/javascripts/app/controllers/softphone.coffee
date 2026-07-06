class App.Softphone extends App.ControllerPermanent

  constructor: ->
    super

    console.log 'Softphone permanent controller cargado'

    @controllerBind(
      'menu:render',
      =>
        console.log 'Navbar renderizado, pinto softphone flotante'
        @renderSoftphone()
      'softphone_menu_render'
    )

    @controllerBind(
      'ui:rerender',
      =>
        @renderSoftphone()
      'softphone_ui_rerender'
    )

  renderSoftphone: ->
    return if $('.navigation').length is 0

    # Evita duplicados si Zammad repinta el menú.
    $('.js-softphoneFloating').remove()

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


App.Config.set('Softphone',
  {
    controller: 'Softphone'
    permission: ['cti.agent']
  },
  'permanentTask'
)