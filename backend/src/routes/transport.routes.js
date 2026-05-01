import express from "express";
import {
  calculateTransportMilk,
  getTransportRecords,
  createTransportRecord,
  updateTransportStatus,
  getTodayTransportSummary,
  editTransportRecord,
  getTransportHistory,
} from "../controllers/transport.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Public routes (all authenticated users can view)
router.get("/calculate", calculateTransportMilk);
router.get("/today-summary", getTodayTransportSummary);
router.get("/records", getTransportRecords);
router.get("/history", getTransportHistory);

// Admin and employee routes
router.post("/create", roleMiddleware("admin", "employee"), createTransportRecord);
router.put("/status/:id", roleMiddleware("admin", "employee"), updateTransportStatus);
router.put("/edit/:id", roleMiddleware("admin", "employee"), editTransportRecord);

export default router;