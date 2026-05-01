import rateLimit from "express-rate-limit";

/**
 * Basic rate limiter
 * Prevents OTP & login abuse
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later",
  },
});
