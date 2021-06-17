var express = require('express');
var router = express.Router();
var CashFlowController = require('../controllers/CashFlowController');
var authenticate = require('../utils/authenticate');

router.post('/', [
    authenticate.authenticateToken
], CashFlowController.createCashFlow);
router.get('/requests', [
    authenticate.authenticateToken,
], CashFlowController.getRequestCashFlow);
router.get('/drivers', [
    authenticate.authenticateToken,
], CashFlowController.getDriverCashFlow);
router.put('/:id', [
    authenticate.authenticateToken,
], CashFlowController.updateCashFlow);
router.delete('/:id', [
    authenticate.authenticateToken,
], CashFlowController.deleteCashFlow);

module.exports = router;
