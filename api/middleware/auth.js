const admin = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token
 */
async function verifyToken(req, res, next) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided'
            });
        }

        const token = authHeader.split('Bearer ')[1];

        // Verify the ID token
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified,
            role: decodedToken.role || null // Custom claim
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        });
    }
}

/**
 * Middleware to require specific role
 */
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (req.user.role !== role) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires ${role} role`
            });
        }

        next();
    };
}

/**
 * Middleware to require any of the specified roles
 */
function requireAnyRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This action requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
}

module.exports = {
    verifyToken,
    requireRole,
    requireAnyRole
};
