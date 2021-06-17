var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var BonusType = new Schema({
    description: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('BonusType', BonusType);