var ConfigDistance = require('../models/ConfigDistance');

exports.ConfigDistanceSeeder = async function() {
    ConfigDistance.deleteMany().then(function(){ 
        console.log("ConfigDistance is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var data = [
        {
            min: 0,
            max: 10,
        },
        {
            min: 10,
            max: 20,
        },
        {
            min: 20,
            max: 5000,
        },
    ];
    
    for (var i = 0; i < data.length; i++) {
        await ConfigDistance.create({ 
            min: data[i].min,
            max: data[i].max,
        }); 
    }
    
    console.log("ConfigDistance is Seeded");
}