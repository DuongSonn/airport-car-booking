const i18n = require('i18n');

var CarType = require('../models/CarType');

exports.getListCarTypes = async (req, res) => {
    try {
        let car_types = await CarType.find();
        return res.status(200).json({
            car_types: car_types
        });
    } catch (error) {
        return res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}