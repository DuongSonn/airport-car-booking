var BonusType = require('../models/BonusType');

exports.BonusTypeSeeder = async function() {
    BonusType.deleteMany().then(function(){ 
        console.log("BonusType is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var data = [
        {
            description: 'Bonus thêm điểm đón',
        },
        {
            description: 'Bonus thêm khung giờ đón',
        },
    ];
    
    for (var i = 0; i < data.length; i++) {
        await BonusType.create({ description: data[i].description }); 
    }
    
    console.log("BonusType is Seeded");
}