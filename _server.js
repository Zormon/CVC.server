function clone(a) { return JSON.parse(JSON.stringify(a))}
const WebSocketServer = require('websocket').server
const http = require('http')
const fs = require('fs')
const path = require('path')
const url = require('url')

var lastEventTime = false

function loadJson(dir, file) {
    let data
    try {
        data = JSON.parse( fs.readFileSync(`${dir}/data/${file}.json`) )
    } catch (e) {
        let restore = fs.readFileSync(`${dir}/data/.defaults/${file}.json.default`)
        fs.writeFileSync(`${dir}/data/${file}.json`, restore)
        data = JSON.parse( restore )
    }
    return data
}


function loadEvents(file) {
    let data = {events:[]}
    try { data = JSON.parse( fs.readFileSync(file) ) } catch (e){}
    return data.events
}

function runEvents(evs) {
    let now = new Date(); 
    let nowDay = now.getDate().toString().padStart(2,'0') + '/' + (now.getMonth()+1).toString().padStart(2,'0') + '/' + now.getFullYear()
    let nowTime = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0')
    let nowWeekDay = now.getDay(); if (nowWeekDay==0) { nowWeekDay = 7 }; nowWeekDay--
    now.setHours(0,0,0,0)
    let hasta, desde
    
    /* Busca un evento que se tenga que emitir ahora
    Condiciones: 
        No se ha emitido un evento en el minuto actual el día de hoy
        La hora es la actual
        Las fechas son nulas o estan dentro del dia actual
        Los días de la semana incluye hoy
    */
    let event = evs.find( (e) => {
        desde = Date.parse( e.dateFrom )
        hasta = Date.parse( e.dateTo )

        if (
            lastEventTime != `${e.time}-${nowDay}`
            && e.time == nowTime
            && (!!!e.dateFrom || now >= desde)
            && (!!!e.dateTo || now <= hasta)
            && !!( e.weekdays & 1<<nowWeekDay)
        ) { return true }
    })


    if (typeof event !== 'undefined') { // Hay evento a esta hora
        event.type = 'media'
        broadcast( {accion:'event', event: event} )
        console.log( {accion:'event', event: event} )

        lastEventTime = `${event.time}-${nowDay}`
    }
    
}


/*----------  Actualiza los archivos JSON de turnos y tickets si han cambiado  ----------*/
function updateJsonFiles(turn, origTurn, tic, origTic) {
    let curr = JSON.stringify(turn, null, 3)
    let orig = JSON.stringify(origTurn, null, 3)
    if (curr != orig) {
        fs.writeFileSync(`${__dirname}/turnos.json`, curr)
        origTurn = JSON.parse(JSON.stringify(turn))
    }

    curr = JSON.stringify(tic, null, 3)
    orig = JSON.stringify(origTic, null, 3)
    if (curr != orig) {
        fs.writeFileSync(`${__dirname}/tickets.json`, curr)
        origTic = JSON.parse(JSON.stringify(tic))
    }
}

/*----------  Actualiza el archivo JSON en disco con la configuracion del servidor  ----------*/
function updateConfigFile(conf) {
    fs.writeFileSync(`${__dirname}/config.json`, JSON.stringify(conf, null, 3) )
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
            fs.readFile(`${__dirname}/pages/tablet/panel.html`, 'binary', (err, file)=> {
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
            if (config.pan) { broadcast( {accion:'event', event: {type:'pan', devices:[]}} ) }
            res.end()
        break
        case 'getConfig':
                config = loadJson(__dirname, 'config')
                res.writeHead(200, {'Content-Type': 'text/html'})
                res.write( JSON.stringify(config) )
                res.end()
        break;
        case 'setConfig':
                req.on('data', (data)=> {
                    data = JSON.parse(data)
                    config.pan = data.pan
                    config.colas = data.colas
                    updateConfigFile(config)
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.write( JSON.stringify( { status:'ok', error:'' } ) )
                    res.end()
                    broadcast( {accion:'spread', colas: config.colas, pan: config.pan, turnos: turnos, tickets: tickets} )
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
    config = loadJson(__dirname, 'config')
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
var config = loadJson(__dirname, 'config')
var turnos = loadJson(__dirname, 'turnos'); var origTurnos = clone(turnos)
var tickets = loadJson(__dirname, 'tickets'); var origTickets = clone(tickets)

server.listen(config.port)
setInterval(()=>{ updateJsonFiles(turnos, origTurnos, tickets, origTickets) }, 5000)
setInterval(()=>{ broadcast({accion:'ping'}) }, 4000) // Envio de turnos a clientes para mantener conexiones abiertas
setInterval(()=>{ 
    events = loadEvents(config.eventsFile)
    runEvents(events)
}, 2000)
