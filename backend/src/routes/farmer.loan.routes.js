import express from "express";
import {
  getFarmerLoanSummary,
  createLoanRequest,
  getFarmerLoanHistory,
  getFarmerActiveLoans
} from "../controllers/farmer.loan.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Apply authentication and role middleware for farmers
router.use(authMiddleware, roleMiddleware("farmer"));

// Farmer loan endpoints
router.get("/summary/:farmerId", getFarmerLoanSummary);
router.post("/request", createLoanRequest);
router.get("/history/:farmerId", getFarmerLoanHistory);
router.get("/active/:farmerId", getFarmerActiveLoans);

export default router;