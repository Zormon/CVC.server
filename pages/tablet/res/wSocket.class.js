import { iconNames, $, modalBox } from './exports.js'

class wSocket {
    constructor(ip, port) {
        this.ip = ip
        this.port = port
        this.pan = null
    }

    init() {
        this.ws =  new WebSocket(`ws://${this.ip}:${this.port}`)
        var _this = this
        _this.check()

        this.ws.onmessage = (message) => {
            let msg = JSON.parse(message.data)
            switch (msg.accion) {
                case 'spread':
                    this.pan = msg.pan && (localStorage.getItem('sinPan')=='false')
                    this.spread(msg.colas, msg.turnos)
                    this.setPan()
                break
                case 'update':
                    this.update(msg.cola, msg.numero)
                break
                case 'pan':
                    if (this.pan) { 
                        $('pan').classList.add('disabled')
                        setTimeout( ()=> { $('pan').classList.remove('disabled') }, 28000)
                    }
                break
                default:
                    modalBox('OFFLINE', false)
                    _this.check()
                break
            }
        }
    }

    close() { this.ws.close() }

    setPan() {
        if (this.pan) {
            if (!document.body.contains($('pan'))) {
                let sec = document.createElement('section'); sec.id = 'pan'
                let but = document.createElement('button'); but.className = 'control pan'; but.onmousedown = (e)=>{ modalBox('confirm', 'msgBox', [['header','¿Dar aviso de pan?']], 'aviso', ()=>{navigator.sendBeacon('/pan/')} ) }
                sec.appendChild(but)
                $('mainFlex').appendChild(sec)
            }
        } else {
            try { $('pan').remove() }catch(e){}
        }
    }

    spread(colas, turnos) {
        var _this = this
        // Crea los divs con las colas
        let divColas, cola, nombre, icon, num, mas, menos, reset
        divColas = $('controles')
        while (divColas.firstChild) { divColas.removeChild(divColas.firstChild) }
        var exColas = []
        try { exColas = localStorage.getItem('exColas').split(',').map(Number) }catch(e){}
        for (let i=0; i < colas.length; i++) {
            if ( exColas.indexOf(i+1) == -1 ) { 
                cola = document.createElement('div'); cola.dataset.cola =  `${i}`; cola.style = `background:${colas[i].color}`
                nombre = document.createElement('h2'); nombre.textContent = colas[i].nombre
                icon = document.createElement('i'); icon.className = `icon-${iconNames[colas[i].icon]}`
                num = document.createElement('h1'); num.id = `cola${i}`; num.textContent = turnos[i].num
                mas = document.createElement('button'); mas.className = 'control mas'; mas.onmousedown = (e)=>{ _this.send( {accion: 'sube', cola: e.target.parentElement.dataset.cola} ) }
                menos = document.createElement('button'); menos.className = 'control menos'; menos.onmousedown = (e)=>{ _this.send( {accion: 'baja', cola: e.target.parentElement.dataset.cola}) }
                reset = document.createElement('button'); reset.className = 'control reset'; reset.onmousedown = (e)=>{ modalBox('confirm', 'msgBox', [['header','¿Resetear el turno a cero?']], 'aviso', ()=> { _this.send( {accion: 'reset', cola: e.target.parentElement.dataset.cola}) } ) }
                mas.style = menos.style = reset.style = `color:${colas[i].color}`
                cola.appendChild(num)
                cola.appendChild(nombre)
                nombre.appendChild(icon)
                cola.appendChild(mas)
                cola.appendChild(menos)
                cola.appendChild(reset)
                $('controles').appendChild(cola)
            }
        }

        $('controles').className = $('controles').children.length > 0 ? '' : 'hidden'
    }

    update(cola, num) {
        if (document.contains($(`cola${cola}`))) {
            $(`cola${cola}`).textContent = num.toString()
        }
    }

    send( data ) {
        this.ws.send( JSON.stringify( data ) )
    }

    check() {
        clearTimeout(document.wsTimeout)

        var _this = this
        document.wsTimeout = setTimeout( ()=> {
            _this.close()
            _this.init()
            _this.check()

            modalBox('OFFLINE', 'msgBox', [['header','ERROR DE CONEXIÓN'],['texto',`Conectando a ${this.ip}`]], 'error', false )
        }, 5000)
      }
}

export default wSocket