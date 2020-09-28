function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }
function $$(id)     { return document.querySelector(id)     }
function isFunction(f) {return f && {}.toString.call(f)==='[object Function]'}

class wSocket {
    constructor(ip, port) {
        this.ip = ip
        this.port = port
        this.pan = null
        this.onticket = null
    }

    async init() {
        this.ws =  new WebSocket(`ws://${this.ip}:${this.port}`)
        var _this = this
        _this.check()

        this.ws.onmessage = (message) => {
            let msg = JSON.parse(message.data)
            switch (msg.accion) {
                case 'spread':
                    this.pan = msg.pan
                    this.spread(msg.colas, msg.turnos, msg.tickets)
                break
                case 'update':
                    this.update(msg.cola, msg.numero)
                break
                case 'updateTicket':
                    this.updateTicket(msg.cola, msg.numero)
                break
                case 'pan':
                    alert('Hay pan')
                break
                default:
                    document.body.classList.remove('error')
                    _this.check()
                break
            }
        }
    }

    async spread(colas, turnos, tickets) {
        // Crea los divs con las colas
        let divColas = $('controles')
        while (divColas.firstChild) { divColas.removeChild(divColas.firstChild) }
        for (let i=0; i < colas.length; i++) {
            let cola = document.createElement('div'); cola.dataset.cola =  `${i}`; cola.style = `background:${colas[i].color}`
            let nombre = document.createElement('h2'); nombre.textContent = colas[i].nombre
            let num = document.createElement('h1'); num.id = `cola${i}`; num.textContent = '-'
            let numTicket = document.createElement('h3'); numTicket.id = `tcola${i}`; numTicket.textContent = '-'
            let ticket = document.createElement('button'); ticket.className = 'control ticket'
            ticket.onmousedown = (e)=>{ 
                if ( isFunction(this.onticket) ) { this.onticket(e) }
            }
            ticket.style = `color:${colas[i].color}`
            cola.appendChild(num)
            cola.appendChild(nombre)
            cola.appendChild(ticket)
            cola.appendChild(numTicket)
            $('controles').appendChild(cola)
        }

        Object.keys(turnos).forEach((cola) => {
            if (document.contains( $(`${cola}`) ) ) {
                $(`${cola}`).textContent = turnos[cola]
            }
        })
    }

    async update(cola, num) {
        if (document.contains($(`${cola}`))) {
            $(`${cola}`).textContent = num.toString()
        }
    }

    async updateTicket(cola, num) {
        if (document.contains($$(`#t${cola}`))) {
            $$(`#t${cola}`).textContent = num.toString()
        }
    }

    async check() {
        clearTimeout(document.wsTimeout)
      
        var _this = this
        document.wsTimeout = setTimeout( ()=> {
            _this.init()
            _this.check()
            $$('#errorModal > div > h1').textContent = 'Sin conexión con el turnomatic'
            $$('#errorModal > div > p').textContent = `Intentando reconectar a ${remote.getGlobal('appConf').ip}`
            document.body.classList.add('error')
        }, 5000)
      }
}