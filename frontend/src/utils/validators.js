/**
 * Validate Indian mobile number (10 digits)
 */
export function validateMobile(mobile) {
  const regex = /^[6-9]\d{9}$/;
  return regex.test(mobile);
}

/**
 * Password rules:
 * - Min 8 chars
 * - At least 1 letter
 * - At least 1 number
 * - At least 1 special char
 */
export function validatePassword(password) {
  const regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return regex.test(password);
}

/**
 * Simple required field validation
 */
export function isRequired(value) {
  return value !== undefined && value !== null && value.toString().trim() !== "";
}

/**
 * Validate delivery request form
 */
export function validateDeliveryForm(data) {
  const errors = {};

  if (!isRequired(data.quantity) || data.quantity <= 0) {
    errors.quantity = "Quantity must be greater than 0";
  }

  if (!isRequired(data.address)) {
    errors.address = "Address is required";
  }

  if (!isRequired(data.date)) {
    errors.date = "Delivery date is required";
  }

  return errors;
}

/**
 * Generic helper
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
