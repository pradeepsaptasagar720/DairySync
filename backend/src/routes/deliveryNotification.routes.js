import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  getUnreadNotificationCount
} from "../controllers/deliveryNotification.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get notifications for logged-in user
router.get("/", authMiddleware, getNotifications);

// Get unread notification count
router.get("/unread-count", authMiddleware, getUnreadNotificationCount);

// Mark notification as read
router.put("/:id/read", authMiddleware, markNotificationAsRead);

export default router;
