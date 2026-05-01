import express from "express";
import { 
  placeOrder,
  getOrders,
  getOrderHistory,
  getPurchaseHistory,
  getDashboard,
  getMilkAvailability,
  getDairyTime,
  cancelOrder
} from "../controllers/buyer.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Apply authentication and buyer authorization to all routes
router.use(authMiddleware);
router.use(roleMiddleware("buyer"));

// Buyer dashboard
router.get("/dashboard", getDashboard);

// Dairy time for buyers
router.get("/dairy-time", getDairyTime);

// Milk availability for buyers
router.get("/milk-availability", getMilkAvailability);

// Order management
router.post("/place-order", placeOrder);
router.get("/orders", getOrders);
router.delete("/orders/:orderId", cancelOrder);

// Purchase history
router.get("/order-history", getOrderHistory);
router.get("/purchase-history", getPurchaseHistory);

export default router;