import { sendNotification, getNotificationHistory } from "../services/notification.service.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

// Send notification to admin about transport data edit
export const sendAdminNotification = asyncHandler(async (req, res) => {
  const { type, message, data } = req.body;

  try {
    // Send notification to admin users
    const notification = await sendNotification({
      type: type || "transport_edit",
      title: "Transport Data Modified",
      message: message || "An employee has modified transport data",
      recipients: ["admin"],
      createdBy: req.user.id,
      data
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: "Admin notification sent successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "NOTIFICATION_FAILED",
        message: error.message
      }
    });
  }
});

// Get notification history
export const getNotifications = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, limit } = req.query;

  try {
    const notifications = await getNotificationHistory({
      type,
      startDate,
      endDate,
      limit: parseInt(limit) || 50
    });

    res.json({
      success: true,
      data: notifications,
      message: "Notifications retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});


// ============================================================================
// Role-Based Notification System - New Controller Methods
// ============================================================================

import {
  createNotificationForRoles,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from "../services/notification.service.js";

/**
 * Send notification to target roles
 * POST /api/notifications/send
 * Only milk_collector can send notifications
 */
export const sendRoleBasedNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients } = req.body;
  
  // Validate input
  if (!title || !message || !recipients || recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Title, message, and recipients are required"
      }
    });
  }
  
  // Validate recipients
  const validRecipients = ["farmers", "buyers", "employees", "all"];
  const invalidRecipients = recipients.filter(r => !validRecipients.includes(r));
  
  if (invalidRecipients.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_RECIPIENTS",
        message: `Invalid recipients: ${invalidRecipients.join(", ")}`
      }
    });
  }
  
  try {
    const result = await createNotificationForRoles(
      title,
      message,
      recipients,
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: `Notification sent to ${result.sentToCount} users successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "NOTIFICATION_SEND_FAILED",
        message: error.message
      }
    });
  }
});

/**
 * Get notifications for current user
 * GET /api/notifications
 */
export const getCurrentUserNotifications = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.query;
  
  try {
    const result = await getUserNotifications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true'
    });
    
    res.json({
      success: true,
      data: result,
      message: "Notifications retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});

/**
 * Get unread notification count for current user
 * GET /api/notifications/unread-count
 */
export const getCurrentUserUnreadCount = asyncHandler(async (req, res) => {
  try {
    const count = await getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { count },
      message: "Unread count retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await markAsRead(req.user.id, id);
    
    res.json({
      success: true,
      data: {
        notificationId: result._id,
        isRead: result.isRead,
        readAt: result.readAt
      },
      message: "Notification marked as read"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: error.message
      }
    });
  }
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  try {
    const markedCount = await markAllAsRead(req.user.id);
    
    res.json({
      success: true,
      data: { markedCount },
      message: `${markedCount} notifications marked as read`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: error.message
      }
    });
  }
});
