var Role = require('../models/Role');

exports.RoleSeeder = async function() {
    Role.deleteMany().then(function(){ 
        console.log("Role is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 
    
    var data = [
        {
            name: 'admin',
        },
        {
            name: 'agency',
        },
        {
            name: 'host',
        },
        {
            name: 'driver',
        },
        
    ];
    
    for (var i = 0; i < data.length; i++) {
        await Role.create({ name: data[i].name }); 
    }
    
    console.log("Role is Seeded");
}