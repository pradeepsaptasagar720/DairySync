import express from "express";
import { submitRating, getDeliveryPersonRatings } from "../controllers/rating.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Submit rating for an order (buyer only)
router.post("/orders/:orderId/rating", authMiddleware, submitRating);

// Get ratings for a delivery person
router.get("/delivery-persons/:id/ratings", authMiddleware, getDeliveryPersonRatings);

export default router;
