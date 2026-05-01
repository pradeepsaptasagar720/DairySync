import express from "express";
import {
  getLoanFeedDashboard,
  getLoanManagement,
  approveLoan,
  addLoanPayment,
  clearLoan,
  getLoanHistory,
  getFeedManagement,
  createFeedEntry,
  updateFeedEntry,
  deleteFeedEntry,
  getFeedStockManagement,
  updateFeedStock,
  getLoanFeedStats,
  getLoanFeedHistory,
  getStockAlerts
} from "../controllers/loanfeed.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { employeeRoleMiddleware } from "../middlewares/employeeRole.middleware.js";

const router = express.Router();

// Apply authentication and role middleware
router.use(authMiddleware, roleMiddleware("employee"), employeeRoleMiddleware("loan_feed_manager"));

// Dashboard
router.get("/dashboard", getLoanFeedDashboard);

// Loan management
router.get("/loans", getLoanManagement);
router.post("/loans/:id/approve", approveLoan);
router.post("/loans/:id/payment", addLoanPayment);
router.post("/loans/:id/clear", clearLoan);
router.get("/loans/history/:farmerId", getLoanHistory);

// Feed management
router.get("/feeds", getFeedManagement);
router.post("/feeds", createFeedEntry);
router.put("/feeds/:id", updateFeedEntry);
router.delete("/feeds/:id", deleteFeedEntry);

// Feed stock management
router.get("/feed-stock", getFeedStockManagement);
router.put("/feed-stock/:id", updateFeedStock);

// Statistics and history
router.get("/stats", getLoanFeedStats);
router.get("/history", getLoanFeedHistory);

// Stock alerts
router.post("/stock-alerts", getStockAlerts);

export default router;