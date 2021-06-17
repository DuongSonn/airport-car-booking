var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var Request = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
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
    airport: String, 
    payment_type: {
        type: Number,
        required: 'Payment type is required',
    },
    payment_status: {
        type: Number,
        required: true,
        enum: [0,1]
    },
    pickup_at: {
        type: String,
        required: 'Pickup time is required',
    },
    status: {
        type: Number,
        required: true,
    },
    type: {
        type: Number,
        required: true,
        enum: [0,1],
    },
    code: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    base_price: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    note: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('Request', Request);