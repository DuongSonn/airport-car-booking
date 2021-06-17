var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var RequestDestination = new Schema({
    request_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Request',
    },
    location: {
        type: [String],
        required: true,
    },
    type: {
        type: Number,
        required: true,
        enum: [0, 1],
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('RequestDestination', RequestDestination);