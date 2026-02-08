const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Passenger, Driver, Admin
router.get(
    '/profile',
    authenticate,
    (req, res) => {
        res.json({
            message: 'Access granted',
            user: req.user
        });
    }
);

// Driver only
router.post(
    '/driver-only',
    authenticate,
    authorizeRoles('driver'),
    (req, res) => {
        res.json({ message: 'Driver access granted' });
    }
);

// Admin only
router.post(
    '/admin-only',
    authenticate,
    authorizeRoles('admin'),
    (req, res) => {
        res.json({ message: 'Admin access granted' });
    }
);

module.exports = router;
