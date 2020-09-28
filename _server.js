const WebSocketServer = require('websocket').server
const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')
var config = null

function loadConfig() {
    try {
        config = JSON.parse( fs.readFileSync(`${__dirname}/config.json`) )
    } catch (error) {
        let configBackup = fs.readFileSync(`${__dirname}/.defaults/config.json.default`)
        fs.writeFileSync(`${__dirname}/config.json`, configBackup)
        config = JSON.parse( configBackup )
    }
}

// Cargar Turnos
try {
    var turnos = JSON.parse( fs.readFileSync(`${__dirname}/turnos.json`) )
    var origTurnos = JSON.parse(JSON.stringify(turnos)) // Copia el objeto
} catch (error) {
    let turnosBackup = fs.readFileSync(`${__dirname}/.defaults/turnos.json.default`)
    fs.writeFileSync(`${__dirname}/turnos.json`, turnosBackup)
    var turnos = JSON.parse( turnosBackup )
}

// Cargar Tickets
try {
    var tickets = JSON.parse( fs.readFileSync(`${__dirname}/tickets.json`) )
    var origTickets = JSON.parse(JSON.stringify(tickets)) // Copia el objeto
} catch (error) {
    let ticketsBackup = fs.readFileSync(`${__dirname}/.defaults/tickets.json.default`)
    fs.writeFileSync(`${__dirname}/tickets.json`, ticketsBackup)
    var tickets = JSON.parse( ticketsBackup )
}

/*----------  Actualiza los archivos JSON de turnos y tickets si han cambiado  ----------*/
function updateJsonFiles() {
    let curr = JSON.stringify(turnos, null, 3)
    let orig = JSON.stringify(origTurnos, null, 3)
    if (curr != orig) {
        fs.writeFileSync(`${__dirname}/turnos.json`, curr)
        origTurnos = JSON.parse(JSON.stringify(turnos))
    }

    curr = JSON.stringify(tickets, null, 3)
    orig = JSON.stringify(origTickets, null, 3)
    if (curr != orig) {
        fs.writeFileSync(`${__dirname}/tickets.json`, curr)
        origTickets = JSON.parse(JSON.stringify(tickets))
    }
}

/*----------  Actualiza el archivo JSON en disco con la configuracion del servidor  ----------*/
function updateConfigFile() {
    fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(config, null, 3) )
}

/*----------  Envia un mensaje a todos los clientes conectados por websocket  ----------*/
function broadcast(data) {
    if (data) {
        for (let i=0; i < wsServer.connections.length; i++) {
            wsServer.connections[i].sendUTF( JSON.stringify(data) )
        }
    }
}

function turno(accion, cola, texto='') {
    while (!turnos[cola]) { // Agrandar array hasta el numero
        turnos.push( {"num":0, "texto":""} )
    }

    switch (accion) {
        case 'sube':
            if ( turnos[cola].num < 99 )        { turnos[cola].num++ }
            else                                { turnos[cola].num = 0 }
        break
        case 'baja':
            if ( turnos[cola].num > 0 )         { turnos[cola].num-- }
            else                                { turnos[cola].num = 99 }
        break
        case 'reset':
            turnos[cola].num = 0
        break
    }

    turnos[cola].texto = texto
    return { accion: 'update', cola: cola, numero: turnos[cola].num, texto: texto }
    
}

function ticket(cola) {
    if ( tickets[cola].num < 99 )                { tickets[cola].num++ }
    else                                         { tickets[cola].num = 0 }

    return { accion: 'updateTicket', cola: cola, numero: tickets[cola].num }
}

loadConfig()

/*=============================================
=            SERVIDOR HTTP            =
=============================================*/
const server = http.createServer((req, res) => {
    const pet = req.url.split('/')
    switch(pet[1]) {
        case 'turno':
            broadcast( turno( pet[2], pet[3], decodeURI(pet[4] )) )
            res.end()
        break
        case 'ticket':
            const ret = ticket( pet[2] )
            res.writeHead(200, {'Content-Type': 'text/plain'})
            res.write( ret.numero.toString() )
            res.end()
            broadcast( ret )
        break
        case 'control':
            fs.readFile(`${__dirname}/pages/sparTablet/panel.html`, 'binary', (err, file)=> {
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.write( file, 'binary' )
                res.end()
            })
        break
        case 'qr':
            fs.readFile(`${__dirname}/pages/qr/qr.html`, 'binary', (err, file)=> {
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.write( file, 'binary' )
                res.end()
            })
        break
        case 'mobile':
            fs.readFile(`${__dirname}/pages/mobile/mobile.html`, 'binary', (err, file)=> {
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.write( file, 'binary' )
                res.end()
            })
        break
        case 'pan':
            if (config.pan) { broadcast( {accion: 'pan'} ) }
            res.end()
        break
        case 'getColas':
                loadConfig()
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.write( JSON.stringify({colas: config.colas}) )
                res.end()
        break;
        case 'setColas':
                req.on('data', (data)=> {
                    config.colas = JSON.parse( data.toString() )
                    updateConfigFile()
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.write( JSON.stringify( { status:'ok', error:'' } ) )
                    res.end()
                    broadcast( {accion:'spread', colas: config.colas, turnos: turnos, tickets: tickets} )
                })
        break
        /* MICRO-SERVIDOR DE ARCHIVOS ESTATICOS */
        default:
            const filename = __dirname + url.parse(req.url).pathname
            fs.exists(filename, (exists)=> {
                if (exists) {
                    const contentTypesByExtension = {
                        '.html': 'text/html',               '.css':  'text/css',
                        '.js':   'text/javascript',         '.jpg': 'image/jpeg',
                        '.svg':  'image/svg+xml',           '.png': 'image/png',
						'.json': 'application/json'
                    }
                    const contentType = contentTypesByExtension[path.extname(filename)]
                    let headers = {}
                    headers['Content-Type'] = contentType? contentType : 'application/octet-stream'
                    fs.readFile(filename, 'binary', (err, file)=> {
                        res.writeHead(200, headers)
                        res.write( file, 'binary' )
                        res.end()
                    })
                } else {
                    res.writeHead( 404, {'Content-Type': 'text/plain'} )
                    res.write('404'); res.end()
                }
            })
    }
})

/*=====  End of SERVIDOR HTTP  ======*/



/*=============================================
=            SERVIDOR WEBSOCKET            =
=============================================*/
const wsServer = new WebSocketServer({httpServer: server})

wsServer.on('request', (request) => {
    loadConfig()
    var connection = request.accept(null, request.origin)
    connection.sendUTF( JSON.stringify({accion:'spread', colas: config.colas, turnos: turnos, pan: config.pan, tickets: tickets}) )

    connection.on('message', (message) => {
        let msg = JSON.parse(message.utf8Data)
        broadcast( turno(msg.accion, msg.cola, msg.texto) )
    })
  
    connection.on('close', (connection) => { })
})

/*=====  End of SERVIDOR WEBSOCKET  ======*/
  

/*----------  HILO PRINCIPAL  ----------*/
server.listen(config.port)           
setInterval(updateJsonFiles, 5000)

setInterval(broadcast, 4000, {accion:'ping'}) // Envio de turnos a clientes para mantener conexiones abiertas

