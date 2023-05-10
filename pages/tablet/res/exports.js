
// Nombres de iconos de tipografia CVC Icons
const iconNames = [
    'ninguno',        // 0
    'carne',        // 1
    'pescado',      // 2
    'embutido',     // 3
    'fruta',        // 4
    'verdura',      // 5
    'pan',          // 6
    'comidas'       // 7
]

// Alias de selectores generales
var getById = document.getElementById.bind(document)
var querySel = document.querySelector.bind(document)
var querySelAll = document.querySelectorAll.bind(document)

// Otras funciones
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
function isFunction(f) {return f && {}.toString.call(f)==='[object Function]'}

/**
 * Muestra un modal con multiples funciones
 * @param {String} id Identificador del modal
 * @param {String} template Id del template html para el contenido
 * @param {Array} tplvars Selectores para rellenar texto en plantillas
 * @param {String} type Tipo de modal, para estilos CSS
 * @param {Function} accion Accion a realizar al pulsar el boton de aceptaar
 * @param {Array} buttons Textos alternativos para botones del modal
 */
function modalBox(id, template, tplvars=[], type='', accion=false, buttons=['Cancelar','Aceptar'], touchEvent='ontouchstart') {
    if ( template ) { // Añadir
      if (!document.contains( getById(id) )) {
        // Modal Fullscreen Wrapper
        let modal = document.createElement('div')
        modal.id = id; modal.className = 'modalBox ' + type
  
        // Modal
        let modalBox = document.createElement('div')
        let content = getById(template).content.cloneNode(true)
  
        // Template vars
        tplvars.forEach(item => {
          try { content.querySelector(`[data-tpl="${item[0]}"]`).innerHTML = item[1] } catch(e){}
        })
  
        modalBox.appendChild(content)
  
        // Botones
        if (accion) { 
          let btnCancel = document.createElement('button')
          btnCancel.appendChild( document.createTextNode(buttons[0]) )
          btnCancel.id = 'cancel'
          btnCancel[touchEvent] = ()=> { modal.remove() }
      
          let btnOk = document.createElement('button')
          btnOk.appendChild( document.createTextNode(buttons[1]) )
          btnOk.id = 'ok'
          btnOk[touchEvent] = ()=> { accion(); modal.remove() }
  
          modalBox.appendChild(btnOk)
          modalBox.appendChild(btnCancel)
        }
  
        modal.appendChild(modalBox)
        document.body.appendChild(modal)
      } else {
        tplvars.forEach(item => {
          try { getById(id).querySelector(`[data-tpl="${item[0]}"]`).textContent = item[1] } catch(e){}
        })
    }
    } else { // Si template es falso, es que se quiere destruir el modal
      try { getById(id).remove()} catch(e){}
    }
  }

// Para detectar si la pantalla es táctil. No es 100% fiable pero sirve para la mayoría de los casos
var isTouchCapable = 'ontouchstart' in window ||
 window.DocumentTouch && document instanceof window.DocumentTouch ||
 navigator.maxTouchPoints > 0 ||
 window.navigator.msMaxTouchPoints > 0;


export { 
    iconNames,
    sleep,
    modalBox,
    isFunction,
    isTouchCapable,
    getById as $,
    querySel as $$,
    querySelAll as $$$
}