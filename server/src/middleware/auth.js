const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies?.token;
  
  // DEBUG: Check for token presence
  console.log(`[AUTH] Request: ${req.method} ${req.path} | Token present: ${!!token}`);
  
  if (!token) return res.status(401).json({
    error: 'Authentication required. Please log in.'
  });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (e) {
    res.cookie('token', '', { maxAge: 0, httpOnly: true });
    return res.status(401).json({
      error: 'Session expired. Please log in again.'
    });
  }
};
