var express = require('express');
var router = express.Router();
var authenticate = require('../utils/authenticate');
var ContractController = require('../controllers/ContractController');
var ContractDriverController = require('../controllers/ContractDriverController');

router.get('/', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host', 'agency']),
], ContractController.getListContracts);
router.post('/', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    ContractController.validate('create'),
], ContractController.createContract);
router.post('/contract-driver', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    ContractDriverController.validate('create')
], ContractDriverController.createContractDriver);

router.get('/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host', 'agency']),
], ContractController.getContractDetail);
router.put('/:id', [
    authenticate.authenticateToken, 
    authenticate.authenticateRole(['host', 'agency', 'driver']),
], ContractController.updateContract);
router.delete('/:id', [
    authenticate.authenticateToken, 
    authenticate.authenticateRole(['host']),
], ContractController.deleteContract);
router.put('/contract-driver/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    ContractDriverController.validate('update')
], ContractDriverController.updateContractDriver);



module.exports = router;
