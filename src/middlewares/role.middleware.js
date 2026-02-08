// Role-based access control (case-insensitive)
const authorizeRoles = (...allowedRoles) => {
    const normalized = allowedRoles.map((role) => role.toUpperCase());

    return (req, res, next) => {
        const userRole = (req.user?.role || '').toUpperCase();
        if (!userRole || !normalized.includes(userRole)) {
            return res.status(403).json({ message: 'Forbidden: Access denied' });
        }
        next();
    };
};

module.exports = authorizeRoles;
