var ConfigBasic = require('../models/ConfigBasic');
var CarType = require('../models/CarType');
var ConfigDistance = require('../models/ConfigDistance');

exports.ConfigBasicSeeder = async function() {
    ConfigBasic.deleteMany().then(function(){ 
        console.log("ConfigBasic is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var car_type_5_id = await CarType.findOne({ type: 5});
    var car_type_7_id = await CarType.findOne({ type: 7});
    var car_type_16_id = await CarType.findOne({ type: 16});
    var config_distance_tier_1 = await ConfigDistance.findOne({
        min: 0,
        max: 10,
    });
    var config_distance_tier_2 = await ConfigDistance.findOne({
        min: 10,
        max: 20,
    });
    var config_distance_tier_3 = await ConfigDistance.findOne({
        min: 20,
        max: 5000,
    });

    var data = [
        {
            distance_id: config_distance_tier_1._id,
            car_type_id: car_type_5_id._id,
            cost: 13000,
        },
        {
            distance_id: config_distance_tier_2._id,
            car_type_id: car_type_5_id._id,
            cost: 11000,
        },
        {
            distance_id: config_distance_tier_3._id,
            car_type_id: car_type_5_id._id,
            cost: 9000,
        },
        {
            distance_id: config_distance_tier_1._id,
            car_type_id: car_type_7_id._id,
            cost: 15000,
        },
        {
            distance_id: config_distance_tier_2._id,
            car_type_id: car_type_7_id._id,
            cost: 13000,
        },
        {
            distance_id: config_distance_tier_3._id,
            car_type_id: car_type_7_id._id,
            cost: 11000,
        },
        {
            distance_id: config_distance_tier_1._id,
            car_type_id: car_type_16_id._id,
            cost: 17000,
        },
        {
            distance_id: config_distance_tier_2._id,
            car_type_id: car_type_16_id._id,
            cost: 15000,
        },
        {
            distance_id: config_distance_tier_3._id,
            car_type_id: car_type_16_id._id,
            cost: 13000,
        },
    ];
    
    for (var i = 0; i < data.length; i++) {
        await ConfigBasic.create({ 
            distance_id: data[i].distance_id,
            car_type_id: data[i].car_type_id,
            cost: data[i].cost, 
        }); 
    }
    
    console.log("ConfigBasic is Seeded");
}