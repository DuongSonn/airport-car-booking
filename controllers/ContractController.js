const config = require('config');
const { body, validationResult } = require('express-validator/check');
const i18n = require('i18n');
const mongoose = require('mongoose');
const axios = require('axios');

var Contract = require('../models/Contract');
var Request = require('../models/Request');
const HostDriver = require('../models/HostDriver');
const CashFlow = require('../models/CashFlow');
const User = require('../models/User');
const e = require('cors');

let api_url;
if (process.env.PORT && process.env.API_URL) {
    api_url = `${process.env.PORT}:${process.env.API_URL}`;
} else {
    api_url = config.get('api.app_api');
}

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('request_id')
                    .exists(),
                body('host_id')
                    .exists(),
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

exports.createContract = async (req, res) => {
    try {
        const { request_id, host_id, host_driver_id } = req.body;

        var contract;
        // Driver inside system
        if (host_driver_id) {
            let host_driver = await HostDriver.findOne({
                _id: host_driver_id
            }).populate('user_id');
            
            contract = await Contract.create({
                request_id: request_id,
                host_id: host_id,
                driver_id: host_driver.user_id._id,
                status: config.get('contract_status.new'),
            });

            let request = await Request.findOne({
                _id: mongoose.Types.ObjectId(request_id)
            });
            let delta = (request.price - request.price / 100 * request.discount) - request.base_price;
            delta = Math.round(delta / config.get('convert.vnd')) * config.get('convert.vnd');

            let admin = await User.findOne({
                role: config.get('role.admin')
            });

            let cash_flow;
            // Create Transaction
            await axios.post(`${api_url}/api/cash-flows`, {
                sender_id: host_driver.user_id._id,
                receiver_id: admin._id,
                amount: delta,
                request_id: request_id,
                contract_id: contract._id,
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

            if (cash_flow) {
                // Update Transaction
                await axios.put(`${api_url}/api/cash-flows/${cash_flow._id}`, null, {
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
        // Driver outside system
        } else {
            contract = await Contract.create({
                request_id: request_id,
                host_id: host_id,
                driver_id: null,
                status: config.get('contract_status.new'),
            });
        }

        return res.status(201).json({
            message: i18n.__mf('create_success', i18n.__('new_contract')),
            contract: contract,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateContract = async (req, res) => {
    try {
        const status = req.body.status;
        const contract_id = new mongoose.Types.ObjectId(req.params.id);

        var contract = await Contract.aggregate([
            { 
                $lookup: 
                    {
                        from: "requests",
                        localField: "request_id",
                        foreignField: "_id",
                        as: "request"
                    }
            },
            { $unwind: "$request" },
            {
                $match: { _id: contract_id }
            },
        ]);
        if (contract[0].host_id.toString() === req.user._id.toString() || 
            contract[0].driver_id.toString() === req.user._id.toString()) {
            let contract = await Contract.aggregate([
                { 
                    $lookup: 
                        {
                            from: "requests",
                            localField: "request_id",
                            foreignField: "_id",
                            as: "request"
                        }
                },
                { $unwind: "$request" },
                {
                    $match: { _id: contract_id }
                },
            ]);

            if (contract[0].request.status !== config.get('request_status.to_contract')) {
                return res.status(200).json({
                    message: i18n.__mf('update_fail', i18n.__('contract')),
                });
            }
            switch (status) {
                case 1:
                    if (contract[0].status !== config.get('contract_status.new')) {
                        return res.status(200).json({
                            message: i18n.__mf('update_fail', i18n.__('contract')),
                        });
                    }
                case 2:
                    if (contract[0].status !== config.get('contract_status.driver_start')) {
                        return res.status(200).json({
                            message: i18n.__mf('update_fail', i18n.__('contract')),
                        });
                    }
                case 3:
                    if (contract[0].status !== config.get('contract_status.new') 
                        && contract[0].status !== config.get('contract_status.driver_done')) {
                        return res.status(200).json({
                            message: i18n.__mf('update_fail', i18n.__('contract')),
                        });
                    }
                    // Check agency transfer money
                    if (contract[0].request.payment_type === config.get('payment_type.transfer_money') 
                        && contract[0].request.payment_status === config.get('payment_status.new')) {
                            return res.status(200).json({
                                message: i18n.__mf('update_fail', i18n.__('contract')),
                            });
                    } else {
                        await Request.updateOne(
                            { _id: contract[0].request_id },
                            { payment_status: config.get('payment_status.done') }
                        )
                    }
                default:
                    break;
            }

            if (contract[0].driver_id && status === config.get('contract_status.done')) {
                if (contract[0].request.payment_type === config.get('payment_type.transfer_money')) {
                    let check_cash_flow = await CashFlow.findOne({
                        type: config.get('cash_flow_type.transfer_to_system'),
                        request_id: contract[0].request_id
                    });
                    
                    let admin = await User.findOne({
                        role: config.get('role.admin')
                    });
    
                    let cash_flow
                        // Create Transaction
                    await axios.post(`${api_url}/api/cash-flows`, {
                        sender_id:admin._id,
                        receiver_id: contract[0].driver_id,
                        amount: check_cash_flow.amount,
                        request_id: check_cash_flow.request_id,
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
                    await axios.put(`${api_url}/api/cash-flows/${cash_flow._id}`, null, {
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
            }

            let update_contract = await Contract.updateOne(
                { _id: req.params.id },
                {
                    status: status,
                    updated_at: Date.now()
                }
            );

            return res.status(200).json({
                message: i18n.__mf('update_success', i18n.__('contract')),
                contract: update_contract
            });
        } else {
            return res.status(401).json({
                message: i18n.__mf('unauthorize_user'),
            });
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getContractDetail = async (req, res) => {
    try {
        const contract_id = new mongoose.Types.ObjectId(req.params.id);

        let contract = await Contract.aggregate([
            {
                $match: { _id:  contract_id }
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
                        from: "contractdrivers",
                        localField: "_id",
                        foreignField: "contract_id",
                        as: "contract_driver"
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
            { 
                $lookup: 
                    {
                        from: "hostdrivers",
                        localField: "driver_id",
                        foreignField: "user_id",
                        as: "host_driver"
                    }
            },
            { $unwind: "$request" },
            { $unwind: "$request_customers" },
            { $unwind: "$car_type" },
            { $unwind: "$province" },
        ]);

        if (contract.length === 0) {
            return res.status(500).json({
                message: i18n.__('unknown_error'),
            });
        }

        if (req.user.role === config.get('role.host') 
            && contract[0].host_id.toString() === req.user._id.toString()) {
            res.status(200).json({
                contract: contract[0]
            });
        } else if (req.user.role === config.get('role.agency') 
            && contract[0].request.user_id.toString() === req.user._id.toString()) {
            res.status(200).json({
                contract: contract[0]
            });
        } else {
            return res.status(401).json({
                message: i18n.__mf('unauthorize_user'),
            });
        }
     } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getListContracts = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        var status = req.query.status;
        var provinces = req.query.provinces;

        var contracts = null;

        var status_option;
        var province_option;

        if (provinces && provinces !== null && provinces !== 'undefined' && provinces !== 'null') {
            provinces = provinces.split(',');
            let or_array = [];
            provinces.forEach(province => {
                or_array.push({ 'request.province_id': mongoose.Types.ObjectId(province) });
            });
            province_option = {
                $or: or_array
            }
        } else {
            province_option = {};
        }

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
                    { status: config.get('contract_status.new') },
                    { status: config.get('contract_status.driver_start') },
                    { status: config.get('contract_status.driver_done') },
                    { status: config.get('contract_status.done') },
                    { status: config.get('contract_status.cancel') },
                ]
            }
        }

        if (req.user.role === config.get('role.agency')) {
            let options = {
                $and: [
                    { "request.user_id": req.user._id },
                    status_option,
                    province_option,
                ]
            }

            contracts = await Contract.aggregate([
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
                            from: "provinces",
                            localField: "request.province_id",
                            foreignField: "_id",
                            as: "province"
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
                            from: "contractdrivers",
                            localField: "_id",
                            foreignField: "contract_id",
                            as: "contract_driver"
                        }
                },
                { $unwind: "$request" },
                { $unwind: "$request_customers" },
                { $unwind: "$province" },
                { $unwind: "$car_type" },
                { $unwind: "$contract_driver" },
                {
                    $match: options
                },
            ])
            .skip((page - 1) * limit).limit(limit);

            let totalContract = await Contract.aggregate([
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
                    $match: options
                }
            ]);

            total = totalContract.length;
        } else if (req.user.role === config.get('role.host')) {
            let options = {
                $and: [
                    { host_id: req.user._id },
                    status_option,
                    province_option,
                ]
            }

            contracts = await Contract.aggregate([
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
                            from: "provinces",
                            localField: "request.province_id",
                            foreignField: "_id",
                            as: "province"
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
                            from: "contractdrivers",
                            localField: "_id",
                            foreignField: "contract_id",
                            as: "contract_driver"
                        }
                },
                { $unwind: "$request" },
                { $unwind: "$request_customers" },
                { $unwind: "$province" },
                { $unwind: "$car_type" },
                { $unwind: "$contract_driver" },
                { $sort: {'request.pickup_at': 1}}
            ]).skip((page - 1) * limit).limit(limit);

            let totalContracts = await Contract.aggregate([
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
                    $match: options
                }
            ]);

            total = totalContracts.length;
        } else if (req.user.role === config.get('role.driver')) {
            let options = {
                $and: [
                    { driver_id: req.user._id },
                    status_option,
                    province_option,
                ]
            }

            contracts = await Contract.aggregate([
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
                            from: "provinces",
                            localField: "request.province_id",
                            foreignField: "_id",
                            as: "province"
                        }
                },{ 
                    $lookup: 
                        {
                            from: "cartypes",
                            localField: "request.car_type_id",
                            foreignField: "_id",
                            as: "car_type"
                        }
                },
                { $unwind: "$request" },
                { $unwind: "$request_customers" },
                { $unwind: "$province" },
                { $unwind: "$car_type" },
                {
                    $match: options
                },
            ])
            .skip((page - 1) * limit).limit(limit);

            let totalContracts = await Contract.aggregate([
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
                    $match: options
                }
            ]);

            total = totalContracts.length;
        }

        return res.status(200).json({
            contracts: contracts,
            total: total
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.deleteContract = async (req, res) => {
    try {
        let check_contract = await Contract.findById({
            _id: req.params.id
        }).populate('request_id');
        if (check_contract && check_contract.host_id.toString() === req.user._id.toString() 
            && check_contract.status !== config.get('contract_status.done')) {

            if (check_contract.request_id.payment_type === config.get('payment_type.transfer_money')) {
                let check_cash_flow = await CashFlow.findOne({
                    request_id: check_contract.request_id
                });
                if (check_contract.request_id.payment_status === config.get('payment_status.new')) {
                    await axios.delete(`${api_url}/api/cash-flows/${check_cash_flow._id}`, {
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
                } else if (check_contract.request_id.payment_status === config.get('payment_status.done')) {
                    let cash_flow
                    // Create Transaction
                    await axios.post(`${api_url}/api/cash-flows`, {
                        sender_id: check_cash_flow.receiver_id,
                        receiver_id: check_cash_flow.sender_id,
                        amount: check_cash_flow.amount,
                        request_id: check_cash_flow.request_id,
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
                    await axios.put(`${api_url}/api/cash-flows/${cash_flow._id}`, null, {
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
            }
            
            check_contract.status = config.get('contract_status.cancel');
            check_contract.updated_at = Date.now();
            await check_contract.save();

            return res.status(200).json({
                message: i18n.__mf('cancel_success', i18n.__('contract')),
                contract: check_contract
            });
        }

        return res.status(200).json({
            message: i18n.__mf('cancel_fail', i18n.__('contract')),
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}