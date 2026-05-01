import Delivery from "../models/Delivery.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { notifyOrderStatusChange } from "../services/deliveryNotification.service.js";
import { createEarningsRecord } from "../services/earningsCalculator.service.js";

// Status transition rules - Delivery boy workflow
const STATUS_TRANSITIONS = {
  "Pending": ["Accepted", "Cancelled"],  // Delivery boy accepts directly
  "Accepted": ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Completed", "Cancelled"],
  "Completed": [],  // Terminal state
  "Cancelled": []   // Terminal state
};

// Helper function to validate status transitions
const isValidTransition = (currentStatus, newStatus) => {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
};

// Get delivery dashboard stats
export const getDeliveryDashboard = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;

  // Today's date range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Today's delivery stats
  const todayStats = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfDay, $lt: endOfDay }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  // My handled deliveries today
  const myHandledToday = await Delivery.countDocuments({
    handledBy: employeeId,
    deliveryDate: { $gte: startOfDay, $lt: endOfDay }
  });

  // Pending deliveries
  const pendingDeliveries = await Delivery.countDocuments({
    status: "Pending"
  });

  // Recent deliveries
  const recentDeliveries = await Delivery.find({})
    .populate('buyer', 'username mobile')
    .populate('handledBy', 'username')
    .sort({ createdAt: -1 })
    .limit(10);

  // Format stats
  const stats = {
    pending: todayStats.find(s => s._id === "Pending") || { count: 0, totalQuantity: 0, totalAmount: 0 },
    approved: todayStats.find(s => s._id === "Approved") || { count: 0, totalQuantity: 0, totalAmount: 0 },
    completed: todayStats.find(s => s._id === "Completed") || { count: 0, totalQuantity: 0, totalAmount: 0 },
    cancelled: todayStats.find(s => s._id === "Cancelled") || { count: 0, totalQuantity: 0, totalAmount: 0 }
  };

  const totalToday = Object.values(stats).reduce((acc, stat) => ({
    count: acc.count + stat.count,
    totalQuantity: acc.totalQuantity + stat.totalQuantity,
    totalAmount: acc.totalAmount + stat.totalAmount
  }), { count: 0, totalQuantity: 0, totalAmount: 0 });

  res.json({
    success: true,
    data: {
      todayStats: {
        ...stats,
        total: totalToday
      },
      myHandledToday,
      pendingDeliveries,
      recentDeliveries
    },
    message: "Delivery dashboard data retrieved successfully"
  });
});

// Get delivery requests
export const getDeliveryRequests = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  
  let filter = {};
  
  // Status filter
  if (status && status !== 'all') {
    filter.status = status;
  } else {
    // By default, show only active deliveries (exclude Completed and Cancelled)
    // This prevents completed deliveries from cluttering the active delivery list
    filter.status = { $in: ['Pending', 'Accepted', 'Out for Delivery'] };
  }

  // Search filter
  if (search) {
    const buyers = await User.find({
      role: "buyer",
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    filter.$or = [
      { buyer: { $in: buyers.map(b => b._id) } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const deliveryRequests = await Delivery.find(filter)
    .populate('buyer', 'username mobile email uniqueId')
    .populate('handledBy', 'username uniqueId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Delivery.countDocuments(filter);

  // Summary by status (only for active deliveries)
  const summary = await Delivery.aggregate([
    {
      $match: {
        status: { $in: ['Pending', 'Accepted', 'Out for Delivery'] }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      requests: deliveryRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary
    },
    message: "Delivery requests retrieved successfully"
  });
});

// Update delivery request status
export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const employeeId = req.user.id;

  // Validate status value
  if (!["Pending", "Accepted", "Out for Delivery", "Completed", "Cancelled"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: "Invalid status. Must be Pending, Accepted, Out for Delivery, Completed, or Cancelled"
      }
    });
  }

  const delivery = await Delivery.findById(id).populate('buyer', 'mobile username');
  if (!delivery) {
    return res.status(404).json({
      success: false,
      error: {
        code: "DELIVERY_NOT_FOUND",
        message: "Delivery request not found"
      }
    });
  }

  // Validate status transition
  if (!isValidTransition(delivery.status, status)) {
    const validTransitions = STATUS_TRANSITIONS[delivery.status] || [];
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `Invalid status transition from ${delivery.status} to ${status}. Valid transitions: ${validTransitions.join(', ') || 'None (terminal state)'}`
      }
    });
  }

  // Special validation for Completed status - requires OTP verification
  if (status === "Completed") {
    if (delivery.otpRequired && !delivery.otpVerified) {
      return res.status(400).json({
        success: false,
        error: {
          code: "OTP_NOT_VERIFIED",
          message: "OTP verification is required before completing the delivery. Please verify OTP first."
        }
      });
    }
  }

  const updateData = {
    status,
    handledBy: employeeId,
    updatedAt: new Date()
  };

  if (notes) {
    updateData.notes = notes;
  }

  // Set timestamp for status changes
  if (status === "Accepted") {
    updateData.acceptedAt = new Date();
    updateData.deliveryPersonId = employeeId;
  }

  if (status === "Out for Delivery") {
    updateData.outForDeliveryAt = new Date();
  }

  // Set completion date if status is completed
  if (status === "Completed") {
    updateData.completedAt = new Date();
    
    // For COD orders, mark payment as completed when delivery is completed
    if (delivery.paymentMethod === "cod" && !delivery.paymentCompleted) {
      updateData.paymentCompleted = true;
      updateData.paymentDate = new Date();
    }

    // Calculate earnings if distance is available
    if (delivery.distanceKm && delivery.deliveryPersonId) {
      try {
        await createEarningsRecord(
          delivery.deliveryPersonId,
          delivery._id,
          delivery.distanceKm
        );
      } catch (earningsError) {
        console.error("Error creating earnings record:", earningsError);
        // Don't fail the request if earnings calculation fails
      }
    }
  }

  // Set cancellation date if status is cancelled
  if (status === "Cancelled") {
    updateData.cancelledAt = new Date();
  }

  const updatedDelivery = await Delivery.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).populate('buyer', 'username mobile uniqueId')
   .populate('handledBy', 'username uniqueId');

  // Send notification to buyer on status change
  try {
    if (["Accepted", "Out for Delivery", "Completed", "Cancelled"].includes(status)) {
      const deliveryPersonName = updatedDelivery.handledBy?.username || null;
      await notifyOrderStatusChange(
        updatedDelivery.buyer._id,
        updatedDelivery._id,
        status,
        deliveryPersonName
      );
    }
  } catch (notificationError) {
    console.error("Error sending notification:", notificationError);
    // Don't fail the request if notification fails
  }

  res.json({
    success: true,
    data: updatedDelivery,
    message: `Delivery request ${status.toLowerCase()} successfully`
  });
});

// Get delivery statistics
export const getDeliveryStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const employeeId = req.user.id;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Overall stats
  const overallStats = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  // My handled stats
  const myStats = await Delivery.aggregate([
    {
      $match: {
        handledBy: employeeId,
        deliveryDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  // Daily stats
  const dailyStats = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$deliveryDate" } },
          status: "$status"
        },
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $sort: { "_id.date": 1 }
    }
  ]);

  res.json({
    success: true,
    data: {
      overallStats,
      myStats,
      dailyStats,
      dateRange: { start, end }
    },
    message: "Delivery statistics retrieved successfully"
  });
});

// Get delivery history
export const getDeliveryHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const employeeId = req.user.id;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const deliveries = await Delivery.find({ handledBy: employeeId })
    .populate('buyer', 'username mobile uniqueId')
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Delivery.countDocuments({ handledBy: employeeId });

  res.json({
    success: true,
    data: {
      deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    },
    message: "Delivery history retrieved successfully"
  });
});