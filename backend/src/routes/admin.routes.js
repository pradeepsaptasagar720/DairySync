import express from "express";
import {
  dashboard,
  getFarmers,
  getPendingUsers,
  getUsersByRole,
  approveUser,
  rejectUser,
  updateMilkRate,
  createRateChart,
  getRateCharts,
  getRateChartById,
  deleteRateChart,
  getDairyInfo,
  updateDairyInfo,
  getTodayReports,
  getYesterdayReports,
  getCurrentMonthReports,
  getPreviousMonthReports,
  getCustomDateReports,
  getLandingStats,
  getAllUsers,
  assignUniqueIds,
  getComprehensiveUserData,
  getUserProfile,
  getUserActivities,
  advancedUserSearch,
  getSearchSuggestions,
  getSearchAnalytics,
  resetSearchFilters,
  getSellingRates,
  updateSellingRates,
  getSellingRatesHistory,
  getComprehensiveAnalytics,
  getAdminFarmerPayments,
  getAdminBuyerPayments,
} from "../controllers/admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/dashboard", dashboard);
router.get("/comprehensive-analytics", getComprehensiveAnalytics); // New: Comprehensive analytics dashboard
router.get("/today-reports", getTodayReports);
router.get("/yesterday-reports", getYesterdayReports);
router.get("/current-month-reports", getCurrentMonthReports);
router.get("/previous-month-reports", getPreviousMonthReports);
router.get("/custom-date-reports", getCustomDateReports);
router.get("/landing-stats", getLandingStats);
router.get("/farmers", getFarmers);
router.get("/pending-users", getPendingUsers);
router.get("/users/:role", getUsersByRole);
router.get("/all-users", getAllUsers); // Legacy: Get all users with filtering
router.get("/comprehensive-users", getComprehensiveUserData); // New: Get comprehensive user data with role-specific info
router.get("/advanced-search", advancedUserSearch); // New: Advanced search with comprehensive filtering
router.get("/search-suggestions", getSearchSuggestions); // New: Get search suggestions for autocomplete
router.get("/search-analytics", getSearchAnalytics); // New: Get search analytics and statistics
router.post("/reset-search-filters", resetSearchFilters); // New: Reset search filters
router.get("/user-profile/:userId", getUserProfile); // New: Get detailed user profile
router.get("/user-activities/:userId", getUserActivities); // New: Get user activities timeline
router.post("/assign-unique-ids", assignUniqueIds); // New: Assign IDs to existing users
router.post("/approve/:id", approveUser);
router.delete("/reject/:id", rejectUser);

// Legacy milk rate endpoint
router.post("/milk-rate", updateMilkRate);

// Enhanced rate chart endpoints
router.post("/rate-chart", createRateChart);
router.get("/rate-charts", getRateCharts);
router.get("/rate-chart/:id", getRateChartById);
router.delete("/rate-chart/:id", deleteRateChart);

router.get("/dairy-info", getDairyInfo);
router.post("/dairy-info", updateDairyInfo);

// Selling rates for online buyers
router.get("/selling-rates", getSellingRates);
router.post("/selling-rates", updateSellingRates);
router.get("/selling-rates-history", getSellingRatesHistory);

// Farmer payments for admin view
router.get("/farmer-payments", getAdminFarmerPayments);

// Buyer payments for admin view
router.get("/buyer-payments", getAdminBuyerPayments);

export default router;
