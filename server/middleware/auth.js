const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const getUserFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const [rows] = await pool.query(
    'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
    [decoded.id]
  );

  if (rows.length === 0) {
    const error = new Error('User not found.');
    error.status = 401;
    throw error;
  }

  if (!rows[0].is_active) {
    const error = new Error('Your account has been deactivated.');
    error.status = 403;
    throw error;
  }

  return rows[0];
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    req.user = await getUserFromToken(token);
    next();
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    req.user = await getUserFromToken(token);
    return next();
  } catch {
    return next();
  }
};

module.exports = { authenticate, optionalAuthenticate, authorize };
