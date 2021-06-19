const events = require('events');
const eventEmitter = new events.EventEmitter();
const ContractListener = require('../listeners/ContractListener');

function newContractEvent(contract) {
    //lắng nghe sự kiện
    eventEmitter.once('NEW_CONTRACT_CREATED', ContractListener.newContractListener);
    // sinh ra sự kiện
    eventEmitter.emit('NEW_CONTRACT_CREATED', contract);
    
}

module.exports = {
    newContractEvent: newContractEvent,
}