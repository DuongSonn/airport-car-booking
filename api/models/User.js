var mongoose =  require('mongoose');

var Schema = mongoose.Schema;
var User = new Schema({
    username: {
        type: String,
        required: 'Username is required',
    },
    phone: {
        type: String,
        required: 'Phone is required',
        match: [/((09|03|07|08|05)+([0-9]{8})\b)/g, 'Please fill in a valid phone number'],
    },
    email: {
        type: String,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: 'Password is required',
        min: [6, 'Password is too short'],
    },
    refresh_token: String,
    status: {
        type: Number,
        required: true,
        enum: [0, 1],
    },
    role: {
        type: String,
        required: true,
    },
    promo_code: String,
    avatar: {
        type: String,
        required: true,
        default: 'anonymous-user.png',
    },
    account_level: {
        type: Number,
        required: true,
        default: 2,
    },
    refer_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
    },
    language: {
        type: String,
        required: true,
        enum: ['vi', 'en'],
        default: 'en',
    },
    wallet: {
        type: Number,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: Date,

});

module.exports = mongoose.model('User', User);