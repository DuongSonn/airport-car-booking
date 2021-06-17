var CarType = require('../models/CarType');

exports.CarTypeSeeder = async function() {
    CarType.deleteMany().then(function(){ 
        console.log("CarType is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var data = [
        {
            type: 5,
        },
        {
            type: 7,
        },
        {
            type: 9,
        },
        {
            type: 16,
        },
        {
            type: 29,
        },
        {
            type: 35,
        },
        {
            type: 45,
        },
    ];
    
    for (var i = 0; i < data.length; i++) {
        await CarType.create({ type: data[i].type }); 
    }
    
    console.log("CarType is Seeded");
}