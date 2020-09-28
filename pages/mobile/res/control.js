function $(id) { return document.getElementById(id) } //Alias de 'getElementById'
function $$(css) { return document.querySelector(css) } //Alias de 'querySelector'
function $$$(css) { return document.querySelectorAll(css) } //Alias de 'querySelectorAll'

/**
 * Muestra el modal de confirmacion con un mensaje dado y una funcion a ejecutar si se acepta
 * @param {String} msg Mensaje a mostrar en el modal
 * @param {Function} accion Funcion a ejecutar si se acepta
 */
function confirm(msg, accion) {
    // Modal Fullscreen Wrapper
    let modal = document.createElement('div')
    modal.id = 'modal'

    // Botones
    let btnOk = document.createElement('button')
    btnOk.appendChild( document.createTextNode('Aceptar') )
    btnOk.id = 'ok'
    btnOk.ontouchstart = function() { accion(); modal.remove() }

    let btnCancel = document.createElement('button')
    btnCancel.appendChild( document.createTextNode('Cancelar') )
    btnCancel.id = 'cancel'
    btnCancel.ontouchstart = ()=> { modal.remove() }

    // Modal
    let modalBox = document.createElement('div')
    modalBox.textContent = msg
    modalBox.appendChild(btnOk)
    modalBox.appendChild(btnCancel)

    modal.appendChild(modalBox)
    document.body.appendChild(modal)
}

var ws = new wSocket(window.location.hostname, window.location.port)
ws.onticket = (e) => {
    console.log('ticket')
    navigator.sendBeacon('/ticket/' + e.target.parentElement.dataset.cola)
}
ws.init()