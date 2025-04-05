const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database
            const [user] = await sequelize.query(
                'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = true',
                {
                    replacements: [decoded.id],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!user) {
                throw new Error();
            }

            // Attach user to request object
            req.user = user;
            req.token = token;

            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid authentication token'
            });
        }
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during authentication'
        });
    }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role(s)
 * @param {string|string[]} roles - Required role(s)
 */
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

/**
 * Activity logging middleware
 * Logs user actions to database
 */
const logActivity = async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
        res.send = originalSend;

        // Only log successful operations
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
            const activity = {
                user_id: req.user.id,
                action: req.method,
                resource: req.originalUrl,
                details: JSON.stringify({
                    method: req.method,
                    path: req.path,
                    query: req.query,
                    body: req.body
                }),
                ip_address: req.ip
            };

            // Log to database asynchronously
            sequelize.query(
                `INSERT INTO activity_logs 
                (user_id, action, resource, details, ip_address) 
                VALUES (?, ?, ?, ?, ?)`,
                {
                    replacements: [
                        activity.user_id,
                        activity.action,
                        activity.resource,
                        activity.details,
                        activity.ip_address
                    ]
                }
            ).catch(error => {
                console.error('Error logging activity:', error);
            });
        }

        return res.send(data);
    };

    next();
};

/**
 * Rate limiting middleware
 * Limits number of requests per IP
 */
const rateLimit = {
    windows: {},
    
    check: (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) * 1000 || 15000; // Default 15 seconds
        const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100; // Default 100 requests

        // Initialize or clean up window for IP
        if (!rateLimit.windows[ip] || now - rateLimit.windows[ip].start > windowMs) {
            rateLimit.windows[ip] = {
                start: now,
                count: 0
            };
        }

        // Increment request count
        rateLimit.windows[ip].count++;

        // Check if limit exceeded
        if (rateLimit.windows[ip].count > max) {
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.'
            });
        }

        next();
    },

    // Clean up old entries periodically
    cleanup: () => {
        const now = Date.now();
        const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW) * 1000 || 15000;

        Object.keys(rateLimit.windows).forEach(ip => {
            if (now - rateLimit.windows[ip].start > windowMs) {
                delete rateLimit.windows[ip];
            }
        });
    }
};

// Run cleanup every minute
setInterval(rateLimit.cleanup, 60000);

module.exports = {
    auth,
    authorize,
    logActivity,
    rateLimit: rateLimit.check
};