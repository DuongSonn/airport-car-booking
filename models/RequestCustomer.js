var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var RequestCustomer = new Schema({
    request_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Request',
    },
    name: {
        type: String,
        required: 'Name is required',
    },
    phone: {
        type: String,
        required: 'Phone is required',
        match: [/((09|03|07|08|05)+([0-9]{8})\b)/g, 'Please fill in a valid phone number'],
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('RequestCustomer', RequestCustomer);