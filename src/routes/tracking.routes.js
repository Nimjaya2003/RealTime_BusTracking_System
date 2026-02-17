const express = require('express');
const router = express.Router();

const trackingController = require('../controllers/tracking.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

router.post('/start', authenticate, authorizeRoles('DRIVER'), trackingController.start);
router.post('/stop', authenticate, authorizeRoles('DRIVER'), trackingController.stop);
router.post('/ping', authenticate, authorizeRoles('DRIVER'), trackingController.ping);
router.get('/status', authenticate, authorizeRoles('DRIVER'), trackingController.status);

module.exports = router;
