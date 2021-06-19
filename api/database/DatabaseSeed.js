require('dotenv').config();
var mongoose = require('mongoose');
var CarTypeSeeder = require('./CarTypeSeeder');
var RoleSeeder = require('./RoleSeeder');
var BonusTypeSeeder = require('./BonusTypeSeeder');
var ConfigDistanceSeeder = require('./ConfigDistanceSeeder');
var ProvinceSeeder = require('./ProvinceSeeder');
var ConfigComboSeeder = require('./ConfigComboSeeder');
var ConfigBonusSeeder = require('./ConfigBonusSeeder');
var ConfigBasicSeeder = require('./ConfigBasicSeeder');
var UserSeeder = require('./UserSeeder');

exports.DBSeed = async () => {
    try {
        // mongoose.connect(process.env.DATABASE);
        const uri = 'mongodb+srv://123abnkakashi:123abnkakashi@cluster0.1wfl8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
        mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        await CarTypeSeeder.CarTypeSeeder();
        await RoleSeeder.RoleSeeder();
        await BonusTypeSeeder.BonusTypeSeeder();
        await ConfigDistanceSeeder.ConfigDistanceSeeder();
        await ProvinceSeeder.ProvinceSeeder();
        await ConfigComboSeeder.ConfigComboSeeder();
        await ConfigBonusSeeder.ConfigBonusSeeder();
        await ConfigBasicSeeder.ConfigBasicSeeder();
        await UserSeeder.UserSeeder();
    
        mongoose.connection.close();   
    } catch (error) {
        console.log(error);
    }
}


