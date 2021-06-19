const { socket } = require("../utils/socket");
const config = require('config');
const Request = require("../models/Request");
const mongoose = require('mongoose');

function newContractListener(contract) {
    if (contract._id) {
        Request.findOne({
            _id: mongoose.Types.ObjectId(contract.request_id)
        }).then(request => {
            let user_id = request.user_id;
            let agency_socket = socket.getAgencySocket();
            let index = agency_socket.findIndex(x => x.userId.toString() === user_id.toString());
            console.log(index);
            if (index >= 0) {
                socket.emitSocket("notification", {
                    message: "New Contract Created",
                    type: config.get('notification.contract')
                }, agency_socket[index].socketId)
            }
        })
    }
}
  
module.exports = {
    newContractListener: newContractListener,
};