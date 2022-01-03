const { Server } = require('bittorrent-tracker')
const port = process.env.PORT || 9090
const hostname = 'nameless-temple-25126.herokuapp.com'

let server = new Server({
	udp: false, // enable udp server? [default=true]
	http: false, // enable http server? [default=true]
	ws: true, // enable websocket server? [default=true]
	stats: true, // enable web-based statistics? [default=true]
	filter: (infoHash, params, cb) => {
         console.log(infoHash)
         /* infoHash === '' && */ cb(null)
    }
})
server.on('start', (a) => console.log('tracker: got start from ' + a))
server.on('listening', () => console.log('tracker: listening on port ' + server.ws.address().port))
server.on('complete', (a) => console.log('tracker: got complete from ' + a))
server.on('update', (a) => console.log('tracker: got update from ' + a))
server.on('stop', (a) => console.log('tracker: got stop from ' + a))
server.on('error', (err) => console.error('tracker: ', err.message))
server.on('warning', (err) => console.warn('tracker: ', err.message))
server.listen(port, hostname, () => console.log(hostname + ':' + port.toString()))
