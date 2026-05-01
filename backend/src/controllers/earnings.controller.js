import Earnings from "../models/Earnings.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import {
  aggregateEarnings,
  getEarningsBreakdown,
  getPaymentHistory,
  getUnpaidEarnings
} from "../services/earningsCalculator.service.js";

/**
 * Get earnings summary for a delivery person
 * GET /api/delivery-persons/:id/earnings
 */
export const getEarningsSummary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period = "monthly" } = req.query;

  // Verify user is requesting their own earnings or is admin
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You can only view your own earnings"
      }
    });
  }

  // Get earnings for different periods
  const daily = await aggregateEarnings(id, "daily");
  const weekly = await aggregateEarnings(id, "weekly");
  const monthly = await aggregateEarnings(id, "monthly");
  const unpaid = await getUnpaidEarnings(id);

  // Get breakdown for selected period
  const now = new Date();
  let startDate, endDate = now;

  switch (period) {
    case "daily":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const breakdown = await getEarningsBreakdown(id, startDate, endDate);

  res.json({
    success: true,
    data: {
      summary: {
        daily: Math.round(daily * 100) / 100,
        weekly: Math.round(weekly * 100) / 100,
        monthly: Math.round(monthly * 100) / 100,
        unpaid: Math.round(unpaid * 100) / 100
      },
      breakdown,
      period
    },
    message: "Earnings summary retrieved successfully"
  });
});

/**
 * Get performance metrics for a delivery person
 * GET /api/delivery-persons/:id/performance
 */
export const getPerformanceMetrics = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify user is requesting their own metrics or is admin
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You can only view your own performance"
      }
    });
  }

  // Get user's delivery stats
  const User = (await import("../models/User.model.js")).default;
  const user = await User.findById(id).select("deliveryStats");

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "Delivery person not found"
      }
    });
  }

  const stats = user.deliveryStats || {
    totalDeliveries: 0,
    totalAccepted: 0,
    totalOffered: 0,
    averageRating: 0,
    totalRatings: 0
  };

  // Calculate rates
  const acceptanceRate = stats.totalOffered > 0 
    ? Math.round((stats.totalAccepted / stats.totalOffered) * 100) 
    : 0;
  
  const completionRate = stats.totalAccepted > 0 
    ? Math.round((stats.totalDeliveries / stats.totalAccepted) * 100) 
    : 0;

  res.json({
    success: true,
    data: {
      totalDeliveries: stats.totalDeliveries,
      acceptanceRate,
      completionRate,
      averageRating: stats.averageRating,
      totalRatings: stats.totalRatings
    },
    message: "Performance metrics retrieved successfully"
  });
});

/**
 * Get payment history for a delivery person
 * GET /api/delivery-persons/:id/payment-history
 */
export const getDeliveryPersonPaymentHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Verify user is requesting their own history or is admin
  if (req.user.id !== id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You can only view your own payment history"
      }
    });
  }

  const payments = await getPaymentHistory(id);
  
  // Paginate
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedPayments = payments.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: {
      payments: paginatedPayments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length,
        pages: Math.ceil(payments.length / parseInt(limit))
      }
    },
    message: "Payment history retrieved successfully"
  });
});
