var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var Province = new Schema({
    name: {
        type: String,
        required: 'Name is required',
    },
    airports: [String],
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('Provinces', Province);