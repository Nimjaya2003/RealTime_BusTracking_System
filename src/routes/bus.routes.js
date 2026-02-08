const express = require('express');
const router = express.Router();

const busController = require('../controllers/bus.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Admin: create bus
router.post('/', authenticate, authorizeRoles('ADMIN'), busController.createBus);

// Anyone authenticated: list / get
router.get('/', authenticate, busController.listBuses);
router.get('/nearby', authenticate, busController.findNearby);
router.get('/:id', authenticate, busController.getBus);

// Admin: update / delete
router.put('/:id', authenticate, authorizeRoles('ADMIN'), busController.updateBus);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), busController.deleteBus);

// Driver: update live location
router.patch('/:id/location', authenticate, authorizeRoles('DRIVER'), busController.updateLocation);

module.exports = router;
