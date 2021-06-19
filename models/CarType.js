var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var CarType = new Schema({
    type: {
        type: Number,
        required: 'Name is required',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('CarType', CarType);