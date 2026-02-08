const express = require('express');
const router = express.Router();

const routeController = require('../controllers/route.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Admin: create route
router.post('/', authenticate, authorizeRoles('ADMIN'), routeController.createRoute);

// Authenticated: list and detail
router.get('/', authenticate, routeController.listRoutes);
router.get('/:id', authenticate, routeController.getRoute);

// Admin: update / delete
router.put('/:id', authenticate, authorizeRoles('ADMIN'), routeController.updateRoute);
router.delete('/:id', authenticate, authorizeRoles('ADMIN'), routeController.deleteRoute);

module.exports = router;
