import express from "express";
import { 
  sendAdminNotification, 
  getNotifications,
  sendRoleBasedNotification,
  getCurrentUserNotifications,
  getCurrentUserUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../controllers/notification.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";
import { employeeRoleMiddleware } from "../middlewares/employeeRole.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Send notification to admin (employees can send)
router.post("/admin", roleMiddleware("admin", "employee"), sendAdminNotification);

// Get notifications (admin only)
router.get("/history", roleMiddleware("admin"), getNotifications);

// ============================================================================
// Role-Based Notification System Routes
// ============================================================================

// Send notification to target roles (only milk_collector can send)
router.post("/send", 
  roleMiddleware("employee"),
  employeeRoleMiddleware("milk_collector"),
  sendRoleBasedNotification
);

// Get current user's notifications
router.get("/", getCurrentUserNotifications);

// Get unread notification count
router.get("/unread-count", getCurrentUserUnreadCount);

// Mark notification as read
router.patch("/:id/read", markNotificationAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", markAllNotificationsAsRead);

export default router;