const config = require('config');
const { body, validationResult } = require('express-validator/check');
const i18n = require('i18n');
const mongoose = require('mongoose');

var HostDetail = require('../models/HostDetail');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('province_id')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('province'));
                    }),
                body('car_type_id')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('car_type'));
                    }),
                body('quantity')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('quantity'));
                    })
                    .isInt({ min: 1 }).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('quantity'));
                    }),
            ]
        case 'update':
            return [
                // body('quantity')
                //     .exists().withMessage(() => {
                //         return i18n.__mf('required', i18n.__('quantity'));
                //     })
                //     .isInt({ min: 1 }).withMessage(() => {
                //         return i18n.__mf('invalid', i18n.__('quantity'));
                //     }),
                body('user')
                    .custom(async (value, {req}) => {
                        let check_detail = await HostDetail.findById({
                            _id: req.params.id
                        });
                        if (!check_detail || check_detail.user_id.toString() !== req.user._id.toString() ) {
                            throw new Error(i18n.__mf('unauthorize_user'));
                        }

                        return true;
                    })
            ]
        default:
            break;
    }
}

exports.createHostDetail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { province_id, car_type_id, quantity } = req.body;
        let check_detail = await HostDetail.findOne({
            user_id: req.user._id,
            province_id: province_id,
            car_type_id: car_type_id,
        });
        if (check_detail) {
            return res.status(409).json({ 
                message: i18n.__('detail_exist'),
            });
        }

        let host_detail = await HostDetail.create({
            user_id: req.user._id,
            province_id: province_id,
            car_type_id: car_type_id,
            quantity: quantity,
        })

        return res.status(201).json({
            message: i18n.__mf('create_success', i18n.__('working_province')),
            host_detail: host_detail,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateHostDetail = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // console.log(req.body);
        const { quantity, car_type_id, province_id } = req.body;

        let check_detail = await HostDetail.findOne({
            user_id: req.user._id,
            province_id: province_id,
            car_type_id: car_type_id,
        });
        if (check_detail) {
            return res.status(409).json({ 
                message: i18n.__('detail_exist'),
            });
        }

        let update_detail = await HostDetail.findOneAndUpdate(
            {
                _id: req.params.id
            },
            { 
                quantity: 1,
                province_id: province_id,
                car_type_id: car_type_id,
                updated_at: Date.now(),
            }
        );
        if (update_detail) {
            return res.status(200).json({ 
                message: i18n.__mf('update_success', i18n.__('working_province')),
                host_detail: update_detail
            });
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getListDetails = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        if (page && page !== 'undefined' && page !== 'null'
            && limit && limit !== 'undefined' && limit !== 'null') {
            let options = {
                $and: [
                    { user_id : req.user._id },
                ]
            }
            let host_details = await HostDetail.aggregate([
                { 
                    $match: options
                },
                { 
                    $lookup: 
                        {
                            from: "cartypes",
                            localField: "car_type_id",
                            foreignField: "_id",
                            as: "car_type"
                        }
                },
                { 
                    $lookup: 
                        {
                            from: "provinces",
                            localField: "province_id",
                            foreignField: "_id",
                            as: "province"
                        }
                },
                { $unwind: "$car_type" },
                { $unwind: "$province" },
            ]).skip((page -1) * limit).limit(limit);
    
            let totalDetails = await HostDetail.find({
                $and: [
                    { host_id : req.user._id },
                ]
            });
    
            total = totalDetails.length;
    
            return res.status(200).json({
                host_details: host_details,
                total: total,
            });   
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.deleteHostDetail = async (req, res) => {
    try {
        let host_detail = await HostDetail.deleteOne({
            _id: mongoose.Types.ObjectId(req.params.id),
        });

        return res.status(200).json({
            message: i18n.__mf('delete_success', i18n.__('working_province')),
            host_detail: host_detail,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}