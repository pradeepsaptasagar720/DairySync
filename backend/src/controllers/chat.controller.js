import ChatMessage from "../models/ChatMessage.model.js";
import Delivery from "../models/Delivery.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import xss from "xss";

// Rate limiting map (in-memory, consider Redis for production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 messages per minute

/**
 * Check rate limit for a user
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userKey = userId.toString();
  
  if (!rateLimitMap.has(userKey)) {
    rateLimitMap.set(userKey, []);
  }
  
  const timestamps = rateLimitMap.get(userKey);
  // Remove timestamps older than the window
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (recentTimestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  recentTimestamps.push(now);
  rateLimitMap.set(userKey, recentTimestamps);
  return true;
};

/**
 * Verify user has access to order chat
 */
const verifyOrderAccess = async (orderId, userId, userRole) => {
  const order = await Delivery.findById(orderId);
  
  if (!order) {
    return { authorized: false, error: "ORDER_NOT_FOUND", message: "Order not found" };
  }
  
  // Check if chat is enabled
  if (!order.chatEnabled) {
    return { authorized: false, error: "CHAT_DISABLED", message: "Chat is disabled for this order" };
  }
  
  // Check order status - chat available for Accepted, Out for Delivery, or recently Completed
  const validStatuses = ["Accepted", "Out for Delivery", "Completed"];
  if (!validStatuses.includes(order.status)) {
    return { authorized: false, error: "INVALID_ORDER_STATUS", message: "Chat not available for this order status" };
  }
  
  // For completed orders, check if within 24 hours
  if (order.status === "Completed" && order.completedAt) {
    const hoursSinceCompletion = (Date.now() - new Date(order.completedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCompletion > 24) {
      return { authorized: false, error: "CHAT_EXPIRED", message: "Chat is no longer available for this order" };
    }
  }
  
  // Check authorization based on role
  if (userRole === "buyer") {
    if (order.buyer.toString() !== userId.toString()) {
      return { authorized: false, error: "CHAT_UNAUTHORIZED", message: "You are not authorized to access this chat" };
    }
  } else if (userRole === "delivery_boy") {
    if (!order.deliveryPersonId || order.deliveryPersonId.toString() !== userId.toString()) {
      return { authorized: false, error: "CHAT_UNAUTHORIZED", message: "You are not authorized to access this chat" };
    }
  } else {
    return { authorized: false, error: "CHAT_UNAUTHORIZED", message: "Invalid user role for chat access" };
  }
  
  return { authorized: true, order };
};

/**
 * Send a message
 * POST /api/chat/messages
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { orderId, message } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role === "buyer" ? "buyer" : "delivery_boy";
  
  // Validate message
  if (!message || typeof message !== "string") {
    return res.status(400).json({
      success: false,
      error: {
        code: "MESSAGE_EMPTY",
        message: "Message is required"
      }
    });
  }
  
  // Trim message
  const trimmedMessage = message.trim();
  
  // Check if message is empty after trimming
  if (trimmedMessage.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MESSAGE_EMPTY",
        message: "Message contains only whitespace"
      }
    });
  }
  
  // Check message length
  if (trimmedMessage.length < 1 || trimmedMessage.length > 1000) {
    return res.status(400).json({
      success: false,
      error: {
        code: trimmedMessage.length < 1 ? "MESSAGE_TOO_SHORT" : "MESSAGE_TOO_LONG",
        message: trimmedMessage.length < 1 
          ? "Message must be at least 1 character" 
          : "Message exceeds 1000 character limit"
      }
    });
  }
  
  // Check rate limit
  if (!checkRateLimit(userId)) {
    return res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many messages sent, please wait"
      }
    });
  }
  
  // Verify order access
  const accessCheck = await verifyOrderAccess(orderId, userId, userRole);
  if (!accessCheck.authorized) {
    return res.status(accessCheck.error === "ORDER_NOT_FOUND" ? 404 : 403).json({
      success: false,
      error: {
        code: accessCheck.error,
        message: accessCheck.message
      }
    });
  }
  
  // Check if order allows sending (not completed >24 hours ago)
  const order = accessCheck.order;
  if (order.status === "Completed" && order.completedAt) {
    const hoursSinceCompletion = (Date.now() - new Date(order.completedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCompletion > 24) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CHAT_EXPIRED",
          message: "Cannot send messages to orders completed more than 24 hours ago"
        }
      });
    }
  }
  
  // Sanitize message content
  const sanitizedMessage = xss(trimmedMessage, {
    whiteList: {}, // No HTML tags allowed
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script"]
  });
  
  // Get sender name
  const user = await User.findById(userId).select("username");
  
  // Create message
  const chatMessage = await ChatMessage.create({
    orderId,
    senderId: userId,
    senderRole: userRole,
    senderName: user.username,
    message: sanitizedMessage,
    isRead: false
  });
  
  // Update order's last chat activity and unread count
  const recipientRole = userRole === "buyer" ? "deliveryBoy" : "buyer";
  await Delivery.findByIdAndUpdate(orderId, {
    lastChatActivity: new Date(),
    [`unreadMessagesCount.${recipientRole}`]: order.unreadMessagesCount[recipientRole] + 1
  });
  
  // TODO: Emit notification event for new message
  // This will be handled in task 12.1
  
  res.status(201).json({
    success: true,
    data: {
      _id: chatMessage._id,
      orderId: chatMessage.orderId,
      senderId: chatMessage.senderId,
      senderRole: chatMessage.senderRole,
      senderName: chatMessage.senderName,
      message: chatMessage.message,
      isRead: chatMessage.isRead,
      createdAt: chatMessage.createdAt
    }
  });
});

/**
 * Get messages for an order
 * GET /api/chat/messages/:orderId
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { lastMessageId, limit = 50 } = req.query;
  const userId = req.user.id;
  const userRole = req.user.role === "buyer" ? "buyer" : "delivery_boy";
  
  // Verify order access
  const accessCheck = await verifyOrderAccess(orderId, userId, userRole);
  if (!accessCheck.authorized) {
    return res.status(accessCheck.error === "ORDER_NOT_FOUND" ? 404 : 403).json({
      success: false,
      error: {
        code: accessCheck.error,
        message: accessCheck.message
      }
    });
  }
  
  // Build query
  const query = { orderId };
  if (lastMessageId) {
    const lastMessage = await ChatMessage.findById(lastMessageId);
    if (lastMessage) {
      query.createdAt = { $gt: lastMessage.createdAt };
    }
  }
  
  // Fetch messages
  const messages = await ChatMessage.find(query)
    .sort({ createdAt: 1 }) // Chronological order
    .limit(parseInt(limit));
  
  const hasMore = messages.length === parseInt(limit);
  
  res.status(200).json({
    success: true,
    data: {
      messages,
      hasMore
    }
  });
});

/**
 * Mark messages as read
 * PUT /api/chat/messages/:orderId/read
 */
export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role === "buyer" ? "buyer" : "delivery_boy";
  
  // Verify order access
  const accessCheck = await verifyOrderAccess(orderId, userId, userRole);
  if (!accessCheck.authorized) {
    return res.status(accessCheck.error === "ORDER_NOT_FOUND" ? 404 : 403).json({
      success: false,
      error: {
        code: accessCheck.error,
        message: accessCheck.message
      }
    });
  }
  
  // Mark all messages sent by the other party as read
  const senderRole = userRole === "buyer" ? "delivery_boy" : "buyer";
  const result = await ChatMessage.updateMany(
    { orderId, senderRole, isRead: false },
    { $set: { isRead: true } }
  );
  
  // Reset unread count for current user
  const currentUserRole = userRole === "buyer" ? "buyer" : "deliveryBoy";
  await Delivery.findByIdAndUpdate(orderId, {
    [`unreadMessagesCount.${currentUserRole}`]: 0
  });
  
  res.status(200).json({
    success: true,
    data: {
      markedCount: result.modifiedCount
    }
  });
});

/**
 * Get unread message counts for user's orders
 * GET /api/chat/unread-counts
 */
export const getUnreadCounts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role === "buyer" ? "buyer" : "delivery_boy";
  
  // Find all orders for the user
  let orders;
  if (userRole === "buyer") {
    orders = await Delivery.find({ buyer: userId }).select("_id unreadMessagesCount");
  } else {
    orders = await Delivery.find({ deliveryPersonId: userId }).select("_id unreadMessagesCount");
  }
  
  // Build unread counts object
  const orderUnreadCounts = {};
  const roleKey = userRole === "buyer" ? "buyer" : "deliveryBoy";
  
  orders.forEach(order => {
    orderUnreadCounts[order._id.toString()] = order.unreadMessagesCount[roleKey] || 0;
  });
  
  res.status(200).json({
    success: true,
    data: {
      orderUnreadCounts
    }
  });
});
