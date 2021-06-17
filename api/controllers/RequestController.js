const axios = require('axios');
const config = require('config');
const { body, validationResult } = require('express-validator/check');
const i18n = require('i18n');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { socket } = require('../utils/socket');

var Request = require('../models/Request');
var Province = require('../models/Province');
var CarType = require('../models/CarType');
var RequestDestination = require('../models/RequestDestination');
var RequestCustomer = require('../models/RequestCustomer');
var ConfigCombo = require('../models/ConfigCombo');
var ConfigBonus = require('../models/ConfigBonus');
var BonusType = require('../models/BonusType');
var ConfigDistance = require('../models/ConfigDistance');
var ConfigBasic = require('../models/ConfigBasic');
var User = require('../models/User');
var HostDetail = require('../models/HostDetail');
var Contract = require('../models/Contract');
var CashFlow = require('../models/CashFlow');

var RequestDispatcher = require('../events/RequestDispatcher');
const ContractDispatcher = require('../events/ContractDispatcher');

require('dotenv').config();

async function calculateDistance(pickup_locations, drop_off_locations) {
    var distance = 0;
    var number_of_pickup_locations = pickup_locations.length;
    var number_of_drop_off_locations = drop_off_locations.length;

    if (number_of_pickup_locations > 1) {
        for (let index = 0; index < number_of_pickup_locations - 1; index++) {
            let api_url = config.get('api.google_distance_api') + 'origins=' + pickup_locations[index]
                + '&destinations=' + pickup_locations[index + 1] + '&key=' + process.env.GOOGLE_API_KEY;
            api_url = encodeURI(api_url)
            let response = await axios.get(api_url);
            distance += response.data.rows[0].elements[0].distance.value;
        }
    }

    let api_url = config.get('api.google_distance_api') + 'origins=' 
        + pickup_locations[number_of_pickup_locations - 1] + '&destinations=' 
        + drop_off_locations[0] + '&key=' + process.env.GOOGLE_API_KEY;    
    api_url = encodeURI(api_url)
    let response = await axios.get(api_url);
    distance += response.data.rows[0].elements[0].distance.value;

    if (number_of_drop_off_locations > 1) {
        for (let index = 0; index < number_of_drop_off_locations - 1; index++) {
            let api_url = config.get('api.google_distance_api') + 'origins=' + drop_off_locations[index]
                + '&destinations=' + drop_off_locations[index + 1] + '&key=' + process.env.GOOGLE_API_KEY;
            api_url = encodeURI(api_url)
            let response = await axios.get(api_url);
            distance += response.data.rows[0].elements[0].distance.value;
        }
    }

    return distance;
}

exports.calculatePrice = async (req, res) => {
    try {
        const { pickup_locations, drop_off_locations, pickup_time, airport, type, car_type_id} = req.body;
        var price = 0;
        var user_id = null;
        var discount = 0;

        // Calculate total distance of the request
        var distance = await calculateDistance(pickup_locations , drop_off_locations);
        distance = distance / config.get('convert.m_to_km');

        // Check for combo and calculate price base on distance
        let combo = await ConfigCombo.findOne({ 
            airport: airport,
            type: type,
            car_type_id: car_type_id,
        });
        if (combo) {
            if (distance <= combo.distance) {
                price += combo.cost;   
            } else if (distance > combo.distance) {
                price += combo.cost;
                let config_distance = await ConfigDistance.findOne({
                    $and: [
                        { min: { $lte: distance} },
                        { max: { $gt: distance} }
                    ]
                });
                let config_basic = await ConfigBasic.findOne({
                    car_type_id: car_type_id,
                    distance_id: config_distance._id
                });

                distance -= combo.distance;

                price += config_basic.cost * distance;
            }
        } else {
            let config_distance = await ConfigDistance.findOne({
                $and: [
                    { min: { $lte: distance} },
                    { max: { $gt: distance} }
                ]
            });
            let config_basic = await ConfigBasic.findOne({
                car_type_id: car_type_id,
                distance_id: config_distance._id
            });
            price += config_basic.cost * distance;
        }

        // 2 or more pickup locations fee
        if (pickup_locations.length > 1 || drop_off_locations.length > 1) {
            let bonus_type = await BonusType.findOne({ description: "Bonus thêm điểm đón"});
            let bonus = await ConfigBonus.findOne({ 
                airport: airport,
                car_type_id: car_type_id,
                type: bonus_type._id,
            });
            if (bonus) {
                price += (pickup_locations.length - 1) * bonus.cost;
                price += (drop_off_locations.length - 1) * bonus.cost;
            }
        }
        
        // pickup hour fee
        pickup_hour = new Date(pickup_time).getHours();
        if (pickup_hour < 9 || pickup_hour > 22) {
            let bonus_type = await BonusType.findOne({ description: "Bonus thêm khung giờ đón"});
            let bonus = await ConfigBonus.findOne({ 
                airport: airport,
                car_type_id: car_type_id,
                type: bonus_type._id,
            });
            if (bonus) {
                price += bonus.cost;
            }
        }

        // System fee
        price += (price * config.get('market_price') / 100);

        // Check for discount
        const auth_header = req.headers['authorization'];
        const access_token = auth_header && auth_header.split(' ')[1];
        if (access_token != null) {
            jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
                if (err) {
                    return res.status(403).json({
                        message: i18n.__mf('invalid', i18n.__('token')),
                    });
                }

                user_id = user._id
            });
        } else {
            if (pickup_locations.length > 1 || drop_off_locations.length > 1) {
                return res.status(200).json({
                    message: i18n.__('calculate_price_fail'),
                }); 
            }
        }

        price = Math.round(price / config.get('convert.vnd')) * config.get('convert.vnd');

        if (price !== 0) {
            if (user_id) {
                await User.findById({
                    _id: user_id
                }).then(check_user => {
                    if (check_user.account_level === config.get('account_level.level_2')) {
                        discount = config.get('discount_member');
                    }
                });
            }

            return res.status(200).json({
                price: price,
                user_id: user_id,
                discount: discount,
            });
        }

        return res.status(200).json({
            message: i18n.__('calculate_price_fail'),
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('calculate_price_fail'),
        });
    }
}

exports.validate = (method) => {
    switch (method) {
        case 'create':
            return [
                body('province_id')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('province'));
                    })
                    .custom(async (value) => {
                        let check_province = await Province.findOne({ _id: value });
                        if (!check_province) {
                            throw new Error(i18n.__mf('invalid', i18n.__('province')));
                        }

                        return true;
                    }),
                body('car_type_id')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('car_type'));
                    })
                    .custom(async (value) => {
                        let check_car = await CarType.findOne({ _id: value });
                        if (!check_car) {
                            throw new Error(i18n.__mf('invalid', i18n.__('car_type')));
                        }

                        return true;
                    }),
                body('payment_type')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('payment_method'));
                    })
                    .isIn([0, 1]).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('payment_method'));
                    }),
                body('phone')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('phone'));
                    })
                    .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('phone'));
                    }),
                body('name')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('name'));
                    }),
                body('airport')
                    .custom(async (value) => {
                        let check_airport = await Province.findOne({ airports: value });
                        if (!check_airport) {
                            throw new Error(i18n.__mf('invalid', i18n.__('airport')));
                        }

                        return true;
                    }),
                body('pickup_time')
                    .exists().withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('pickup_time'));
                    }),
                body('price')
                    .exists()
                    .isInt({ min: 10000 }).withMessage(() => {
                        return i18n.__('calculate_price_fail');
                    }),
                body('type')
                    .exists(),
                body('pickup_locations')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('pickup_location'));
                    })
                    .custom(async (value, {req}) => {
                        if (value === null) {
                            throw new Error(i18n.__mf('required', i18n.__('pickup_location')));
                        }

                        return true;
                    }),
                body('drop_off_locations')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('drop_off_location'));
                    })
                    .custom(async (value, {req}) => {
                        if (value === null) {
                            throw new Error(i18n.__mf('required', i18n.__('drop_off_location')));
                        }

                        return true;
                    }),
            ]
        case 'update':
            if (body['status'] && body['status'] === config.get('request_status.new'))
            {
                return [
                    body('province_id')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('province'));
                        })
                        .custom(async (value) => {
                            let check_province = await Province.findOne({ _id: value });
                            if (!check_province) {
                                throw new Error(i18n.__mf('invalid', i18n.__('province')));
                            }
    
                            return true;
                        }),
                    body('car_type_id')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('car_type'));
                        })
                        .custom(async (value) => {
                            let check_car = await CarType.findOne({ _id: value });
                            if (!check_car) {
                                throw new Error(i18n.__mf('invalid', i18n.__('car_type')));
                            }
    
                            return true;
                        }),
                    body('payment_type')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('payment_method'));
                        })
                        .isIn([0, 1]).withMessage(() => {
                            return i18n.__mf('invalid', i18n.__('payment_method'));
                        }),
                    body('phone')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('phone'));
                        })
                        .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                            return i18n.__mf('invalid', i18n.__('phone'));
                        }),
                    body('name')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('name'));
                        }),
                    body('airport')
                        .custom(async (value) => {
                            let check_airport = await Province.findOne({ airports: value });
                            if (!check_airport) {
                                throw new Error(i18n.__mf('invalid', i18n.__('airport')));
                            }
    
                            return true;
                        }),
                    body('pickup_time')
                        .exists().withMessage(() => {
                            return i18n.__mf('invalid', i18n.__('pickup_time'));
                        }),
                    body('price')
                        .exists(),
                    body('type')
                        .exists(),
                    body('pickup_locations')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('pickup_location'));
                        })
                        .custom(async (value, {req}) => {
                            if (value === null) {
                                throw new Error(i18n.__mf('required', i18n.__('pickup_location')));
                            }
    
                            return true;
                        }),
                    body('drop_off_locations')
                        .exists().withMessage(() => {
                            return i18n.__mf('required', i18n.__('drop_off_location'));
                        })
                        .custom(async (value, {req}) => {
                            if (value === null) {
                                throw new Error(i18n.__mf('required', i18n.__('drop_off_location')));
                            }
    
                            return true;
                        }),
                ]
            } else {
                return [];
            }
        default:
            break;
    }
}

exports.createRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { province_id, car_type_id, payment_type, phone, name, airport, user_id, discount,
            pickup_time, price, pickup_locations, drop_off_locations, type, note } = req.body;
        
        let code = require('crypto').randomBytes(4).toString('hex');

        let base_price = price - (price * config.get('request_fee') / 100);
        base_price = Math.round(base_price / config.get('convert.vnd')) * config.get('convert.vnd');
        
        let request = await Request.create({
            user_id: user_id,
            province_id: province_id,
            car_type_id: car_type_id,
            airport: airport,
            payment_type: payment_type,
            payment_status: config.get('payment_status.new'),
            pickup_at: pickup_time,
            status: config.get('request_status.new'),
            type: type,
            price: price,
            base_price: base_price,
            discount: discount,
            code: code,
            note: note,
        });

        if (request) {
            let request_customer = await RequestCustomer.create({
                request_id: request._id,
                name: name,
                phone: phone,
            });
    
            let pickup_location = await RequestDestination.create({
                request_id: request._id,
                location: pickup_locations,
                type: config.get('destination_type.pickup'),
            });
            
            let drop_off_location = await RequestDestination.create({
                request_id: request._id,
                location: drop_off_locations,
                type: config.get('destination_type.drop_off'),
            });
            
            // Dispatch notification for Host
            RequestDispatcher.newRequestEvent(request)

            //  create cashflow
            if (payment_type === config.get('payment_type.transfer_money')) {
                let amount;
                if (discount) {
                    amount = price - (price / 100 * discount)
                    amount = Math.round(amount / config.get('convert.vnd')) * config.get('convert.vnd');
                } else {
                    amount = price
                }
    
                await axios.post(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows`, {
                    type: config.get('cash_flow_type.transfer_to_system'),
                    amount: amount,
                    request_id: request._id,
                }, {
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
           
            return res.status(201).json({
                message: i18n.__mf('create_success', i18n.__('new_request')),
                request: request
            });
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateRequest = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { province_id, car_type_id, payment_type, phone, name, airport,
            pickup_time, price, pickup_locations, drop_off_locations, type, status } = req.body;

        let base_price = price - (price * config.get('request_fee') / 100);
        base_price = Math.round(base_price / config.get('convert.vnd')) * config.get('convert.vnd');
        
        let check_request = await Request.findOne({
            _id: req.params.id
        });
        // Update Request
        if (check_request.status === config.get('request_status.new') && 
            check_request.user_id.toString() === req.user._id.toString()) {
            let request = await Request.updateOne(
                { _id: req.params.id },
                {
                    province_id: province_id,
                    car_type_id: car_type_id,
                    airport: airport,
                    payment_type: payment_type,
                    pickup_at: pickup_time,
                    type: type,
                    price: price,
                    base_price: base_price,
                    updated_at: Date.now(),
                }
            );
            let request_customer = await RequestCustomer.updateOne(
                { request_id: req.params.id },
                {
                    name: name,
                    phone: phone,
                    updated_at: Date.now(),
                }
            );
    
            let pickup_location = await RequestDestination.updateOne(
                { 
                    request_id: req.params.id,
                    type: config.get('destination_type.pickup'),
                },
                {
                    location: pickup_locations,
                    updated_at: Date.now(),
                }
            );
            
            let drop_off_location = await RequestDestination.updateOne(
                { 
                    request_id: req.params.id,
                    type: config.get('destination_type.drop_off'),
                },
                {
                    location: drop_off_locations,
                    updated_at: Date.now(),
                }
            );

            return res.status(200).json({
                message: i18n.__mf('update_success', i18n.__('request')),
                request: request,
            });
        }

        // Create Contract 
        if (status === config.get('request_status.to_contract') && req.user.role === config.get('role.host')
            && check_request.status === config.get('request_status.new')) {
            const { driver_name, driver_phone, driver_avatar, car_plate, car_name, host_driver_id } = req.body;
            var contract;

            await axios.post(`${process.env.API_URL}:${process.env.PORT}/api/contracts`, {
                request_id: req.params.id,
                host_id: req.user._id,
                host_driver_id: host_driver_id,
            }, {
                headers: {
                    authorization: req.headers['authorization']
                },
            }).then((response) => {
                contract = response.data.contract;
            })
            .catch(async function (error) {
                let message = error.response.data.message

                return res.status(500).json({
                    message: message
                })
            });

            await axios.post(`${process.env.API_URL}:${process.env.PORT}/api/contracts/contract-driver`, {
                name: driver_name,
                phone: driver_phone,
                avatar: driver_avatar,
                car_plate: car_plate,
                car_name: car_name,
                contract_id: contract._id,
            }, {
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

            let request = await Request.updateOne(
                { _id: req.params.id },
                {
                    status: status,
                    updated_at: Date.now(),
                }
            );

            ContractDispatcher.newContractEvent(contract);

            return res.status(201).json({
                message: i18n.__mf('create_success', i18n.__('contract')),
                request: request,
                contract: contract,
            });
        } else if (check_request.status !== config.get('request_status.new')) {
            return res.status(401).json({
                message: i18n.__mf('create_fail', i18n.__('contract')),
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

exports.getListRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        var status = req.query.status;
        var provinces = req.query.provinces;
        var car_types = req.query.car_types;

        var requests = null;
        var total = 0;

        var status_option;
        var province_option;
        var car_type_option;

        if (req.user.role === config.get('role.agency')) {
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
                        { status: config.get('request_status.new') },
                        { status: config.get('request_status.cancel') },
                    ]
                }
            }

            if (provinces && provinces !== null && provinces !== 'undefined' && provinces !== 'null') {
                provinces = provinces.split(',');
                let or_array = [];
                provinces.forEach(province => {
                    or_array.push({ province_id: mongoose.Types.ObjectId(province) });
                });
                province_option = {
                    $or: or_array
                }
            } else {
                province_option = {};
            }

            if (car_types && car_types !== null && car_types !== 'undefined' && car_types !== 'null') {
                car_types = car_types.split(',');
                let or_array = [];
                car_types.forEach(car_type => {
                    or_array.push({ car_type_id: mongoose.Types.ObjectId(car_type) });
                });
                car_type_option = {
                    $or: or_array
                }
            } else {
                car_type_option = {};
            }

            let options = {
                $and: [
                    { user_id : req.user._id },
                    status_option,
                    province_option,
                    car_type_option,
                ]
            }

            requests = await Request.aggregate([
                { 
                    $match: options
                },
                { 
                    $lookup: 
                        {
                            from: "requestdestinations",
                            localField: "_id",
                            foreignField: "request_id",
                            as: "request_destinations"
                        }
                },
                { 
                    $lookup: 
                        {
                            from: "requestcustomers",
                            localField: "_id",
                            foreignField: "request_id",
                            as: "request_customers"
                        }
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
                { $unwind: "$request_customers" },
                { $unwind: "$car_type" },
                { $unwind: "$province" },
                { $sort: { pickup_at: 1 } }
            ]).skip((page -1) * limit).limit(limit);
            
            let totalRequests = await Request.find(options);

            total = totalRequests.length;
        } else if (req.user.role === config.get('role.host')) {
            let host_details = await HostDetail.find({
                user_id: req.user._id,
            });
            let province_id = [];
            let car_type_id = [];
            host_details.forEach(host_detail => {
                province_id.push(host_detail.province_id);
                car_type_id.push(host_detail.car_type_id);
            });

            let options = {
                $and: [
                    { province_id: { $in: province_id } },
                    { car_type_id: { $in: car_type_id } },
                    { status: config.get('request_status.new') },
                ]
            }

            requests = await Request.aggregate([
                {
                    $match: options  
                },
                { 
                    $lookup: 
                        {
                            from: "requestdestinations",
                            localField: "_id",
                            foreignField: "request_id",
                            as: "request_destinations"
                        }
                },
                { 
                    $lookup: 
                        {
                            from: "requestcustomers",
                            localField: "_id",
                            foreignField: "request_id",
                            as: "request_customers"
                        }
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
                { $unwind: "$request_customers" },
                { $unwind: "$car_type" },
                { $unwind: "$province" },
                { $sort: { pickup_at: 1 } }
            ]).skip((page - 1) * limit).limit(limit);

            let totalRequests = await Request.find(options);

            total = totalRequests.length;
        }

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

exports.getRequestDetail = async (req, res) => {
    try {
        const request_id = new mongoose.Types.ObjectId(req.params.id);
        var request = await Request.aggregate([
            { $match: { _id: request_id } },
            { 
                $lookup: 
                    {
                        from: "requestdestinations",
                        localField: "_id",
                        foreignField: "request_id",
                        as: "request_destinations"
                    }
            },
            { 
                $lookup: 
                    {
                        from: "requestcustomers",
                        localField: "_id",
                        foreignField: "request_id",
                        as: "request_customers"
                    }
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
            { $unwind: "$request_customers" },
            { $unwind: "$car_type" },
            { $unwind: "$province" },
        ]);
        if (!request) {
            return res.status(500).json({
                message: i18n.__('unknown_error'),
            });
        }
        if (request[0].user_id && request[0].user_id.toString() === req.user._id.toString() 
            && req.user.role === config.get('role.agency')) {
            return res.status(200).json({
                request: request[0],
            });
        }
        else if (req.user.role === config.get('role.host')) {
            let host_details = await HostDetail.find({
                user_id: req.user._id,
            });

            let car_type_id = [];
            let province_id = [];
            host_details.forEach(host_detail => {
                car_type_id.push(host_detail.car_type_id.toString());
                province_id.push(host_detail.province_id.toString());
            });
            if (host_details && car_type_id.includes(request[0].car_type_id.toString()) 
                && province_id.includes(request[0].province_id.toString())) {
                    return res.status(200).json({
                        request: request[0],
                    });
            }

            return res.status(401).json({
                message: i18n.__mf('unauthorize_user'),
            });
        } 
        else {
            return res.status(401).json({
                message: i18n.__mf('unauthorize_user'),
                request: request,
            });
        }

    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.deleteRequest = async (req, res) => {
    try {
        let check_request = await Request.findById({ _id:  mongoose.Types.ObjectId(req.params.id) });
        if (check_request.user_id.toString() === req.user._id.toString() 
            && check_request.status === config.get('request_status.new')) {
            check_request.status = config.get('request_status.cancel');
            check_request.updated_at = Date.now();
            check_request.save();

            if (check_request.payment_type === config.get('payment_type.transfer_money')) {
                let check_cash_flow = await CashFlow.findOne({
                    request_id: mongoose.Types.ObjectId(req.params.id),
                    type: config.get('cash_flow_type.transfer_to_system')
                });
                if (check_request.payment_status === config.get('payment_status.new')) {
                    // Cancel Transaction
                    await axios.delete(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows/${check_cash_flow._id}`, {
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
                } else if (check_request.payment_status === config.get('payment_status.done')) {
                    let cash_flow
                    // Create Transaction
                    await axios.post(`${process.env.API_URL}:${process.env.PORT}/api/cash-flows`, {
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
            }
            

            return res.status(200).json({
                message: i18n.__mf('cancel_success', i18n.__('request')),
                request: check_request
            })
        }

        return res.status(200).json({
            message: i18n.__mf('cancel_fail', i18n.__('request')),
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getListRequestsByCode = async (req, res) => {
    try {
        const code = req.query.code;
        var contract = [];

        let request = await Request.aggregate([
            { $match: { code: code } },
            { 
                $lookup: 
                    {
                        from: "requestdestinations",
                        localField: "_id",
                        foreignField: "request_id",
                        as: "request_destinations"
                    }
            },
            { 
                $lookup: 
                    {
                        from: "requestcustomers",
                        localField: "_id",
                        foreignField: "request_id",
                        as: "request_customers"
                    }
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
            { $unwind: "$request_customers" },
            { $unwind: "$car_type" },
            { $unwind: "$province" },
        ]);

        if (request.length === 0) {
            return res.status(500).json({
                message: i18n.__('unknown_error'),
            });
        }

        if (request[0].status === config.get('request_status.to_contract')) {
            contract = await Contract.aggregate([
                {
                    $match: { request_id:  request[0]._id }
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
            ])
        }

        return res.status(200).json({
            request: request[0],
            contract: contract[0]
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}
