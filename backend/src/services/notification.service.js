import Notification from "../models/Notification.model.js";
import User from "../models/User.model.js";
import DairyInfo from "../models/DairyInfo.model.js";
// SMS functionality can be added later if needed
// import { sendOTP } from "./sms.service.js";

// Send notification to users
export const sendNotification = async (notificationData) => {
  try {
    const { type, title, message, recipients, createdBy, scheduledFor } = notificationData;

    // Get dairy info for context
    const dairyInfo = await DairyInfo.findOne({});
    
    // Normalize recipients (handle both singular and plural forms)
    const normalizedRecipients = recipients.map(recipient => {
      switch (recipient) {
        case 'farmers': return 'farmer';
        case 'buyers': return 'buyer';
        case 'employees': return 'employee';
        default: return recipient;
      }
    });
    
    // Get users based on recipients
    let users = [];
    if (recipients.includes("all")) {
      users = await User.find({ 
        role: { $in: ["farmer", "buyer", "employee"] },
        approved: true,
        isVerified: true 
      }).select("_id mobile role");
    } else {
      users = await User.find({ 
        role: { $in: normalizedRecipients },
        approved: true,
        isVerified: true 
      }).select("_id mobile role");
    }

    if (users.length === 0) {
      throw new Error("No users found for the specified recipients");
    }

    // Create notification record
    const notification = new Notification({
      type,
      title,
      message,
      recipients,
      createdBy,
      scheduledFor,
      isScheduled: !!scheduledFor,
      dairyInfo: dairyInfo ? {
        dairyName: dairyInfo.dairyName,
        openingTime: dairyInfo.openingTime,
        closingTime: dairyInfo.closingTime
      } : null,
      sentTo: users.map(user => ({
        user: user._id,
        mobile: user.mobile,
        status: "pending"
      }))
    });

    await notification.save();

    // If not scheduled, send immediately
    if (!scheduledFor) {
      await processNotification(notification._id);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Process and send notification
export const processNotification = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification || notification.isProcessed) {
      return;
    }

    const results = [];
    
    for (const recipient of notification.sentTo) {
      try {
        // SMS sending can be added later if needed
        // For now, just mark as sent
        // await sendSMS(recipient.mobile, notification.message);
        
        // Update status
        recipient.status = "sent";
        recipient.sentAt = new Date();
        results.push({ mobile: recipient.mobile, status: "sent" });
      } catch (error) {
        recipient.status = "failed";
        recipient.error = error.message;
        results.push({ mobile: recipient.mobile, status: "failed", error: error.message });
      }
    }

    notification.isProcessed = true;
    await notification.save();

    return results;
  } catch (error) {
    console.error("Error processing notification:", error);
    throw error;
  }
};

// Schedule automatic dairy notifications
export const scheduleDairyNotifications = async (dairyInfo, createdBy) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Parse opening and closing times
    const [openHour, openMin] = dairyInfo.openingTime.split(':').map(Number);
    const [closeHour, closeMin] = dairyInfo.closingTime.split(':').map(Number);
    
    // Create opening time for today
    const openingTime = new Date(today);
    openingTime.setHours(openHour, openMin, 0, 0);
    
    // Create closing time for today
    const closingTime = new Date(today);
    closingTime.setHours(closeHour, closeMin, 0, 0);
    
    // Create closing warning time (15 minutes before closing)
    const closingWarningTime = new Date(closingTime);
    closingWarningTime.setMinutes(closingWarningTime.getMinutes() - 15);

    const notifications = [];

    // Schedule opening notification if it's in the future
    if (openingTime > now) {
      const openingNotification = await sendNotification({
        type: "dairy_opened",
        title: "Dairy is Now Open!",
        message: `Good morning! ${dairyInfo.dairyName} is now open for business. Operating hours: ${dairyInfo.openingTime} - ${dairyInfo.closingTime}. Visit us today!`,
        recipients: ["farmers", "buyers"],
        createdBy,
        scheduledFor: openingTime
      });
      notifications.push(openingNotification);
    }

    // Schedule closing warning notification if it's in the future
    if (closingWarningTime > now) {
      const warningNotification = await sendNotification({
        type: "dairy_closing_soon",
        title: "Dairy Closing Soon",
        message: `Reminder: ${dairyInfo.dairyName} will close in 15 minutes at ${dairyInfo.closingTime}. Please complete your transactions soon.`,
        recipients: ["farmers", "buyers"],
        createdBy,
        scheduledFor: closingWarningTime
      });
      notifications.push(warningNotification);
    }

    return notifications;
  } catch (error) {
    console.error("Error scheduling dairy notifications:", error);
    throw error;
  }
};

// Process scheduled notifications (to be called by cron job)
export const processScheduledNotifications = async () => {
  try {
    const now = new Date();
    
    // Find notifications that are scheduled and due
    const dueNotifications = await Notification.find({
      isScheduled: true,
      isProcessed: false,
      scheduledFor: { $lte: now }
    });

    const results = [];
    
    for (const notification of dueNotifications) {
      try {
        const result = await processNotification(notification._id);
        results.push({
          notificationId: notification._id,
          type: notification.type,
          result
        });
      } catch (error) {
        console.error(`Error processing notification ${notification._id}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error("Error processing scheduled notifications:", error);
    throw error;
  }
};

// Get notification history
export const getNotificationHistory = async (filters = {}) => {
  try {
    const query = {};
    
    if (filters.type) {
      query.type = filters.type;
    }
    
    if (filters.startDate && filters.endDate) {
      query.createdAt = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate)
      };
    }

    const notifications = await Notification.find(query)
      .populate("createdBy", "username role")
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50);

    return notifications;
  } catch (error) {
    console.error("Error getting notification history:", error);
    throw error;
  }
};

// ============================================================================
// Role-Based Notification System - New Methods
// ============================================================================

import UserNotification from "../models/UserNotification.model.js";

/**
 * Resolve target users based on role selection
 * Excludes admin and milk_collector roles
 */
export const resolveTargetUsers = async (recipients) => {
  try {
    let query = {};
    
    if (recipients.includes("all")) {
      // All means farmers, buyers, and employees (excluding milk_collector)
      query = {
        $or: [
          { role: "farmer" },
          { role: "buyer" },
          { role: "employee", employeeRole: { $ne: "milk_collector" } }
        ],
        approved: true,
        isVerified: true
      };
    } else {
      const orConditions = [];
      
      if (recipients.includes("farmers")) {
        orConditions.push({ role: "farmer" });
      }
      
      if (recipients.includes("buyers")) {
        orConditions.push({ role: "buyer" });
      }
      
      if (recipients.includes("employees")) {
        // Employees excluding milk_collector
        orConditions.push({ 
          role: "employee", 
          employeeRole: { $ne: "milk_collector" } 
        });
      }
      
      if (orConditions.length === 0) {
        throw new Error("No valid recipients specified");
      }
      
      query = {
        $or: orConditions,
        approved: true,
        isVerified: true
      };
    }
    
    const users = await User.find(query).select("_id username mobile role employeeRole");
    
    // Additional filter to ensure no admin or milk_collector
    const filteredUsers = users.filter(user => {
      if (user.role === "admin") return false;
      if (user.role === "employee" && user.employeeRole === "milk_collector") return false;
      return true;
    });
    
    return filteredUsers;
  } catch (error) {
    console.error("Error resolving target users:", error);
    throw error;
  }
};

/**
 * Create notification and user notification records for target roles
 */
export const createNotificationForRoles = async (title, message, recipients, createdBy) => {
  try {
    // Validate inputs
    if (!title || !message || !recipients || recipients.length === 0) {
      throw new Error("Title, message, and recipients are required");
    }
    
    // Resolve target users
    const targetUsers = await resolveTargetUsers(recipients);
    
    if (targetUsers.length === 0) {
      throw new Error("No users found for the specified recipients");
    }
    
    // Create notification document
    const notification = new Notification({
      type: "manual",
      title,
      message,
      recipients,
      createdBy,
      isScheduled: false,
      isProcessed: true, // Mark as processed since we're creating UserNotifications
      sentTo: targetUsers.map(user => ({
        user: user._id,
        mobile: user.mobile,
        status: "sent",
        sentAt: new Date()
      }))
    });
    
    await notification.save();
    
    // Create UserNotification documents for each target user
    const userNotifications = targetUsers.map(user => ({
      user: user._id,
      notification: notification._id,
      isRead: false,
      readAt: null
    }));
    
    await UserNotification.insertMany(userNotifications);
    
    return {
      notificationId: notification._id,
      sentToCount: targetUsers.length
    };
  } catch (error) {
    console.error("Error creating notification for roles:", error);
    throw error;
  }
};

/**
 * Get notifications for a specific user with pagination
 */
export const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false
    } = options;
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { user: userId };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    // Filter by 30-day window
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.createdAt = { $gte: thirtyDaysAgo };
    
    // Get total count
    const total = await UserNotification.countDocuments(query);
    
    // Get notifications
    const userNotifications = await UserNotification.find(query)
      .populate({
        path: 'notification',
        populate: {
          path: 'createdBy',
          select: 'username role employeeRole'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Format response
    const notifications = userNotifications.map(un => ({
      _id: un._id,
      title: un.notification.title,
      message: un.notification.message,
      isRead: un.isRead,
      readAt: un.readAt,
      createdAt: un.createdAt,
      sender: {
        name: un.notification.createdBy.username,
        role: un.notification.createdBy.role,
        employeeRole: un.notification.createdBy.employeeRole
      }
    }));
    
    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + notifications.length < total
      }
    };
  } catch (error) {
    console.error("Error getting user notifications:", error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId) => {
  try {
    const count = await UserNotification.countDocuments({
      user: userId,
      isRead: false
    });
    
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (userId, notificationId) => {
  try {
    const result = await UserNotification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      throw new Error("Notification not found or does not belong to user");
    }
    
    return result;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  try {
    const result = await UserNotification.updateMany(
      { user: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};
