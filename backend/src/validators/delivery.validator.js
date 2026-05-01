import { body } from "express-validator";

export const deliveryRequestValidator = [
  body("quantity")
    .isNumeric()
    .custom((v) => v > 0)
    .withMessage("Quantity must be greater than zero"),

  body("address")
    .notEmpty()
    .withMessage("Delivery address is required"),

  body("deliveryDate")
    .isISO8601()
    .withMessage("Valid delivery date is required"),

  body("frequency")
    .isIn(["one-time", "daily", "weekly", "custom"])
    .withMessage("Invalid delivery frequency"),
];
