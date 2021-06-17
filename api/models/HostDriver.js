var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var HostDriver = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    host_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    host_car_id: {
        type: mongoose.Types.ObjectId,
        ref: 'HostCar',
    },
    license: {
        type: String,
        required: 'License is required',
    },
    status: {
        type: Number,
        enum: [0, 1],
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('HostDriver', HostDriver);