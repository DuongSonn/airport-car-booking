const config = require('config');
const jwt = require('jsonwebtoken');
const i18n = require('i18n');

var User = require('../models/User');

require('dotenv').config();

exports.authenticateToken = (req, res, next) => {
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
                req.user = check_user,
                next();
            }) 
        });
    } else {
        return res.status(401).json({
            message: i18n.__mf('invalid', i18n.__('token')),
        });
    }
}

exports.authenticateRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role) || req.user.status !== config.get('account_status.active')) {
            return res.status(401).json({
                message: i18n.__('unauthorize_user'),
            });
        }

        next();
    }
}