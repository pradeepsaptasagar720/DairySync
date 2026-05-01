import express from "express";
import {
  createEmployee,
  getEmployees,
  updateEmployee,
  resetEmployeePassword,
  toggleEmployeeStatus,
  getEmployeeById,
  deleteEmployee,
  reactivateEmployee
} from "../controllers/employee.admin.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateAdminAccess } from "../middlewares/roleBasedRouting.middleware.js";

const router = express.Router();

// All employee admin routes require authentication and admin access
router.use(authMiddleware);
router.use(validateAdminAccess);

// Employee management routes
router.post("/", createEmployee);
router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);
router.post("/:id/reset-password", resetEmployeePassword);
router.patch("/:id/toggle-status", toggleEmployeeStatus);
router.patch("/:id/reactivate", reactivateEmployee);

export default router;