/**
 * Standardized API response utility
 * Provides consistent response structure across the API
 */

/**
 * Success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object|Array} data - Response data
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} error - Error details
 */
const errorResponse = (res, statusCode = 500, message = 'Server Error', error = null) => {
  const response = {
    success: false,
    message
  };

  if (error !== null && process.env.NODE_ENV !== 'production') {
    response.error = error.toString();
    if (error.stack) {
      response.stack = error.stack;
    }
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
}; 