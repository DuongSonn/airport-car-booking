var express = require('express');
var router = express.Router();
var authenticate = require('../utils/authenticate');
var HostDetailController = require('../controllers/HostDetailController');
var UserController = require('../controllers/UserController');

router.post('/register', UserController.validate('register'), UserController.register);
router.post('/login', UserController.validate('login'), UserController.login);
router.post('/token', UserController.generateToken);
router.post('/promo_code', authenticate.authenticateToken, UserController.generatePromoCode);
router.post('/logout', [
    authenticate.authenticateToken
], UserController.logout);

router.get('/cars', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
], UserController.getListHostCars);
router.post('/cars', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    UserController.validate('car')
], UserController.createHostCar);
router.delete('/cars/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
], UserController.deleteHostCar);
router.put('/cars/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    UserController.validate('car')
], UserController.updateHostCar);

router.post('/drivers', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    UserController.validate('driver')
], UserController.createHostDriver);
router.get('/drivers', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
], UserController.getListHostDrivers);
router.put('/drivers/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    UserController.validate('driver')
], UserController.updateHostDriver);
router.delete('/drivers/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
], UserController.deleteHostDriver);

router.get('/host-details', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
], HostDetailController.getListDetails)
router.post('/host-details', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    HostDetailController.validate('create')
], HostDetailController.createHostDetail);
router.put('/host-details/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
    HostDetailController.validate('update')
], HostDetailController.updateHostDetail)
router.delete('/host-details/:id', [
    authenticate.authenticateToken,
    authenticate.authenticateRole(['host']),
], HostDetailController.deleteHostDetail)

router.get('/:id', [
    authenticate.authenticateToken,
], UserController.getUserDetail);


module.exports = router;
