import { iconNames, $, modalBox } from './exports.js'

class wSocket {
    constructor(ip, port, touch=false) {
        this.ip = ip
        this.port = port
        this.pan = null
        this.touchEvent = touch? 'ontouchstart' : 'onmousedown'

        if ( localStorage.getItem('sinPan') == null ) { localStorage.setItem('sinPan', false) }
        if ( localStorage.getItem('sinTickets') == null ) { localStorage.setItem('sinTickets', false) }
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
                    this.spread(msg.colas, msg.turnos, msg.tickets)
                    this.setPan()
                break
                case 'update':
                    this.update(msg.cola, msg.numero)
                break
                case 'updateTicket':
                    this.updateTicket(msg.cola, msg.numero)
                break
                case 'event':
                    if (msg.event.type == 'pan' && this.pan) { 
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
                let but = document.createElement('button'); but.className = 'control pan'; but[this.touchEvent] = (e)=>{ modalBox('confirm', 'msgBox', [['header','¿Dar aviso de pan?']], 'aviso', ()=>{navigator.sendBeacon('/pan/')} ) }
                sec.appendChild(but)
                $('mainFlex').appendChild(sec)
            }
        } else {
            try { $('pan').remove() }catch(e){}
        }
    }

    spread(colas, turnos, tickets) {
        var _this = this
        // Crea los divs con las colas
        let divColas, divNombre, cola, nombre, ticket, icon, num, mas, menos, reset
        divColas = $('controles')
        while (divColas.firstChild) { divColas.removeChild(divColas.firstChild) }
        var exColas = []
        try { exColas = localStorage.getItem('exColas').split(',').map(Number) }catch(e){}
        for (let i=0; i < colas.length; i++) {
            if ( exColas.indexOf(i+1) == -1 ) { 
                cola = document.createElement('div'); cola.dataset.cola =  `${i}`; cola.style = `background:${colas[i].color}`
                
                divNombre = document.createElement('div');
                nombre = document.createElement('h2'); nombre.textContent = colas[i].nombre
                ticket = document.createElement('h3'); ticket.id = `ticket${i}`; ticket.textContent = `Ticket: ${tickets[i].num}`
                icon = document.createElement('i'); icon.className = `icon-${iconNames[colas[i].icon]}`
                num = document.createElement('h1'); num.id = `cola${i}`; num.textContent = turnos[i].num

                mas = document.createElement('button'); mas.className = 'control mas'; mas[this.touchEvent] = (e)=>{ _this.send( {accion: 'sube', cola: e.target.parentElement.dataset.cola} ) }
                menos = document.createElement('button'); menos.className = 'control menos'; menos[this.touchEvent] = (e)=>{ _this.send( {accion: 'baja', cola: e.target.parentElement.dataset.cola}) }
                reset = document.createElement('button'); reset.className = 'control reset'; reset[this.touchEvent] = (e)=>{ modalBox('confirm', 'msgBox', [['header','¿Resetear el turno a cero?']], 'aviso', ()=> { _this.send( {accion: 'reset', cola: e.target.parentElement.dataset.cola}) } ) }
                mas.style = menos.style = reset.style = `color:${colas[i].color}`

                nombre.appendChild(icon)
                divNombre.appendChild(nombre)
                if (localStorage.getItem('sinTickets')=='false') { divNombre.appendChild(ticket) }
                cola.appendChild(num)

                cola.appendChild(divNombre)
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

    updateTicket(ticket, num) {
        if (document.contains($(`ticket${ticket}`))) {
            $(`ticket${ticket}`).textContent = 'Ticket: ' + num.toString()
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