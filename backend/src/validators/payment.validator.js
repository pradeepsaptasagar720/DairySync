import { body } from "express-validator";

export const createPaymentValidator = [
  body("amount")
    .isNumeric()
    .custom((v) => v > 0)
    .withMessage("Amount must be greater than zero"),

  body("mode")
    .isIn(["ONLINE", "COD"])
    .withMessage("Payment mode must be ONLINE or COD"),
];
