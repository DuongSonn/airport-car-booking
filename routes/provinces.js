var express = require('express');
var router = express.Router();
var ProvinceController = require('../controllers/ProvinceController');

router.get('/', ProvinceController.getListProvinces);

module.exports = router;
