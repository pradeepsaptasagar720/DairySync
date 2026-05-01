import express from "express";
import {
  submitRating,
  getMyRatings,
  getRatings,
  getRatingStats,
  getRatingTrends,
  exportRatings
} from "../controllers/milkQualityRating.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = express.Router();

// Submit milk quality rating (buyer only)
router.post("/ratings", authMiddleware, submitRating);

// Get current buyer's own ratings
router.get("/ratings/my-ratings", authMiddleware, getMyRatings);

// Admin routes
router.get("/admin/ratings", authMiddleware, adminMiddleware, getRatings);
router.get("/admin/ratings/stats", authMiddleware, adminMiddleware, getRatingStats);
router.get("/admin/ratings/trends", authMiddleware, adminMiddleware, getRatingTrends);
router.get("/admin/ratings/export", authMiddleware, adminMiddleware, exportRatings);

export default router;
