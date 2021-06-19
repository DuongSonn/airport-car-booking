var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var ConfigCombo = new Schema({
    airport: {
        type: String,
        required: true,
    },
    car_type_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'CarType',
    },
    distance: {
        type: Number,
        required: true,
    },
    type: {
        type: Number,
        required: true,
        enum: [0, 1],
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

module.exports = mongoose.model('ConfigCombo', ConfigCombo);