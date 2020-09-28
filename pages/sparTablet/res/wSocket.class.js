function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
function $$(id)     { return document.querySelector(id)     }

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
                    this.pan = msg.pan
                    this.spread(msg.colas, msg.turnos)
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
                    document.body.classList.remove('error')
                    _this.check()
                break
            }
        }
    }

    close() {
        this.ws.close()
    }

    spread(colas, turnos) {
        var _this = this
        // Crea los divs con las colas
        let divColas = $('controles')
        while (divColas.firstChild) { divColas.removeChild(divColas.firstChild) }
        var exColas = []
        try { exColas = localStorage.getItem('exColas').split(',').map(Number) }catch(e){}
        for (let i=0; i < colas.length; i++) {
            if ( exColas.indexOf(i+1) == -1 ) { 
                let cola = document.createElement('div'); cola.dataset.cola =  `${i}`; cola.style = `background:${colas[i].color}`
                let nombre = document.createElement('h2'); nombre.textContent = colas[i].nombre
                let num = document.createElement('h1'); num.id = `cola${i}`; num.textContent = turnos[i].num
                let mas = document.createElement('button'); mas.className = 'control mas'; mas.onmousedown = (e)=>{ _this.send( {accion: 'sube', cola: e.target.parentElement.dataset.cola} ) }
                let menos = document.createElement('button'); menos.className = 'control menos'; menos.onmousedown = (e)=>{ _this.send( {accion: 'baja', cola: e.target.parentElement.dataset.cola}) }
                let reset = document.createElement('button'); reset.className = 'control reset'; reset.onmousedown = (e)=>{ confirm('¿Resetear los turnos a cero?', '', ()=> { _this.send( {accion: 'reset', cola: e.target.parentElement.dataset.cola}) } ) }
                mas.style = menos.style = reset.style = `color:${colas[i].color}`
                cola.appendChild(num)
                cola.appendChild(nombre)
                cola.appendChild(mas)
                cola.appendChild(menos)
                cola.appendChild(reset)
                $('controles').appendChild(cola)
            }
        }

        if (this.pan && !document.contains($('pan'))) {
            // Crea el boton del pan
            let sec = document.createElement('section'); sec.id = 'pan'
            let but = document.createElement('button'); but.className = 'control pan'; but.onmousedown = (e)=>{ confirm('¿Dar aviso de pan?', '', ()=>{navigator.sendBeacon('/pan/')} ) }
            sec.appendChild(but)
            $('mainFlex').appendChild(sec)
        }
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
            $$('#errorModal > div > h1').textContent = 'Sin conexión con el turnomatic'
            $$('#errorModal > div > p').textContent = `Intentando reconectar a ${this.ip}`
            document.body.classList.add('error')
        }, 5000)
      }
}