const config = require('config');
const bcrypt = require('bcrypt');

var User = require('../models/User');

exports.UserSeeder = async function() {
    User.deleteMany().then(function(){ 
        console.log("User is Cleared"); 
    }).catch(function(error){ 
        console.log(error);
    }); 

    var data = [
        {
            username: "Admin",
            phone: "0904051269",
            email: "admin@gmail.com",
            password: await bcrypt.hash("123456789", await bcrypt.genSalt()),
            language: "vi",
            role: "admin",
            promo_code: "994b48",
            status: config.get('account_status.active'),
        },
        {
            username: "1st Driver",
            phone: "0965670347",
            email: "driver@gmail.com",
            password: await bcrypt.hash("123456789", await bcrypt.genSalt()),
            language: "vi",
            role: "driver",
            status: config.get('account_status.active'),
        },
        {
            username: "1st Agency",
            phone: "0987378533",
            email: "agency@gmail.com",
            password: await bcrypt.hash("123456789", await bcrypt.genSalt()),
            language: "vi",
            role: "agency",
            promo_code: "f758c5",
            status: config.get('account_status.active'),
        },
        {
            username: "1st Host",
            phone: "0969559556",
            email: "host@gmail.com",
            password: await bcrypt.hash("123456789", await bcrypt.genSalt()),
            language: "vi",
            role: "host",
            status: config.get('account_status.active'),
        },       
    ];
    
    var admin_id;
    for (var i = 0; i < data.length; i++) {
        let user = await User.create({ 
            username: data[i].username,
            phone: data[i].phone,
            email: data[i].email,
            password: data[i].password,
            language: data[i].language,
            role: data[i].role,
            promo_code: data[i].promo_code,
            status: data[i].status,
        });
        
        if (i > 0) {
            await User.updateOne(
                { _id: user._id },
                { refer_id: admin_id }
            )
        } else {
            admin_id = user._id
        }
    }

    console.log("User is Seeded");
}