var ConfigCombo = require('../models/ConfigCombo');
var CarType = require('../models/CarType');

exports.ConfigComboSeeder = async function() {
    ConfigCombo.deleteMany().then(function(){ 
        console.log("ConfigCombo is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var data = [];
    var car_type_ids = await CarType.find({
        $or: [
            {type: 5},
            {type: 7},
            {type: 16}
        ]
    })
    var price_to_airport = [160000, 180000, 360000] ;
    var price_from_airport = [200000, 240000, 410000];
    car_type_ids.forEach((car_type_id, index) => {
        let object_to_airport = {
            airport: 'Sân bay Nội Bài',
            type: 0,
            car_type_id: car_type_id._id,
            distance: 30,
            cost: price_to_airport[index],
        }

        let object_from_airport = {
            airport: 'Sân bay Nội Bài',
            type: 1,
            car_type_id: car_type_id._id,
            distance: 30,
            cost: price_from_airport[index],
        }
        data.push(object_to_airport);
        data.push(object_from_airport);
    });
    
    for (var i = 0; i < data.length; i++) {
        await ConfigCombo.create({ 
            airport: data[i].airport,
            type: data[i].type,
            car_type_id: data[i].car_type_id,
            distance: data[i].distance,
            cost: data[i].cost,
        }); 
    }
    
    console.log("ConfigCombo is Seeded");
}