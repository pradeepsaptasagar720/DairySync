import express from "express";
import {
  getDeliveryDashboard,
  getDeliveryRequests,
  updateDeliveryStatus,
  getDeliveryStats,
  getDeliveryHistory
} from "../controllers/delivery.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { employeeRoleMiddleware } from "../middlewares/employeeRole.middleware.js";

const router = express.Router();

// Apply authentication and role middleware - only delivery_boy can access
router.use(authMiddleware, roleMiddleware("employee"), employeeRoleMiddleware("delivery_boy"));

// Dashboard
router.get("/dashboard", getDeliveryDashboard);

// Delivery requests management
router.get("/requests", getDeliveryRequests);
router.put("/requests/:id", updateDeliveryStatus);

// Statistics and history
router.get("/stats", getDeliveryStats);
router.get("/history", getDeliveryHistory);

export default router;