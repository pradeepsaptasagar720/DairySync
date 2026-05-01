import { asyncHandler } from "../middlewares/error.middleware.js";
import {
  getUserNotifications,
  markAsRead,
  getUnreadCount
} from "../services/deliveryNotification.service.js";

/**
 * Get notifications for the logged-in user
 * GET /api/delivery-notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;

  const notifications = await getUserNotifications(
    userId,
    parseInt(limit),
    parseInt(offset)
  );

  const total = await getUnreadCount(userId);

  res.json({
    success: true,
    data: {
      notifications,
      unreadCount: total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.length
      }
    },
    message: "Notifications retrieved successfully"
  });
});

/**
 * Mark a notification as read
 * PUT /api/delivery-notifications/:id/read
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify notification belongs to user
  const DeliveryNotification = (await import("../models/DeliveryNotification.model.js")).default;
  const notification = await DeliveryNotification.findById(id);

  if (!notification) {
    return res.status(404).json({
      success: false,
      error: {
        code: "NOTIFICATION_NOT_FOUND",
        message: "Notification not found"
      }
    });
  }

  if (notification.userId.toString() !== userId) {
    return res.status(403).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You can only mark your own notifications as read"
      }
    });
  }

  const updatedNotification = await markAsRead(id);

  res.json({
    success: true,
    data: updatedNotification,
    message: "Notification marked as read"
  });
});

/**
 * Get unread notification count
 * GET /api/delivery-notifications/unread-count
 */
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = await getUnreadCount(userId);

  res.json({
    success: true,
    data: { count },
    message: "Unread count retrieved successfully"
  });
});
