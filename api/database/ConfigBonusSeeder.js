var ConfigBonus = require('../models/ConfigBonus');
var CarType = require('../models/CarType');
var BonusType = require('../models/BonusType');

exports.ConfigBonusSeeder = async function() {
    ConfigBonus.deleteMany().then(function(){ 
        console.log("ConfigBonus is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var car_type_id = await CarType.findOne({ type: 5});
    var type_add_pickup_location = await BonusType.findOne({ description: 'Bonus thêm điểm đón'});
    var type_pickup_time = await BonusType.findOne({ description: 'Bonus thêm khung giờ đón'});

    var data = [
        {
            airport: 'Sân bay Nội Bài',
            car_type_id: car_type_id._id,
            type: type_add_pickup_location._id,
            cost: 10000,
        },
        {
            airport: 'Sân bay Nội Bài',
            car_type_id: car_type_id._id,
            type: type_pickup_time._id,
            cost: 20000,
        }
    ];
    
    for (var i = 0; i < data.length; i++) {
        await ConfigBonus.create({ 
            airport: data[i].airport,
            type: data[i].type,
            car_type_id: data[i].car_type_id,
            cost: data[i].cost,
        }); 
    }
    
    console.log("ConfigBonus is Seeded");
}