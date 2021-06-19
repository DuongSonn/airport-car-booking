const HostDetail = require("../models/HostDetail");
const { socket } = require("../utils/socket");
const config = require('config');
const Request = require("../models/Request");

function newRequestListener(request) {
    if (request._id) {
        HostDetail.find({
            province_id: request.province_id,
            car_type_id: request.car_type_id
        }).then(host => {
            let host_socket = socket.getHostSocket();

            for (let i = 0; i < host.length; i++) {
                for (let j = 0; j < host_socket.length; j++) {
                    if (host_socket[j].userId.toString() === host[i].user_id.toString()) {
                        socket.emitSocket("notification", {
                            message: "New Request Created",
                            type: config.get('notification.request')
                    }, host_socket[j].socketId);
                        break;
                    }
                }   
            }
        });
    }
}

function filterRequestListener () {
    let current = new Date().getTime();
    Request.updateMany({
        pickup_at: { $lte: current},
        status: config.get('request_status.new')
    }, {
        status: config.get('request_status.cancel')
    }).then(requests => {
        console.log("Done Filter")
    })
}
  
module.exports = {
    newRequestListener: newRequestListener,
    filterRequestListener: filterRequestListener
};