var express = require('express');
var router = express.Router();
var authenticate = require('../utils/authenticate');
var RequestController = require('../controllers/RequestController');

router.post('/calculate-price', RequestController.calculatePrice);
router.get('/check', RequestController.getListRequestsByCode);

router.get('/', [
    authenticate.authenticateToken, 
    authenticate.authenticateRole(['agency', 'host']),
], RequestController.getListRequests);
router.post('/', RequestController.validate('create'), RequestController.createRequest);

router.get('/:id', [
    authenticate.authenticateToken, 
    authenticate.authenticateRole(['agency', 'host']),
], RequestController.getRequestDetail);
router.put('/:id', [
    authenticate.authenticateToken, 
    authenticate.authenticateRole(['agency', 'host']),
    RequestController.validate('update'),
], RequestController.updateRequest);
router.delete('/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['agency'])
], RequestController.deleteRequest);

module.exports = router;
