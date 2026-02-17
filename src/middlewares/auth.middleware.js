const admin = require('../config/firebase');

// Verify Firebase ID token
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = await admin.auth().verifyIdToken(token, true);
        // Attach basic user info and role (from custom claims) to request
        req.user = {
            uid: decoded.uid,
            email: decoded.email,
            role: decoded.role || decoded.customClaims?.role || decoded['https://hasura.io/jwt/claims']?.['x-hasura-role'] // keep flexible
        };
        return next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

module.exports = authenticate;
