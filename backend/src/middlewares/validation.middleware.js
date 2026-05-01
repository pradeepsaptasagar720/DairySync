import { body, validationResult } from 'express-validator';

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      },
      timestamp: new Date().toISOString()
    });
  }
  next();
};

/**
 * Validation rules for milk entry
 */
export const validateMilkEntry = [
  body('liters')
    .isFloat({ min: 0.1 })
    .withMessage('Liters must be a positive number greater than 0'),
  body('rate')
    .isFloat({ min: 0 })
    .withMessage('Rate must be a non-negative number'),
  handleValidationErrors
];

/**
 * Validation rules for user registration
 */
export const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be exactly 10 digits'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('role')
    .isIn(['farmer', 'buyer', 'employee'])
    .withMessage('Role must be one of: farmer, buyer, employee'),
  handleValidationErrors
];

/**
 * Validation rules for login
 */
export const validateLogin = [
  body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be exactly 10 digits'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('role')
    .isIn(['admin', 'farmer', 'buyer', 'employee'])
    .withMessage('Role must be one of: admin, farmer, buyer, employee'),
  handleValidationErrors
];

/**
 * Validation rules for OTP verification
 */
export const validateOtpVerification = [
  body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be exactly 10 digits'),
  body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be exactly 6 digits'),
  handleValidationErrors
];

/**
 * Validation rules for password reset
 */
export const validatePasswordReset = [
  body('mobile')
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be exactly 10 digits'),
  body('otp')
    .matches(/^\d{6}$/)
    .withMessage('OTP must be exactly 6 digits'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

/**
 * Validation rules for milk rate update
 */
export const validateMilkRateUpdate = [
  body('rate')
    .isFloat({ min: 0.01 })
    .withMessage('Rate must be a positive number greater than 0'),
  handleValidationErrors
];