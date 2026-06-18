const jwt = require('jsonwebtoken');
const { getUserByUsername } = require('../services/databaseService');

const auth = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Attach fresh user record including must_change_password and role from DB
    try {
      const userRecord = await getUserByUsername(req.user.username);
      if (userRecord) {
        req.user.must_change_password = !!userRecord.must_change_password;
        req.user.role = userRecord.role || req.user.role;
      }
    } catch (e) {
      // If DB lookup fails, treat as unauthorized
      res.clearCookie('token');
      return res.status(401).json({ message: 'Authentication failed.' });
    }

    // Enforce password change before allowing access to protected routes
    const allowedPaths = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/me'];
    if (req.user.must_change_password && !allowedPaths.includes(req.originalUrl)) {
      return res.status(403).json({ message: 'Password change required. Please change your password before continuing.' });
    }
    next();
  } catch (error) {
    res.clearCookie('token');
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
};

module.exports = {
  auth,
  adminOnly
};
