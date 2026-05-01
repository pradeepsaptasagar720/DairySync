/**
 * Send standardized success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Response data
 * @param {string} message - Success message
 */
export const sendSuccess = (res, statusCode = 200, data = null, message = 'Success') => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send standardized error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {any} details - Additional error details
 */
export const sendError = (res, statusCode = 500, code = 'SERVER_ERROR', message = 'Internal Server Error', details = null) => {
  const response = {
    success: false,
    error: {
      code,
      message
    },
    timestamp: new Date().toISOString()
  };

  if (details !== null) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
export const sendValidationError = (res, errors) => {
  return sendError(
    res,
    400,
    'VALIDATION_ERROR',
    'Invalid input data',
    errors
  );
};

/**
 * Send not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(
    res,
    404,
    'NOT_FOUND',
    `${resource} not found`
  );
};

/**
 * Send unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
export const sendUnauthorized = (res, message = 'Unauthorized access') => {
  return sendError(
    res,
    401,
    'UNAUTHORIZED',
    message
  );
};

/**
 * Send forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
export const sendForbidden = (res, message = 'Access forbidden') => {
  return sendError(
    res,
    403,
    'FORBIDDEN',
    message
  );
};