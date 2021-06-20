const i18n = require('i18n');
const config = require('config');
const { body, validationResult } = require('express-validator/check');
const mongoose = require('mongoose');

var CashFlow = require('../models/CashFlow');
const User = require('../models/User');
const Request = require('../models/Request');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('amount')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('amount'));
                    })
                    .isInt({ min: 10000 }).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('amount'))
                    }),
            ]
        default:
            break;
    }
}

exports.createCashFlow = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { type, request_id, contract_id, amount } = req.body
        var receiver_id;
        var sender_id;

        var admin = await User.findOne({
            role: config.get('role.admin')
        });
        switch (type) {
            case config.get('cash_flow_type.transfer_to_system'):
                receiver_id = admin._id;
                sender_id = req.user._id;

                break;
            case config.get('cash_flow_type.transfer_inside_system'):
                receiver_id = req.body.receiver_id;
                sender_id = req.body.sender_id;

                break;
            case config.get('cash_flow_type.admin'):
                break;
            case config.get('cash_flow_type.driver_recharge'):
                receiver_id = req.body.driver_id;
                sender_id = req.user._id;

                break;
            case config.get('cash_flow_type.driver_withdraw'):
                sender_id = req.body.driver_id;
                receiver_id = req.user._id;

                break;
            default:
                break;
        }

        if (type === config.get('cash_flow_type.transfer_inside_system') 
            || type === config.get('cash_flow_type.driver_withdraw')) {
            let check_user = await User.findOne({
                _id: mongoose.Types.ObjectId(sender_id)
            });
            if (check_user.role !== config.get('role.admin')) {
                if (!check_user.wallet || check_user.wallet - amount <= config.get('driver_deposit')) {
                    return res.status(400).json({
                        message: i18n.__('deposit_fail')
                    })
                }
            }
        }

        let cash_flow = await CashFlow.create({
            sender_id: sender_id,
            type: type,
            receiver_id: receiver_id,
            amount: amount,
            request_id: request_id,
            contract_id: contract_id,
            status: config.get('cash_flow_status.new')
        });

        if (cash_flow) {
            return res.status(201).json({
                cash_flow: cash_flow
            })
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getRequestCashFlow = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        var status = req.query.status;

        var requests = null;
        var total = 0;

        var status_option;

        if (status && status !== null && status !== 'undefined' && status !== 'null') {
            status = status.split(',');
            let or_array = [];
            status.forEach(state => {
                or_array.push({ status: parseInt(state) });
            });
            status_option = {
                $or: or_array
            }
        } else {
            status_option = {
                $or: [
                    { status: config.get('cash_flow_status.new') },
                    { status: config.get('cash_flow_status.done') },
                    { status: config.get('cash_flow_status.error') },
                ]
            }
        }

        let options = {
            $and: [
                { type: config.get('cash_flow_type.transfer_to_system') },
                status_option,
            ]
        }

        requests = await CashFlow.aggregate([
            { 
                $match: options
            },
            { 
                $lookup: 
                    {
                        from: "requests",
                        localField: "request_id",
                        foreignField: "_id",
                        as: "request"
                    }
            },
            { 
                $lookup: 
                    {
                        from: "requestdestinations",
                        localField: "request_id",
                        foreignField: "request_id",
                        as: "request_destinations"
                    }
            },
            { 
                $lookup: 
                    {
                        from: "requestcustomers",
                        localField: "request_id",
                        foreignField: "request_id",
                        as: "request_customers"
                    }
            },
            {
                $lookup: 
                    {
                        from: "cartypes",
                        localField: "request.car_type_id",
                        foreignField: "_id",
                        as: "car_type"
                    }
            },
            {
                $lookup: 
                    {
                        from: "provinces",
                        localField: "request.province_id",
                        foreignField: "_id",
                        as: "province"
                    }
            },
            { $unwind: "$request" },
            { $unwind: "$request_customers" },
            { $unwind: "$car_type" },
            { $unwind: "$province" },
        ]).skip((page -1) * limit).limit(limit);
        
        let totalCashFlows = await CashFlow.find(options);

        total = totalCashFlows.length;

        return res.status(200).json({
            requests: requests,
            total: total,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateCashFlow = async (req, res) => {
    try {
        let cash_flow = await CashFlow.findOne({
            _id: mongoose.Types.ObjectId(req.params.id)
        });

        var user;
        var wallet;
        switch (cash_flow.type) {
            case config.get('cash_flow_type.transfer_to_system'):
                if (cash_flow && cash_flow.status === config.get('cash_flow_status.new')) {
                    user = await User.findOne({
                        role: config.get('role.admin')
                    });
    
                    if (user._id.toString() === cash_flow.receiver_id.toString()) {
                        wallet = user.wallet || 0;
                        wallet += cash_flow.amount;
                        user.wallet = wallet;
                        user.save();
    
                        await Request.updateOne(
                            { _id: mongoose.Types.ObjectId(cash_flow.request_id) },
                            { 
                                payment_status: config.get('payment_status.done'),
                                updated_at: Date.now()
                            }
                        );
                    } else if (user._id.toString() === cash_flow.sender_id.toString()) {
                        wallet = user.wallet || 0;
                        wallet -= cash_flow.amount;
                        user.wallet = wallet;
                        user.save();
                    }
                } else {
                    return res.status(500).json({
                        message: i18n.__('unknown_error'),
                    });
                }

                break;
            case config.get('cash_flow_type.transfer_inside_system'):
                if (cash_flow && cash_flow.status === config.get('cash_flow_status.new')) {
                    let sender = await User.findOne({
                        _id: mongoose.Types.ObjectId(cash_flow.sender_id)
                    });
                    wallet = sender.wallet || 0;
                    wallet = wallet - cash_flow.amount;
                    sender.wallet = wallet;
                    sender.save();

                    let receiver = await User.findOne({
                        _id: mongoose.Types.ObjectId(cash_flow.receiver_id)
                    });
                    wallet = receiver.wallet || 0;
                    wallet = wallet + cash_flow.amount;
                    receiver.wallet = wallet;
                    receiver.save();
                } else {
                    return res.status(500).json({
                        message: i18n.__('unknown_error'),
                    });
                }

                break;
            case config.get('cash_flow_type.admin'):
                break;
            case config.get('cash_flow_type.driver_recharge'):
                user = await User.findOne({
                    _id: mongoose.Types.ObjectId(cash_flow.receiver_id)
                });

                wallet = user.wallet || 0;
                wallet += cash_flow.amount;
                user.wallet = wallet;
                user.save();

                break;
            case config.get('cash_flow_type.driver_withdraw'):
                user = await User.findOne({
                    _id: mongoose.Types.ObjectId(cash_flow.sender_id)
                });

                wallet = user.wallet || 0;
                wallet -= cash_flow.amount;
                user.wallet = wallet;
                user.save();

                break;
            default:
                break;
        }

        cash_flow.status = config.get('cash_flow_status.done');
        cash_flow.updated_at = Date.now();
        cash_flow.save();

        return res.status(200).json({
            cash_flow: cash_flow
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getDriverCashFlow = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        var status = req.query.status;

        var transactions = null;
        var total = 0;

        var status_option;

        if (status && status !== null && status !== 'undefined' && status !== 'null') {
            status = status.split(',');
            let or_array = [];
            status.forEach(state => {
                or_array.push({ status: parseInt(state) });
            });
            status_option = {
                $or: or_array
            }
        } else {
            status_option = {
                $or: [
                    { status: config.get('cash_flow_status.new') },
                    { status: config.get('cash_flow_status.done') },
                    { status: config.get('cash_flow_status.error') },
                ]
            }
        }

        let options = {
            $and: [
                { $or: [
                    { type: config.get('cash_flow_type.driver_recharge') },
                    { type: config.get('cash_flow_type.driver_withdraw') },
                ] },
                status_option,
            ]
        }

        transactions = await CashFlow.aggregate([
            { 
                $match: options
            },
            { 
                $lookup: 
                    {
                        from: "users",
                        localField: "sender_id",
                        foreignField: "_id",
                        as: "sender"
                    }
            },
            { 
                $lookup: 
                    {
                        from: "users",
                        localField: "receiver_id",
                        foreignField: "_id",
                        as: "receiver"
                    }
            },
            { $unwind: "$sender" },
            { $unwind: "$receiver" },
        ]).skip((page -1) * limit).limit(limit);
        
        let totalCashFlows = await CashFlow.find(options);

        total = totalCashFlows.length;

        return res.status(200).json({
            transactions: transactions,
            total: total,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.deleteCashFlow = async (req, res) => {
    try {
        let check_cash_flow = await CashFlow.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            {
                status: config.get('cash_flow_status.cancel'),
                updated_at: Date.now(),
            }
        );

        return res.status(200).json({
            cash_flow: check_cash_flow
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}
