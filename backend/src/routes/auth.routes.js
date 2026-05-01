import express from "express";
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  employeeChangePassword,
  getEmployeeDashboardRoute
} from "../controllers/auth.controller.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { 
  redirectToDashboard, 
  checkPasswordResetRequired,
  validateEmployeeAccess 
} from "../middlewares/roleBasedRouting.middleware.js";

const router = express.Router();

router.post("/register", rateLimiter, register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", rateLimiter, login, redirectToDashboard);
router.post("/forgot-password", rateLimiter, forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

// Protected profile routes
router.get("/profile", authMiddleware, checkPasswordResetRequired, getProfile);
router.put("/profile", authMiddleware, checkPasswordResetRequired, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);

// Employee-specific routes
router.put("/employee/change-password", authMiddleware, validateEmployeeAccess(), employeeChangePassword);
router.get("/employee/dashboard-route", authMiddleware, validateEmployeeAccess(), getEmployeeDashboardRoute);

export default router;
