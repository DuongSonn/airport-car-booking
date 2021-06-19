const { __ } = require('i18n');
const i18n = require('i18n');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.changeLanguage = (req, res) => {
    let current_language = i18n.getLocale();
    let new_language = req.query.lang;
    if (new_language !== current_language) {
        i18n.setLocale(new_language);
    }

    const auth_header = req.headers['authorization'];
    const access_token = auth_header && auth_header.split(' ')[1];
    if (access_token != null) {
        jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({
                    message: i18n.__mf('invalid', i18n.__('token')),
                });
            }

            User.findOne({
                _id: user._id
            }).then(check_user => {
                check_user.language = new_language;
                check_user.save();
            }) 
        });
    }

    res.status(200).json({
        message: i18n.__('change_language_success'),
        language: new_language,
    })
}