var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var Contract = new Schema({
    request_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Request',
    },
    driver_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    host_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    status: {
        type: Number,
        required: true,
        enum: [0, 1, 2, 3, 4],
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('Contract', Contract);