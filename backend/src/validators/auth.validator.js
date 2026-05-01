import { body } from "express-validator";

/**
 * Mobile: exactly 10 digits (India-safe)
 */
const mobileValidator = body("mobile")
  .isNumeric()
  .isLength({ min: 10, max: 10 })
  .withMessage("Mobile number must be 10 digits");

/**
 * Password rules:
 * - Min 8 chars
 * - 1 letter
 * - 1 number
 * - 1 special character
 */
const passwordValidator = body("password")
  .isLength({ min: 8 })
  .matches(/[A-Za-z]/)
  .matches(/[0-9]/)
  .matches(/[@$!%*#?&]/)
  .withMessage(
    "Password must contain letters, numbers and special characters"
  );

export const registerValidator = [
  body("username").notEmpty().withMessage("Username is required"),
  mobileValidator,
  passwordValidator,
  body("role")
    .isIn(["admin", "farmer", "buyer", "employee"])
    .withMessage("Invalid role"),
];

export const loginValidator = [
  mobileValidator,
  body("password").notEmpty().withMessage("Password is required"),
];

export const otpValidator = [
  mobileValidator,
  body("otp")
    .isNumeric()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
];

export const resetPasswordValidator = [
  mobileValidator,
  body("otp")
    .isNumeric()
    .isLength({ min: 6, max: 6 }),
  passwordValidator,
];
