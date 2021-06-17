var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var Role = new Schema({
    name: {
        type: String,
        required: 'Name is required',
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('Role', Role);