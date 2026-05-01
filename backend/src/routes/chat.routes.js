import express from "express";
import {
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUnreadCounts
} from "../controllers/chat.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Send a message
router.post("/messages", authMiddleware, sendMessage);

// Get messages for an order
router.get("/messages/:orderId", authMiddleware, getMessages);

// Mark messages as read
router.put("/messages/:orderId/read", authMiddleware, markMessagesAsRead);

// Get unread counts for user's orders
router.get("/unread-counts", authMiddleware, getUnreadCounts);

export default router;
