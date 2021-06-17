var express = require('express');
var router = express.Router();
var LanguageController = require('../controllers/LanguageController');

router.get('/', LanguageController.changeLanguage);

module.exports = router;
