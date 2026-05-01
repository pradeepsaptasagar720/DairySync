import express from "express";
import {
  recordMilkEntry,
  getMilkEntries,
  getSessionSummary,
  getFarmerById,
  getFarmerByMobile,
  getRate,
  updateMilkEntry,
  deleteMilkEntry,
  confirmCOD,
  getAnimalsInfo,
  getFarmers,
  getBuyers,
  getAllUsersData,
  generateReports,
  getFarmerPayments,
  getBuyerPayments,
  getEmployeeDashboard,
  sendManualNotification,
  updateDairyTime,
  getNotifications,
  getDairyTime,
  checkDuplicateEntry,
  generateFarmerBill,
  processPayment,
  getPaymentHistory,
  updatePendingPayment,
  completePendingPayment,
  getPendingPayments,
  cleanupDuplicatePayments,
  checkBillingPeriodProtection,
  getFarmerProtectedPeriods,
  batchCheckBillingProtection,
  getTodaysDeliveries,
} from "../controllers/employee.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { employeeRoleMiddleware } from "../middlewares/employeeRole.middleware.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("employee"));

// Dashboard (accessible to all employee roles)
router.get("/dashboard", getEmployeeDashboard);

// Dairy time management (accessible to all employee roles)
router.get("/dairy-time", getDairyTime);
router.put("/dairy-time", updateDairyTime);

// Notifications (accessible to all employee roles)
router.post("/notifications/send", sendManualNotification);
router.get("/notifications", getNotifications);

// Today's deliveries analytics (only for milk_collector role)
router.get("/todays-deliveries", employeeRoleMiddleware("milk_collector"), getTodaysDeliveries);

// Milk collection (only for milk_collector role)
router.use("/milk-*", employeeRoleMiddleware("milk_collector"));
router.get("/milk-entry/check-duplicate", checkDuplicateEntry);
router.post("/milk-entry", recordMilkEntry);
router.get("/milk-entries", getMilkEntries);
router.get("/milk-entries/summary", getSessionSummary);
router.put("/milk-entry/:id", updateMilkEntry);
router.delete("/milk-entry/:id", deleteMilkEntry);

// Farmer lookup (only for milk_collector role)
router.get("/farmer/id/:farmerId", employeeRoleMiddleware("milk_collector"), getFarmerById);
router.get("/farmer/mobile/:mobile", employeeRoleMiddleware("milk_collector"), getFarmerByMobile);

// Rate chart (only for milk_collector role)
router.get("/rate-chart", employeeRoleMiddleware("milk_collector"), getRate);

// Animal information (only for milk_collector role)
router.get("/animals", employeeRoleMiddleware("milk_collector"), getAnimalsInfo);

// Farmer and buyer management (only for milk_collector role)
router.get("/farmers", employeeRoleMiddleware("milk_collector"), getFarmers);
router.get("/buyers", employeeRoleMiddleware("milk_collector"), getBuyers);
router.get("/all-users", employeeRoleMiddleware("milk_collector"), getAllUsersData);

// Reports (only for milk_collector role)
router.get("/reports", employeeRoleMiddleware("milk_collector"), generateReports);
router.get("/farmer-bill", employeeRoleMiddleware("milk_collector"), generateFarmerBill);

// Payment processing (only for milk_collector role)
router.post("/process-payment", employeeRoleMiddleware("milk_collector"), processPayment);
router.get("/payment-history", employeeRoleMiddleware("milk_collector"), getPaymentHistory);
router.post("/cleanup-duplicate-payments", employeeRoleMiddleware("milk_collector"), cleanupDuplicatePayments);

// Billing period protection (only for milk_collector role)
router.get("/check-billing-protection", employeeRoleMiddleware("milk_collector"), checkBillingPeriodProtection);
router.get("/farmer-protected-periods/:farmerId", employeeRoleMiddleware("milk_collector"), getFarmerProtectedPeriods);
router.post("/batch-check-billing-protection", employeeRoleMiddleware("milk_collector"), batchCheckBillingProtection);

// Pending payment management (only for milk_collector role)
router.put("/pending-payment/:paymentId", employeeRoleMiddleware("milk_collector"), updatePendingPayment);
router.post("/complete-pending-payment/:paymentId", employeeRoleMiddleware("milk_collector"), completePendingPayment);
router.get("/pending-payments", employeeRoleMiddleware("milk_collector"), getPendingPayments);

// Payment status (only for milk_collector role)
router.get("/payments/farmers", employeeRoleMiddleware("milk_collector"), getFarmerPayments);
router.get("/payments/buyers", employeeRoleMiddleware("milk_collector"), getBuyerPayments);

// Legacy routes (only for milk_collector role)
router.post("/confirm-cod/:id", employeeRoleMiddleware("milk_collector"), confirmCOD);

export default router;
