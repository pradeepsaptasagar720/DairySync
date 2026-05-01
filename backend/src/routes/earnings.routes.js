import express from "express";
import {
  getEarningsSummary,
  getPerformanceMetrics,
  getDeliveryPersonPaymentHistory
} from "../controllers/earnings.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get earnings summary for a delivery person
router.get("/delivery-persons/:id/earnings", authMiddleware, getEarningsSummary);

// Get performance metrics for a delivery person
router.get("/delivery-persons/:id/performance", authMiddleware, getPerformanceMetrics);

// Get payment history for a delivery person
router.get("/delivery-persons/:id/payment-history", authMiddleware, getDeliveryPersonPaymentHistory);

export default router;
