var Province = require('../models/Province');

exports.ProvinceSeeder = async function() {
    Province.deleteMany().then(function(){ 
        console.log("Province is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var data = [
        {
            name: 'Hà Nội',
            airports: ['Sân bay Nội Bài'],
        },
    ];
    
    for (var i = 0; i < data.length; i++) {
        await Province.create({ 
            name: data[i].name,
            airports: data[i].airports,
        }); 
    }
    
    console.log("Province is Seeded");
}