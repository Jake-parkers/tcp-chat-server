var server = require('net').createServer();
var net = require('net');
var port = process.env.PORT || 8080;
var sockets = [];
var remote_port = [];
var messsage = "";
/**
 * Bind to server events
 * listening
 * connection
 * close - Emitted when the server closes. Note that if connections exist, this event is not emitted until all connections are ended.
 * error -
 */
server.on('connection', (socket) => {
    socket.setEncoding('utf8');
    socket.setKeepAlive(true, 1000);
    sockets.push(socket);
    remote_port.push(socket.remotePort);
    // Show online users;
    sockets.forEach((sock) => {
        if (sockets.length === 1) sock.write("No one is online\n");
        if (socket.remotePort !== sock.remotePort) {
            message = socket.remotePort + " is online\n";
            sock.write(message);
            socket.write(sock.remotePort + " is online\n");
        }
    }, this);
    socket.on('data', (data) => {
        let resp = data.toString();
        sockets.forEach(function(other_socket) {
            /**
             * If message includes a ":" then message is specific to a particluar user; hence route it appropriately
             * else display it generally
             */
            if (resp.includes(":")) {
                let port = resp.substring(resp.indexOf(":"), 0);
                let msg = resp.substring(resp.indexOf(":") + 1, resp.length);
                if (other_socket != socket) {
                    if (port !== undefined) {
                        if (other_socket.remotePort === Number(port)) {
                            other_socket.write(`Client ${socket.remotePort}: ${msg}`);
                        }
                    }
                }
            } else {
                if (other_socket != socket) {
                    other_socket.write(`Client ${socket.remotePort}: ${data}`);
                }
            }
        }, this);

    });

    socket.on('close', (had_error) => {
        if (had_error) console.log('Connection closed due to transmission error');
        server.close();
    });

    socket.on('error', (err) => {
        if (err) {
            console.log('err.message');
        }
    });

    socket.on('end', () => {
        sockets.forEach(function(_socket) {
            if (socket === _socket) {
                return;
            } else {
                sockets.splice(sockets.indexOf(socket), 1);
                _socket.write(`${socket.remotePort} has left\n`);
                server.getConnections((err, count) => {
                    if (err) {
                        throw new Error(err.message);
                    }
                    console.log(count);
                });
            }
        }, this);
    });
});
server.on('listening', () => {
    return console.log('Server listening on ', server.address());
});

server.on('close', (err) => {
    if (err) return console.log('Server was not opened before');
    return console.log('Connection closed... Bye');
});

server.on('error', (err) => {
    if (err.code == 'EACCES') {
        console.log("You're not allowed to access this port");
    } else if (err.code == 'EADDRINUSE') {
        // If port is already in use, try reconecting every 5 secs
        // once reconneted, look out for 'listening' event and clear the interval
        console.log('Oops port already in use we\'d reconnect you.. Sit tight');
        let interval = setInterval(() => {
            server.listen(port, (listening) => {});
        }, 5000);

        server.on('listening', () => {
            clearInterval(interval);
        });

    } else {
        console.log('oops an error occurred ', err.message);
        server.close((err) => {
            if (err) return console.log('Server was not opened before');
            return console.log('Connection closed... Bye');
        });
    }

});

server.listen(port, 'localhost');