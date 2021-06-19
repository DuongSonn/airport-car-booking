const events = require('events');
const eventEmitter = new events.EventEmitter();
const RequestListener = require('../listeners/RequestListener');

function newRequestEvent(request) {
    //lắng nghe sự kiện
    eventEmitter.once('NEW_REQUEST_CREATED', RequestListener.newRequestListener);
    // sinh ra sự kiện
    eventEmitter.emit('NEW_REQUEST_CREATED', request);
    
}

function filterRequestEvent() {
    eventEmitter.once('FILTER_REQUEST', RequestListener.filterRequestListener);
    eventEmitter.emit('FILTER_REQUEST');
}

module.exports = {
    newRequestEvent: newRequestEvent,
    filterRequestEvent: filterRequestEvent,
}