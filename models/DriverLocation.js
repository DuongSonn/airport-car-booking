var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var DriverLocation = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    lat: Number,
    long: Number,
    location: Number,
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('DriverLocation', DriverLocation);