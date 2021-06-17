var express = require('express');
var router = express.Router();
var CarTypeController = require('../controllers/CarTypesController');

router.get('/', CarTypeController.getListCarTypes);

module.exports = router;
