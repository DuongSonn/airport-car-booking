var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var CashFlow = new Schema({
    type: {
        type: Number,
        required: true,
    },
    sender_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    receiver_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    amount: {
        type: Number,
        required: true,
    },
    request_id: {
        type: mongoose.Types.ObjectId,
        ref: 'Request',
    },
    contract_id: {
        type: mongoose.Types.ObjectId,
        ref: 'Contract',
    },
    status: {
        type: Number,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('CashFlow', CashFlow);