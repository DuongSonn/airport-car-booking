var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var HostDetail = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    province_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Province',
    },
    car_type_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'CarType',
    },
    quantity: {
        type: Number,
        required: 'Number of cars is required',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('HostDetail', HostDetail);