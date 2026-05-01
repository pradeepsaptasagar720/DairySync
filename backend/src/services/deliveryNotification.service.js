import DeliveryNotification from "../models/DeliveryNotification.model.js";

/**
 * Create and send a notification to a user
 * @param {String} userId - User ID to send notification to
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data (orderId, etc.)
 * @param {Object} channels - Channels to send notification through
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (
  userId,
  type,
  title,
  message,
  data = {},
  channels = { inApp: true, push: false, sms: false }
) => {
  try {
    // Create in-app notification
    const notification = await DeliveryNotification.create({
      userId,
      type,
      title,
      message,
      data,
      channels,
      read: false,
    });

    // Send push notification if enabled
    if (channels.push) {
      await sendPushNotification(userId, title, message, data);
    }

    // Send SMS if enabled
    if (channels.sms) {
      await sendSMS(userId, message);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Send in-app notification
 * @param {String} userId - User ID
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<Object>} Created notification
 */
export const sendInAppNotification = async (userId, type, title, message, data = {}) => {
  return await createNotification(userId, type, title, message, data, {
    inApp: true,
    push: false,
    sms: false,
  });
};

/**
 * Send push notification (optional - requires Firebase setup)
 * @param {String} userId - User ID
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {Object} data - Additional data
 * @returns {Promise<void>}
 */
export const sendPushNotification = async (userId, title, message, data = {}) => {
  try {
    // TODO: Implement Firebase Cloud Messaging integration
    // This is optional and requires FIREBASE_SERVER_KEY in environment
    console.log(`Push notification would be sent to user ${userId}: ${title}`);
    
    // Example implementation:
    // const admin = require('firebase-admin');
    // const userTokens = await getUserPushTokens(userId);
    // for (const token of userTokens) {
    //   await admin.messaging().send({
    //     token,
    //     notification: { title, body: message },
    //     data
    //   });
    // }
  } catch (error) {
    console.error("Error sending push notification:", error);
    // Don't throw - push notifications are optional
  }
};

/**
 * Send SMS notification (optional - requires Twilio setup)
 * @param {String} userId - User ID
 * @param {String} message - SMS message
 * @returns {Promise<void>}
 */
export const sendSMS = async (userId, message) => {
  try {
    // TODO: Implement Twilio SMS integration
    // This is optional and requires TWILIO credentials in environment
    console.log(`SMS would be sent to user ${userId}: ${message}`);
    
    // Example implementation:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const user = await User.findById(userId);
    // await client.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: user.mobile
    // });
  } catch (error) {
    console.error("Error sending SMS:", error);
    // Don't throw - SMS is optional
  }
};

/**
 * Get notifications for a user
 * @param {String} userId - User ID
 * @param {Number} limit - Number of notifications to return
 * @param {Number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of notifications
 */
export const getUserNotifications = async (userId, limit = 20, offset = 0) => {
  return await DeliveryNotification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
};

/**
 * Mark notification as read
 * @param {String} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
export const markAsRead = async (notificationId) => {
  return await DeliveryNotification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
};

/**
 * Get unread notification count for a user
 * @param {String} userId - User ID
 * @returns {Promise<Number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  return await DeliveryNotification.countDocuments({ userId, read: false });
};

/**
 * Send order status change notification to buyer
 * @param {String} buyerId - Buyer user ID
 * @param {String} orderId - Order ID
 * @param {String} status - New order status
 * @param {String} deliveryPersonName - Delivery person name (optional)
 * @returns {Promise<Object>} Created notification
 */
export const notifyOrderStatusChange = async (buyerId, orderId, status, deliveryPersonName = null) => {
  let type, title, message;

  switch (status) {
    case "Approved":
      type = "order_confirmed";
      title = "Order Confirmed";
      message = deliveryPersonName
        ? `Your order has been approved and assigned to ${deliveryPersonName}`
        : "Your order has been approved";
      break;

    case "Out for Delivery":
      type = "out_for_delivery";
      title = "Out for Delivery";
      message = "Your order is out for delivery and will arrive soon";
      break;

    case "Completed":
      type = "delivery_completed";
      title = "Order Delivered";
      message = "Your order has been delivered successfully";
      break;

    case "Cancelled":
      type = "order_cancelled";
      title = "Order Cancelled";
      message = "Your order has been cancelled";
      break;

    default:
      return null;
  }

  return await sendInAppNotification(buyerId, type, title, message, { orderId });
};

/**
 * Send new order alert to delivery person
 * @param {String} deliveryPersonId - Delivery person user ID
 * @param {Object} order - Order object
 * @param {Number} distance - Distance to pickup location
 * @param {Number} earnings - Estimated earnings
 * @returns {Promise<Object>} Created notification
 */
export const notifyNewOrderAlert = async (deliveryPersonId, order, distance, earnings) => {
  const title = "New Order Available";
  const message = `New order: ${order.quantity}L ${order.milkType} milk. Distance: ${distance.toFixed(1)}km, Earnings: ₹${earnings.toFixed(2)}`;

  return await sendInAppNotification(
    deliveryPersonId,
    "new_order_alert",
    title,
    message,
    {
      orderId: order._id,
      distance,
      earnings,
    }
  );
};

/**
 * Send proximity alert to buyer
 * @param {String} buyerId - Buyer user ID
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} Created notification
 */
export const notifyProximityAlert = async (buyerId, orderId) => {
  const title = "Delivery Person Nearby";
  const message = "Your delivery person is within 500 meters of your location";

  return await sendInAppNotification(buyerId, "proximity_alert", title, message, { orderId });
};
