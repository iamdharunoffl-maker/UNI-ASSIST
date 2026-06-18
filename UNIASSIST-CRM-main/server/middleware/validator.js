// Simple recursive HTML stripping function for strings
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  // Strip HTML tags using regex
  return str.replace(/<\/?[^>]+(>|$)/g, '').trim();
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeString(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};

// Middleware to sanitize incoming request payload
const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

// Validate body has required fields
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field] && req.body[field] !== 0 && req.body[field] !== false);
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missing.join(', ')}`
      });
    }
    next();
  };
};

module.exports = {
  sanitizeRequest,
  validateRequired
};
