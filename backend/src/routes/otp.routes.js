import express from "express";
import {
  generateOTP,
  verifyOTP,
  resendOTP,
  getOTPStatus
} from "../controllers/otp.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { employeeRoleMiddleware } from "../middlewares/employeeRole.middleware.js";

const router = express.Router();

// Apply authentication and role middleware - only delivery_boy can access
router.use(authMiddleware, roleMiddleware("employee"), employeeRoleMiddleware("delivery_boy"));

// OTP operations
router.post("/generate", generateOTP);
router.post("/verify", verifyOTP);
router.post("/resend", resendOTP);
router.get("/status/:orderId", getOTPStatus);

export default router;
