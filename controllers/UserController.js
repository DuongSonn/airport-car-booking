const { body, validationResult } = require('express-validator/check');
const config = require('config');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const i18n = require("i18n");
const mongoose = require("mongoose");

var User = require('../models/User');
var Role = require('../models/Role');
var HostCar = require('../models/HostCar');
var HostDriver = require('../models/HostDriver');
var CarType = require('../models/CarType');
var Contract = require('../models/Contract');

require('dotenv').config();

exports.validate = (method) => {
    switch (method) {
        case 'register':
            return [
                body('username')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('name'));
                    }),
                body('email')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('email'));
                    })
                    .isEmail().withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('email'));
                    }),
                body('phone')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('phone'));
                    })
                    .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('phone'));
                    }),
                body('password')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('password'));
                    }),
                body('confirm_password')
                    .exists().withMessage(() => {
                        return i18n.__mf('password_confirm_required');
                    })
                    .custom((value, {req}) => {
                        if (value !== req.body.password) {
                            throw new Error(i18n.__mf('password_confirm_error'));
                        }

                        return true;
                    }),
                body('language')
                    .exists()
                    .isIn(['vi', 'en']),
                body('role')
                    .exists()
                    .custom(async (value) => {
                    let check_role = await Role.findOne({ name: value });
                    if (!check_role) {
                        throw new Error(i18n.__mf('invalid', i18n.__('role')));
                    }

                    return true;
                }),
                body('promo_code').custom(async (value) => {
                    if (value) {
                        let check_user = await User.findOne({promo_code: value});
                        if (!check_user) {
                            throw new Error(i18n.__mf('invalid', i18n.__('code')));
                        }
                    }

                    return true;
                })
            ]
        case 'login':
            return [
                body('phone')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('phone'));
                    })
                    .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('phone'));
                    }),
                body('password')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('password'));
                    }),
            ]
        case 'car':
            return [
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
                body('brand').exists().withMessage(() => {
                    return i18n.__mf('required', i18n.__('brand'));
                }),
                body('car_name').exists().withMessage(() => {
                    return i18n.__mf('required', i18n.__('car_name'));
                }),
                body('car_plate').exists().withMessage(() => {
                    return i18n.__mf('required', i18n.__('car_plate'));
                })
            ]
        case 'driver': 
            return [
                body('license').exists().withMessage(() => {
                    return i18n.__mf('required', i18n.__('license'));
                }),
                body('username')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('name'));
                    }),
                body('email')
                    .optional().isEmail().withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('email'));
                    }),
                body('phone')
                    .exists().withMessage(() => {
                        return i18n.__mf('required', i18n.__('phone'));
                    })
                    .matches(new RegExp(config.get('regex_phone'))).withMessage(() => {
                        return i18n.__mf('invalid', i18n.__('phone'));
                    }),
                body('language')
                    .optional()
                    .isIn(['vi', 'en']),
                body('role')
                    .optional()
                    .custom(async (value) => {
                    let check_role = await Role.findOne({ name: value });
                    if (!check_role) {
                        throw new Error(i18n.__mf('invalid', i18n.__('role')));
                    }

                    return true;
                }),
            ]
        default:
            break;
    }
}

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });

            return;
        }
        const { phone, role, password, username, email, language, promo_code } = req.body;

        let check_user = await User.findOne({
            phone: phone, 
            role: role
        });
        if (check_user) {
            res.status(409).json({
                message: i18n.__('existed_account'),
            });

            return;
        }
        
        var user;
        if (promo_code) {
            let check_code = await User.findOne({
                promo_code: promo_code
            });

            const salt = await bcrypt.genSalt();
            const hash_password = await bcrypt.hash(password, salt);

            user = await User.create({
                username: username,
                phone: phone,
                email: email,
                password: hash_password,
                role: role,
                language: language,
                status: config.get('account_status.active'),
                refer_id: check_code._id
            });
        } else {
            if (role === config.get('role.agency')) {
                let defaultAgency = await User.findOne({
                    phone: "0987378533",
                    role: config.get('role.agency')
                });

                const salt = await bcrypt.genSalt();
                const hash_password = await bcrypt.hash(password, salt);

                user = await User.create({
                    username: username,
                    phone: phone,
                    email: email,
                    password: hash_password,
                    role: role,
                    language: language,
                    status: config.get('account_status.active'),
                    refer_id: defaultAgency._id
                });
            } else if (role === config.get('role.host')) {
                let defaultHost = await User.findOne({
                    phone: "0969559556",
                    role: config.get('role.host')
                });

                const salt = await bcrypt.genSalt();
                const hash_password = await bcrypt.hash(password, salt);

                user = await User.create({
                    username: username,
                    phone: phone,
                    email: email,
                    password: hash_password,
                    role: role,
                    language: language,
                    status: config.get('account_status.active'),
                    refer_id: defaultHost._id
                });
            }
        }

        if (user) {
            res.status(201).json({
                message: i18n.__mf('create_success', i18n.__('account')),
                user: user,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.login = async (req, res) => {
    try {
        const { phone, password, role } = req.body;

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });

            return;
        }

        var check_user = null;
        if (role) {
            check_user = await User.findOne({
                phone: phone,
                role: role,
            });
        } else {
            check_user = await User.findOne({
                phone: phone,
            });
        }
        
        if (check_user) {
            if (await bcrypt.compare(password, check_user.password)) {
                let user = { _id: check_user._id };
                const access_token = jwt.sign(user, 
                    process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 15 });
                const refresh_token = jwt.sign(user, 
                    process.env.REFRESH_TOKEN_SECRET);

                check_user.refresh_token = refresh_token;
                await check_user.save();
                
                i18n.setLocale(check_user.language);

                res.status(200).json({
                    user: check_user,
                    access_token: access_token,
                    refresh_token: refresh_token,
                });

                return;
            }

            return res.status(400).json({
                message: i18n.__('login_fail'),
            });
        } else {
            res.status(400).json({
                message: i18n.__('login_fail'),
            });
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.generateToken = async (req, res) => {
    try {
        const  { refresh_token } = req.body

        if (!refresh_token) {
            return res.status(401).json({
                message: i18n.__mf('invalid', i18n.__('token'))
            });
        }

        let check_user = await User.findOne({
            refresh_token: refresh_token,
        });
        if (!check_user) {
            return  res.status(401).json({
                message: i18n.__mf('invalid', i18n.__('token'))
            });
        }

        jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, (err, check_user) => {
            if (err) {
                return res.status(403).json({
                    message: i18n.__mf('invalid', i18n.__('token'))
                });
            }

            let user = { _id: check_user._id };

            const access_token = jwt.sign(user, 
                process.env.ACCESS_TOKEN_SECRET, { expiresIn: 60 * 15 });
            
            return res.status(200).json({
                access_token: access_token,
            });
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.generatePromoCode = async (req, res) => {
    try {
        let promo_code = crypto.randomBytes(3).toString('hex');
        await User.updateOne(
            { _id: req.user._id },
            { promo_code: promo_code}
        );

        res.status(201).json({
            message: i18n.__mf('create_success', i18n.__('code')),
            promo_code: promo_code,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.createHostCar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });

            return;
        }

        const { car_type_id, brand, car_plate, car_name } = req.body;

        let host_car = await HostCar.create({
            host_id: req.user._id,
            car_type_id: car_type_id,
            brand: brand,
            car_plate: car_plate,
            car_name: car_name,
        });

        host_car = await HostCar.aggregate([
            { 
                $match: { _id: mongoose.Types.ObjectId(host_car._id) }
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
            { $unwind: "$car_type" },
        ])

        return res.status(201).json({
            host_car: host_car[0],
            message: i18n.__mf('create_success', i18n.__('host_car')),
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.createHostDriver = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });

            return;
        }

        const { host_car_id, license, username, phone, language, email, role } = req.body;

        let check_user = await User.findOne({
            phone: phone,
            role: role
        });
        if (check_user) {
            return res.status(400).json({ 
                message: i18n.__mf('create_fail', i18n.__('host_driver')),
            });
        }

        let user = await User.create({
            username: username,
            phone: phone,
            language: language,
            email: email,
            role: role,
            password: await bcrypt.hash(config.get('default_password'), await bcrypt.genSalt()),
            status: config.get('account_status.active'),
        });

        if (user) {
            let host_driver = await HostDriver.create({
                user_id: user._id,
                host_car_id: host_car_id,
                host_id: req.user._id,
                license: license,
                status: config.get('driver_status.pending'),
            });

            return res.status(201).json({
                message: i18n.__mf('create_success', i18n.__('host_driver')),
                host_driver: host_driver,
            });
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getListHostCars = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        if (page && page !== 'undefined' && page !== 'null'
            && limit && limit !== 'undefined' && limit !== 'null') {
            let options = {
                $and: [
                    { host_id : req.user._id },
                ]
            }
            let host_cars = await HostCar.aggregate([
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
                { $unwind: "$car_type" },
            ]).skip((page -1) * limit).limit(limit);
    
            let totalCars = await HostCar.find({
                $and: [
                    { host_id : req.user._id },
                ]
            });
    
            total = totalCars.length;
    
            return res.status(200).json({
                host_cars: host_cars,
                total: total,
            });   
        } else {
            let host_cars = await HostCar.find({
                host_id : req.user._id
            });

            return res.status(200).json({
                host_cars: host_cars,
            });   
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.deleteHostCar = async (req, res) => {
    try {
        let check_car = await HostDriver.findOne({
            host_car_id: mongoose.Types.ObjectId(req.params.id)
        });
        if (check_car) {
            return res.status(400).json({
                message: i18n.__mf('delete_fail', i18n.__('host_car')),
            })
        }

        let host_car = await HostCar.deleteOne({
            _id: mongoose.Types.ObjectId(req.params.id),
        });

        return res.status(200).json({
            message: i18n.__mf('delete_success', i18n.__('host_car')),
            host_car: host_car,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateHostCar = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });

            return;
        }

        const { car_type_id, brand, car_plate, car_name } = req.body;

        let host_car = await HostCar.updateOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
            {
                car_type_id: car_type_id,
                brand: brand,
                car_plate: car_plate,
                car_name: car_name,
            }
        );

        return res.status(200).json({
            host_car: host_car,
            message: i18n.__mf('update_success', i18n.__('host_car')),
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getListHostDrivers = async (req, res) => {
    try {
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);

        var host_drivers;
        var total;
        if (page && page !== 'undefined' && page !== 'null'
            && limit && limit !== 'undefined' && limit !== 'null') {
                let options = {
                    $and: [
                        { host_id : req.user._id },
                    ]
                }
                

                host_drivers = await HostDriver.aggregate([
                    { 
                        $match: options
                    },
                    { 
                        $lookup: 
                            {
                                from: "hostcars",
                                localField: "host_car_id",
                                foreignField: "_id",
                                as: "host_car"
                            }
                    },
                    {
                        $lookup: 
                            {
                                from: "users",
                                localField: "user_id",
                                foreignField: "_id",
                                as: "user"
                            }
                    },
                    {
                        $lookup: 
                            {
                                from: "cartypes",
                                localField: "host_car.car_type_id",
                                foreignField: "_id",
                                as: "car_type"
                            }
                    },
                    { $unwind: "$host_car" },
                    { $unwind: "$user" },
                    { $unwind: "$car_type" },
                ]).skip((page -1) * limit).limit(limit);
        
                let totalDrivers = await HostDriver.find({
                    $and: [
                        { host_id : req.user._id },
                    ]
                });
        
                total = totalDrivers.length;
        } else {
            host_drivers = await HostDriver.aggregate([
                { 
                    $match: {
                        $and: [
                            { host_id : req.user._id },
                            { status: { $not: { $eq: config.get('driver_status.deactive') } } }
                        ]
                    }
                },
                {
                    $lookup: 
                        {
                            from: "users",
                            localField: "user_id",
                            foreignField: "_id",
                            as: "user"
                        }
                },
                { 
                    $lookup: 
                        {
                            from: "hostcars",
                            localField: "host_car_id",
                            foreignField: "_id",
                            as: "host_car"
                        }
                },
                {
                    $lookup: 
                        {
                            from: "cartypes",
                            localField: "host_car.car_type_id",
                            foreignField: "_id",
                            as: "car_type"
                        }
                },
                { $unwind: "$host_car" },
                { $unwind: "$user" },
                { $unwind: "$car_type" },
            ]);

            total = host_drivers.length;
        }

        return res.status(200).json({
            host_drivers: host_drivers,
            total: total,
        });
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.deleteHostDriver = async (req, res) => {
    try {
        let host_driver = await HostDriver.findOne({
            _id: mongoose.Types.ObjectId(req.params.id),
        });

        let contract = await Contract.findOne({
            driver_id: host_driver.user_id,
            status: { $lt: config.get('contract_status.done') }, 
        });

        if (contract) {
            return res.status(200).json({
                message: i18n.__mf('delete_fail', i18n.__('host_driver')),
            });
        } else {
            let host_driver = await HostDriver.updateOne({
                _id: mongoose.Types.ObjectId(req.params.id),
            }, {
                status: config.get('driver_status.deactive')
            });

            await User.updateOne({
                _id: host_driver.user_id
            }, {
                status: config.get('account_status.deactive')
            });
    
            return res.status(200).json({
                message: i18n.__mf('delete_success', i18n.__('host_driver')),
                host_driver: host_driver,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.updateHostDriver = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });

            return;
        }

        const { host_car_id, license, username, phone } = req.body;

        let host_driver = await HostDriver.findOne(
            { _id: mongoose.Types.ObjectId(req.params.id) },
        );

        host_driver.host_car_id = host_car_id;
        host_driver.license = license;
        host_driver.updated_at = Date.now();
        host_driver.save();
        
        await User.updateOne(
            { _id: host_driver.user_id },
            {
                username: username,
                phone: phone
            }
        )

        return res.status(200).json({
            host_driver: host_driver,
            message: i18n.__mf('update_success', i18n.__('host_car')),
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.getUserDetail = async(req, res) => {
    try {
        let user = await User.findOne({
            _id: mongoose.Types.ObjectId(req.params.id)
        });

        if (user) {
            return res.status(200).json({
                user: user
            })
        } else {
            res.status(500).json({
                message: i18n.__('unknown_error'),
            });
        }
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}

exports.logout = async(req, res) => {
    try {
        let user = await User.updateOne(
            { _id: req.user._id },
            { refresh_token: null }
        );

        res.status(200).json({
            user: user
        })
    } catch (error) {
        res.status(500).json({
            message: i18n.__('unknown_error'),
        });
    }
}