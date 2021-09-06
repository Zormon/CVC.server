import {$, $$$, modalBox, isTouchCapable} from './exports.js'
import wSocket from './wSocket.class.js'

var ws = new wSocket(window.location.hostname, window.location.port, isTouchCapable)
ws.init()

$('configBtn').onclick = () => {
  modalBox('Configuracion', 'configDialog', [], '',  ()=> {
    let selEx = []
    $$$('#exColas input[type="checkbox"]:checked').forEach(el => { selEx.push( el.id.substring(2) ) })

    localStorage.setItem('exColas', selEx)
    localStorage.setItem('sinPan', $('sinPan').checked)
    location.reload()
    }, ['Cancelar', 'Guardar'] 
  )

  $('sinPan').checked = (localStorage.getItem('sinPan')=='true')
  var exColas = []

  let colasString = localStorage.getItem('exColas')
  if (colasString) { 
    exColas = colasString.split(',').map(Number)
    exColas.forEach(el  => { $(`ex${el}`).checked = true })
  }
}