const i18n = require('i18n');

var Province = require('../models/Province');

exports.getListProvinces = async (req, res) => {
    try {
        let provinces = await Province.find();

        return res.status(200).json({
            provinces: provinces
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}