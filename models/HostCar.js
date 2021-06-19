var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var HostCar = new Schema({
    host_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    car_type_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'CarType',
    },
    brand: {
        type: String,
        required: 'Brand is required',
    },
    car_plate: {
        type: String,
        required: 'License is required',
    },
    car_name: {
        type: String,
        required: 'License is required',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('HostCar', HostCar);