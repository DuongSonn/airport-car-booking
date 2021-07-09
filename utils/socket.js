require('dotenv').config();

const config = require('config');

const socket = (() => {
    var io;
    var agencies = [];
    var hosts = [];

    return {
        init: function(server) {
            io = require('socket.io')(server, {
                cors: {
                  origin: [`${process.env.CLIENT_URL}`, "http://localhost:3000"],
                },
            })

            io.sockets.on('connection', function (socket) {
                if (socket.handshake.query.role) {
                    if (socket.handshake.query.role === config.get('role.agency')) {
                        console.log("New agency connected " + socket.handshake.query._id);
                        agencies.push({
                            userId: socket.handshake.query._id,
                            socketId: socket.id
                        })
                    } else if (socket.handshake.query.role === config.get('role.host')) {
                        console.log("New host connected " + socket.handshake.query._id);
                        hosts.push({
                            userId: socket.handshake.query._id,
                            socketId: socket.id
                        })
                    }
                }
                socket.on("disconnect", async () => {
                    const matchingSockets = await io.in(socket.userID).allSockets();
                    const isDisconnected = matchingSockets.size === 0;
                    if (isDisconnected) {
                        if (socket.handshake.query.role === config.get('role.agency')) {
                            let index = agencies.findIndex(x => x.userId === socket.handshake.query._id)
                            agencies.splice(index, 1);
                        } else if (socket.handshake.query.role === config.get('role.host')) {
                            let index = hosts.findIndex(x => x.userId === socket.handshake.query._id)
                            hosts.splice(index, 1);
                        }
                    }
                })
            });
        },
        emitSocket: function(event, data, to) {
            if (to) {
                io.sockets.to(to).emit(event,data);
            } else {
                io.sockets.emit(event, data);
            }
        },
        getHostSocket: function() {
            return hosts
        },
        getAgencySocket: function() {
            return agencies
        }
    }
})()

exports.socket = socket