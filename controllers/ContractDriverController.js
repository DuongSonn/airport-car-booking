const config = require('config');
const { body, validationResult } = require('express-validator/check');
const i18n = require('i18n');

var ContractDriver = require('../models/ContractDriver');
var Contract = require('../models/Contract');
var HostDriver = require('../models/HostDriver');
const { default: axios } = require('axios');
const CashFlow = require('../models/CashFlow');
const User = require('../models/User');
const e = require('cors');

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('name')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('name'));
                    }),
                body('phone')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('phone'));
                    })
                    .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('phone'));
                    }),
                body('car_plate')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('car_plate'));
                    }),
                body('car_name')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('car_name'));
                    }),
            ]
        case 'update':
            return [
                body('name')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('name'));
                    }),
                body('phone')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('phone'));
                    })
                    .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('phone'));
                    }),
                body('car_plate')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('car_plate'));
                    }),
                body('car_name')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('car_name'));
                    }),
                body('host_driver_id')
                    .optional()
                    .custom(async (value) => {
                        if (value) {
                            let check_driver = await HostDriver.findOne({ _id: value });
                            if (!check_driver) {
                                throw new Error(i18n.__mf('invalid', i18n.__('driver_information')));
                            }
                        }

                        return true;
                    }),
            ]
        default:
            break;
    }
}

exports.createContractDriver = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, avatar, car_plate, car_name, contract_id } = req.body;
        let contract_driver = await ContractDriver.create({
            name: name,
            phone: phone,
            avatar: avatar,
            car_plate: car_plate,
            car_name: car_name,
            contract_id: contract_id
        });

        res.status(201).json({
            message: i18n.__mf('create_success', i18n.__('contract_driver')),
            contract_driver: contract_driver,
        })

    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateContractDriver = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        var cash_flow;

        let contract_driver = await ContractDriver.findById({
            _id: req.params.id
        }).populate('contract_id');

        const contract_id = contract_driver.contract_id._id;

        if (contract_driver && contract_driver.contract_id.host_id.toString() === req.user._id.toString()
            && contract_driver.contract_id.status === config.get('contract_status.new')) {
            const { name, phone, avatar, car_plate, car_name, host_driver_id } = req.body;

            let contract = await Contract.findOne({
                _id: contract_id
            }).populate('request_id');

            var host_driver = await HostDriver.findOne({
                _id: host_driver_id
            }).populate('user_id');

            // Check new driver have enough money
            if (host_driver_id) {
                let admin = await User.findOne({
                    role: config.get('role.admin')
                });

                let amount = (contract.request_id.price - contract.request_id.price / 100 * contract.request_id.discount) - contract.request_id.base_price;
                amount = Math.round(amount / config.get('convert.vnd')) * config.get('convert.vnd');

                await axios.post(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows`, {
                    sender_id: host_driver.user_id._id,
                    receiver_id: admin._id,
                    amount: amount,
                    request_id: contract.request_id,
                    contract_id: contract_id,
                    type: config.get('cash_flow_type.transfer_inside_system'),
                }, {
                    headers: {
                        authorization: req.headers['authorization']
                    },
                }).then((response) => {
                   cash_flow = response.data.cash_flow;
                }).catch((error) => {
                    let message = error.response.data.message;
                    let errors = error.response.data.errors;
    
                    if (message) {
                        return res.status(500).json({
                            message: message,
                        })
                    } else {
                        return res.status(400).json({
                            errors: errors,
                        })
                    }
                });

                // Update Transaction
                await axios.put(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows/${cash_flow._id}`, null, {
                    headers: {
                        authorization: req.headers['authorization']
                    },
                }).then((response) => {
                    
                }).catch((error) => {
                    let message = error.response.data.message;
                    let errors = error.response.data.errors;
    
                    if (message) {
                        return res.status(500).json({
                            message: message,
                        })
                    } else {
                        return res.status(400).json({
                            errors: errors,
                        })
                    }
                });
            }

            // Return money to the last driver 
            if (contract.driver_id) {
                let check_cash_flow = await CashFlow.find({
                    contract_id: contract_id,
                    type: config.get('cash_flow_type.transfer_inside_system')
                });
                let length = check_cash_flow.length;

                await axios.post(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows`, {
                    sender_id: check_cash_flow[length-1].receiver_id,
                    receiver_id: check_cash_flow[length-1].sender_id,
                    amount: check_cash_flow[length-1].amount,
                    request_id: check_cash_flow[length-1].request_id,
                    contract_id: contract_id,
                    type: config.get('cash_flow_type.transfer_inside_system'),
                }, {
                    headers: {
                        authorization: req.headers['authorization']
                    },
                }).then((response) => {
                   cash_flow = response.data.cash_flow;
                }).catch((error) => {
                    let message = error.response.data.message;
                    let errors = error.response.data.errors;
    
                    if (message) {
                        return res.status(500).json({
                            message: message,
                        })
                    } else {
                        return res.status(400).json({
                            errors: errors,
                        })
                    }
                });

                // Update Transaction
                await axios.put(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows/${cash_flow._id}`, null, {
                    headers: {
                        authorization: req.headers['authorization']
                    },
                }).then((response) => {
                    
                }).catch((error) => {
                    let message = error.response.data.message;
                    let errors = error.response.data.errors;
    
                    if (message) {
                        return res.status(500).json({
                            message: message,
                        })
                    } else {
                        return res.status(400).json({
                            errors: errors,
                        })
                    }
                });
            }

            if (host_driver_id) {
                contract.driver_id = host_driver.user_id._id;
                contract.updated_at = Date.now();
                contract.save();
            } else {
                contract.driver_id = null;
                contract.updated_at = Date.now();
                contract.save();
            }
            let contract_driver = await ContractDriver.updateOne(
                { _id: req.params.id },
                {
                    name: name,
                    phone: phone,
                    avatar: avatar,
                    car_plate: car_plate,
                    car_name: car_name,
                    updated_at: Date.now(),
                }
            );

            return res.status(200).json({
                message: i18n.__mf('update_success', i18n.__('contract_driver')),
                contract_driver: contract_driver,
            })
        }

        return res.status(401).json({
            message: i18n.__mf('unauthorize_user'),
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}