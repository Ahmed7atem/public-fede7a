/**
 * Request logging middleware
 * Logs all incoming requests with timestamp, method, and URL
 */
const requestLogger = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

module.exports = requestLogger; 