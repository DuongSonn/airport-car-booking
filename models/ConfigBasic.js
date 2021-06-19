var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var ConfigBasic = new Schema({
    distance_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'ConfigDistance',
    },
    car_type_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'CarType',
    },
    cost: {
        type: Number,
        required: 'Max distance is required',
        min: [0, 'Cost must be greater than 0'],
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('ConfigBasic', ConfigBasic);