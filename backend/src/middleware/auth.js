const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect()
 * Middleware that verifies JWT and attaches the user to req.user
 * Add to any route that requires login
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check cookies first (HttpOnly)
    if (req.cookies && req.cookies.kg_token) {
      token = req.cookies.kg_token;
    } 
    // Fallback to Authorization header (Bearer token) for compatibility
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired. Please log in again.',
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Contact your administrator.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Authentication error' });
  }
};

/**
 * requireRole(...roles)
 * Must be used AFTER protect()
 * Example: router.get('/admin-only', protect, requireRole('admin'), handler)
 * Example: router.get('/managers', protect, requireRole('admin', 'manager'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * optionalAuth()
 * Attaches user to req if token exists, but does NOT block unauthenticated requests
 * Used for routes that behave differently for logged-in vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.cookies && req.cookies.kg_token) {
      token = req.cookies.kg_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    next();
  } catch {
    next(); // Continue even if token verification fails
  }
};

module.exports = { protect, requireRole, optionalAuth };
