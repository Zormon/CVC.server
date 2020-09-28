function $(id) { return document.getElementById(id) } //Alias de 'getElementById'
function $$(css) { return document.querySelector(css) } //Alias de 'querySelector'
function $$$(css) { return document.querySelectorAll(css) } //Alias de 'querySelectorAll'

/**
 * Muestra el modal de confirmacion con un mensaje dado y una funcion a ejecutar si se acepta
 * @param {String} msg Mensaje a mostrar en el modal
 * @param {Function} accion Funcion a ejecutar si se acepta
 */
function confirm(title, html, accion, buttons=['Cancelar', 'Aceptar']) {
    // Modal Fullscreen Wrapper
    let modal = document.createElement('div')
    modal.id = 'modal'

    // Botones
    let btnCancel = document.createElement('button')
    btnCancel.appendChild( document.createTextNode(buttons[0]) )
    btnCancel.id = 'cancel'
    btnCancel.onclick = ()=> { modal.remove() }

    let btnOk = document.createElement('button')
    btnOk.appendChild( document.createTextNode(buttons[1]) )
    btnOk.id = 'ok'
    btnOk.onclick = ()=> { accion(); modal.remove() }

    // Modal
    let modalBox = document.createElement('div')
    let h1 = document.createElement('h1')
    let div = document.createElement('div')
    h1.textContent = title
    div.innerHTML = html

    modalBox.appendChild(h1)
    modalBox.appendChild(div)
    modalBox.appendChild(btnOk)
    modalBox.appendChild(btnCancel)

    modal.appendChild(modalBox)
    document.body.appendChild(modal)
}

var ws = new wSocket(window.location.hostname, window.location.port)
ws.init()

$('configBtn').onclick = () => {
  const html = $('configDialog').innerHTML

  confirm('Configuracion', html, ()=> {
    let selEx = []
    $$$('#exColas input[type="checkbox"]:checked').forEach(el => { selEx.push( el.id.substring(2) ) })

    localStorage.setItem('exColas', selEx)
    location.reload()
  }, ['Cancelar', 'Guardar'] )

  var exColas = []
  try { exColas = localStorage.getItem('exColas').split(',').map(Number) }catch(e){}

  exColas.forEach(el  => { $(`ex${el}`).checked = true })
}