var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var ConfigDistance = new Schema({
    min: {
        type: Number,
        required: 'Min distance is required',
    },
    max: {
        type: Number,
        required: 'Max distance is required',
        min: [this.min, 'Max distance must be greater than min distance'],
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('ConfigDistance', ConfigDistance);