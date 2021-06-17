var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var ContractDriver = new Schema({
    name: {
        type: String,
        required: 'Name is required',
    },
    phone: {
        type: String,
        required: 'Phone is required',
    },
    avatar: String,
    car_plate: {
        type: String,
        required: 'Car plate is required',
    },
    car_name: {
        type: String,
        required: 'Car name is required',
    },
    contract_id: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Contract",
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,
});

module.exports = mongoose.model('ContractDriver', ContractDriver);