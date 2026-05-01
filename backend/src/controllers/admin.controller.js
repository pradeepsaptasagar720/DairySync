import User from "../models/User.model.js";
import RateChart from "../models/RateChart.model.js";
import DairyInfo from "../models/DairyInfo.model.js";
import MilkEntry from "../models/MilkEntry.model.js";
import Transport from "../models/Transport.model.js";
import Delivery from "../models/Delivery.model.js";
import Animal from "../models/Animal.model.js";
import FarmerPayment from "../models/FarmerPayment.model.js";
import Loan from "../models/Loan.model.js";
import Feed from "../models/Feed.model.js";
import FeedStock from "../models/FeedStock.model.js";
import Billing from "../models/Billing.model.js";
import Payment from "../models/Payment.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { 
  calculateTodayMilkCollection, 
  calculateYesterdayMilkCollection,
  calculateCurrentMonthMilkCollection,
  calculatePreviousMonthMilkCollection 
} from "../utils/milkCalculations.js";
import SearchService from "../services/search.service.js";
import UserDataService from "../services/userDataAggregation.service.js";
import LoanAnalyticsService from "../services/loanAnalytics.service.js";

export const dashboard = asyncHandler(async (req, res) => {
  // Basic user counts (only active employees)
  const farmers = await User.countDocuments({ role: "farmer" });
  const buyers = await User.countDocuments({ role: "buyer" });
  const employees = await User.countDocuments({ role: "employee", isActive: true });
  
  // Count pending approvals (verified but not approved, only active employees)
  const pendingApprovals = await User.countDocuments({ 
    isVerified: true, 
    approved: false,
    $or: [
      { role: "farmer" },                     // All farmers
      { role: "buyer" },                      // All buyers
      { role: "employee", isActive: true }    // Only active employees
    ]
  });

  // Count approved users (only active employees)
  const approvedFarmers = await User.countDocuments({ role: "farmer", approved: true });
  const approvedBuyers = await User.countDocuments({ role: "buyer", approved: true });
  const approvedEmployees = await User.countDocuments({ role: "employee", approved: true, isActive: true });

  // Get current milk rate
  let currentMilkRate = 0;
  try {
    const rateChart = await RateChart.findOne({});
    currentMilkRate = rateChart ? rateChart.rate : 0;
  } catch (err) {
    console.log("No milk rate found");
  }

  // Calculate today's date range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Today's registrations
  const todayRegistrations = await User.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
    $or: [
      { role: "farmer" },                     // All farmers
      { role: "buyer" },                      // All buyers
      { role: "employee", isActive: true }    // Only active employees
    ]
  });

  // This week's registrations
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekRegistrations = await User.countDocuments({
    createdAt: { $gte: weekAgo },
    $or: [
      { role: "farmer" },                     // All farmers
      { role: "buyer" },                      // All buyers
      { role: "employee", isActive: true }    // Only active employees
    ]
  });

  // This month's registrations
  const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const monthRegistrations = await User.countDocuments({
    createdAt: { $gte: monthAgo },
    $or: [
      { role: "farmer" },                     // All farmers
      { role: "buyer" },                      // All buyers
      { role: "employee", isActive: true }    // Only active employees
    ]
  });

  res.json({ 
    success: true,
    data: { 
      // Basic counts
      farmers, 
      buyers, 
      employees,
      pendingApprovals,
      
      // Approved counts
      approvedFarmers,
      approvedBuyers,
      approvedEmployees,
      
      // System info
      currentMilkRate,
      
      // Registration trends
      todayRegistrations,
      weekRegistrations,
      monthRegistrations,
      
      // Calculated metrics
      totalUsers: farmers + buyers + employees,
      approvalRate: farmers + buyers + employees > 0 
        ? ((approvedFarmers + approvedBuyers + approvedEmployees) / (farmers + buyers + employees) * 100).toFixed(1)
        : 0
    },
    message: "Dashboard data retrieved successfully"
  });
});

export const getFarmers = asyncHandler(async (req, res) => {
  const farmers = await User.find({ role: "farmer" });
  res.json({
    success: true,
    data: farmers,
    message: "Farmers retrieved successfully"
  });
});

// Get all pending users for approval
export const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({ 
    isVerified: true, 
    approved: false,
    role: { $in: ["farmer", "buyer", "employee"] }
  }).select('-password').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: pendingUsers,
    message: "Pending users retrieved successfully"
  });
});

// Get all users by role
export const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  
  if (!["farmer", "buyer", "employee"].includes(role)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ROLE",
        message: "Invalid role specified"
      }
    });
  }

  const users = await User.find({ role }).select('-password').sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: users,
    message: `${role.charAt(0).toUpperCase() + role.slice(1)}s retrieved successfully`
  });
});

export const approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  if (!user.isVerified) {
    return res.status(400).json({
      success: false,
      error: {
        code: "USER_NOT_VERIFIED",
        message: "User must verify OTP before approval"
      }
    });
  }

  if (user.approved) {
    return res.status(400).json({
      success: false,
      error: {
        code: "ALREADY_APPROVED",
        message: "User is already approved"
      }
    });
  }

  // Generate unique ID only when approving the user
  let uniqueId = user.uniqueId;
  if (!uniqueId) {
    uniqueId = await generateUniqueId(user.role);
  }

  await User.updateOne({ _id: req.params.id }, { 
    approved: true,
    uniqueId: uniqueId
  });

  // Get updated user data to return
  const updatedUser = await User.findById(req.params.id).select('-password');
  
  res.json({ 
    success: true,
    data: {
      user: updatedUser,
      uniqueId: uniqueId
    },
    message: `User approved successfully! Unique ID ${uniqueId} has been assigned.` 
  });
});

// Get user activities timeline and analytics
export const getUserActivities = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { 
    startDate, 
    endDate, 
    activityType, 
    page = 1, 
    limit = 50 
  } = req.query;

  // Get user basic information
  const user = await User.findById(userId).select('role username uniqueId');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  if (!["farmer", "buyer", "employee"].includes(user.role)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_USER_ROLE",
        message: "Activities can only be viewed for farmers, buyers, and employees"
      }
    });
  }

  // Build date filter
  let dateFilter = {};
  if (startDate || endDate) {
    dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  let activities = [];
  let totalActivities = 0;

  // Get activities based on user role and activity type filter
  switch (user.role) {
    case 'farmer':
      let milkFilter = { farmer: user._id };
      if (dateFilter && Object.keys(dateFilter).length > 0) {
        milkFilter.date = dateFilter;
      }

      if (!activityType || activityType === 'milk_entry') {
        const milkEntries = await MilkEntry.find(milkFilter)
          .populate('collectedBy', 'username uniqueId')
          .sort({ date: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        const milkCount = await MilkEntry.countDocuments(milkFilter);

        activities = milkEntries.map(entry => ({
          _id: entry._id,
          type: 'milk_entry',
          date: entry.date,
          description: `Milk collection: ${entry.liters}L ${entry.milkType} milk`,
          amount: entry.totalAmount,
          status: 'completed',
          details: {
            liters: entry.liters,
            rate: entry.rate,
            milkType: entry.milkType,
            collectedBy: entry.collectedBy
          }
        }));

        totalActivities = milkCount;
      }
      break;

    case 'buyer':
      let deliveryFilter = { buyer: user._id };
      if (dateFilter && Object.keys(dateFilter).length > 0) {
        deliveryFilter.createdAt = dateFilter;
      }

      if (!activityType || activityType === 'order') {
        const deliveries = await Delivery.find(deliveryFilter)
          .populate('handledBy', 'username uniqueId')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit));

        const deliveryCount = await Delivery.countDocuments(deliveryFilter);

        activities = deliveries.map(delivery => ({
          _id: delivery._id,
          type: 'order',
          date: delivery.createdAt,
          description: `Order: ${delivery.quantity}L ${delivery.milkType} milk`,
          amount: delivery.totalAmount,
          status: delivery.status.toLowerCase(),
          details: {
            quantity: delivery.quantity,
            rate: delivery.rate,
            milkType: delivery.milkType,
            deliveryDate: delivery.deliveryDate,
            address: delivery.address,
            handledBy: delivery.handledBy
          }
        }));

        totalActivities = deliveryCount;
      }
      break;

    case 'employee':
      let allActivities = [];

      // Get milk collections
      if (!activityType || activityType === 'milk_collection') {
        let collectionFilter = { collectedBy: user._id };
        if (dateFilter && Object.keys(dateFilter).length > 0) {
          collectionFilter.date = dateFilter;
        }

        const collections = await MilkEntry.find(collectionFilter)
          .populate('farmer', 'username uniqueId')
          .sort({ date: -1 });

        const collectionActivities = collections.map(collection => ({
          _id: collection._id,
          type: 'milk_collection',
          date: collection.date,
          description: `Collected ${collection.liters}L ${collection.milkType} milk from ${collection.farmer?.username}`,
          amount: collection.totalAmount,
          status: 'completed',
          details: {
            liters: collection.liters,
            milkType: collection.milkType,
            farmer: collection.farmer
          }
        }));

        allActivities = [...allActivities, ...collectionActivities];
      }

      // Get deliveries handled
      if (!activityType || activityType === 'delivery_handled') {
        let deliveryHandledFilter = { handledBy: user._id };
        if (dateFilter && Object.keys(dateFilter).length > 0) {
          deliveryHandledFilter.createdAt = dateFilter;
        }

        const deliveriesHandled = await Delivery.find(deliveryHandledFilter)
          .populate('buyer', 'username uniqueId')
          .sort({ createdAt: -1 });

        const deliveryActivities = deliveriesHandled.map(delivery => ({
          _id: delivery._id,
          type: 'delivery_handled',
          date: delivery.createdAt,
          description: `Handled delivery for ${delivery.buyer?.username}`,
          amount: delivery.totalAmount,
          status: delivery.status.toLowerCase(),
          details: {
            quantity: delivery.quantity,
            milkType: delivery.milkType,
            status: delivery.status,
            buyer: delivery.buyer
          }
        }));

        allActivities = [...allActivities, ...deliveryActivities];
      }

      // Sort all activities by date and paginate
      allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
      totalActivities = allActivities.length;
      activities = allActivities.slice(skip, skip + parseInt(limit));
      break;
  }

  // Calculate activity analytics
  const analytics = {
    totalActivities,
    activitiesInPeriod: activities.length,
    activityTypes: [...new Set(activities.map(a => a.type))],
    totalAmount: activities.reduce((sum, activity) => sum + (activity.amount || 0), 0),
    averageAmount: activities.length > 0 ? 
      activities.reduce((sum, activity) => sum + (activity.amount || 0), 0) / activities.length : 0,
    statusBreakdown: activities.reduce((acc, activity) => {
      acc[activity.status] = (acc[activity.status] || 0) + 1;
      return acc;
    }, {})
  };

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        username: user.username,
        uniqueId: user.uniqueId,
        role: user.role
      },
      activities,
      analytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalActivities,
        pages: Math.ceil(totalActivities / parseInt(limit))
      }
    },
    message: "User activities retrieved successfully"
  });
});

// Get detailed user profile with activities and transactions
export const getUserProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { 
    includeActivities = true, 
    activityLimit = 50,
    includeAnalytics = true,
    includeTransactions = true,
    dateFrom,
    dateTo
  } = req.query;

  try {
    const options = {
      includeActivities: includeActivities === 'true',
      activityLimit: parseInt(activityLimit),
      includeAnalytics: includeAnalytics === 'true',
      includeTransactions: includeTransactions === 'true',
      dateRange: (dateFrom || dateTo) ? { startDate: dateFrom, endDate: dateTo } : null
    };

    const profileData = await UserDataService.getComprehensiveProfile(userId, options);

    res.json({
      success: true,
      data: profileData,
      message: "User profile retrieved successfully"
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });
    }

    if (error.message.includes("Profile can only be viewed")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ROLE",
          message: error.message
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: "PROFILE_FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get comprehensive user data with role-specific information
export const getComprehensiveUserData = asyncHandler(async (req, res) => {
  const { role, approved, search, page = 1, limit = 20, includeActivities = false } = req.query;
  
  let filter = { role: { $in: ["farmer", "buyer", "employee"] } };
  
  // Add role filter if specified
  if (role && ["farmer", "buyer", "employee"].includes(role)) {
    filter.role = role;
  }
  
  // Add approval filter if specified
  if (approved !== undefined) {
    filter.approved = approved === 'true';
  }
  
  // Add search filter if specified
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { uniqueId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get users with basic information
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Enhance users with role-specific data
  const enhancedUsers = await Promise.all(users.map(async (user) => {
    const userData = user.toObject();
    
    // Add role-specific data based on user role
    switch (user.role) {
      case 'farmer':
        // Get farmer's milk entries summary
        const milkSummary = await MilkEntry.aggregate([
          { $match: { farmer: user._id } },
          {
            $group: {
              _id: null,
              totalEntries: { $sum: 1 },
              totalLiters: { $sum: "$liters" },
              totalAmount: { $sum: "$totalAmount" },
              lastEntry: { $max: "$date" }
            }
          }
        ]);
        
        // Get farmer's animals count
        const animalCount = await Animal.countDocuments({ farmer: user._id, isActive: true });
        
        userData.farmerData = {
          milkEntries: milkSummary[0] || { totalEntries: 0, totalLiters: 0, totalAmount: 0, lastEntry: null },
          animalCount
        };
        break;
        
      case 'buyer':
        // Get buyer's delivery summary
        const deliverySummary = await Delivery.aggregate([
          { $match: { buyer: user._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalQuantity: { $sum: "$quantity" },
              totalAmount: { $sum: "$totalAmount" },
              lastOrder: { $max: "$deliveryDate" }
            }
          }
        ]);
        
        userData.buyerData = {
          orders: deliverySummary[0] || { totalOrders: 0, totalQuantity: 0, totalAmount: 0, lastOrder: null }
        };
        break;
        
      case 'employee':
        // Get employee's collection summary
        const collectionSummary = await MilkEntry.aggregate([
          { $match: { collectedBy: user._id } },
          {
            $group: {
              _id: null,
              totalCollections: { $sum: 1 },
              totalLiters: { $sum: "$liters" },
              lastCollection: { $max: "$date" }
            }
          }
        ]);
        
        userData.employeeData = {
          collections: collectionSummary[0] || { totalCollections: 0, totalLiters: 0, lastCollection: null }
        };
        break;
    }
    
    return userData;
  }));

  const total = await User.countDocuments(filter);

  // Get summary statistics
  const summary = await User.aggregate([
    { $match: { role: { $in: ["farmer", "buyer", "employee"] } } },
    {
      $group: {
        _id: { role: "$role", approved: "$approved" },
        count: { $sum: 1 }
      }
    }
  ]);

  // Format summary for easier consumption
  const stats = {
    farmers: { approved: 0, pending: 0, total: 0 },
    buyers: { approved: 0, pending: 0, total: 0 },
    employees: { approved: 0, pending: 0, total: 0 }
  };

  summary.forEach(item => {
    const role = item._id.role;
    const status = item._id.approved ? 'approved' : 'pending';
    if (stats[role + 's']) {
      stats[role + 's'][status] = item.count;
      stats[role + 's'].total += item.count;
    }
  });

  res.json({
    success: true,
    data: {
      users: enhancedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: stats
    },
    message: "Comprehensive user data retrieved successfully"
  });
});

// Get all users (farmers, buyers, employees) for admin management - kept for backward compatibility
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, approved, search, page = 1, limit = 20 } = req.query;
  
  let filter = { role: { $in: ["farmer", "buyer", "employee"] } };
  
  // Add role filter if specified
  if (role && ["farmer", "buyer", "employee"].includes(role)) {
    filter.role = role;
  }
  
  // Add approval filter if specified
  if (approved !== undefined) {
    filter.approved = approved === 'true';
  }
  
  // Add search filter if specified
  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { uniqueId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  // Get summary statistics
  const summary = await User.aggregate([
    { $match: { role: { $in: ["farmer", "buyer", "employee"] } } },
    {
      $group: {
        _id: { role: "$role", approved: "$approved" },
        count: { $sum: 1 }
      }
    }
  ]);

  // Format summary for easier consumption
  const stats = {
    farmers: { approved: 0, pending: 0, total: 0 },
    buyers: { approved: 0, pending: 0, total: 0 },
    employees: { approved: 0, pending: 0, total: 0 }
  };

  summary.forEach(item => {
    const role = item._id.role;
    const status = item._id.approved ? 'approved' : 'pending';
    if (stats[role + 's']) {
      stats[role + 's'][status] = item.count;
      stats[role + 's'].total += item.count;
    }
  });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      summary: stats
    },
    message: "Users retrieved successfully"
  });
});

// Assign unique IDs to existing users (migration function)
export const assignUniqueIds = asyncHandler(async (req, res) => {
  try {
    // Find all approved users without unique IDs
    const usersWithoutIds = await User.find({
      role: { $in: ["farmer", "buyer", "employee"] },
      approved: true,
      $or: [
        { uniqueId: { $exists: false } },
        { uniqueId: null },
        { uniqueId: "" }
      ]
    });

    let assignedCount = 0;
    const assignments = [];

    for (const user of usersWithoutIds) {
      try {
        const uniqueId = await generateUniqueId(user.role);
        await User.updateOne({ _id: user._id }, { uniqueId });
        
        assignments.push({
          userId: user._id,
          username: user.username,
          role: user.role,
          uniqueId: uniqueId
        });
        
        assignedCount++;
      } catch (error) {
        console.error(`Failed to assign ID to user ${user._id}:`, error);
      }
    }

    res.json({
      success: true,
      data: {
        assignedCount,
        totalProcessed: usersWithoutIds.length,
        assignments
      },
      message: `Successfully assigned unique IDs to ${assignedCount} users`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "ASSIGNMENT_FAILED",
        message: error.message
      }
    });
  }
});

// Reject/Delete user
export const rejectUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  if (user.role === "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "CANNOT_REJECT_ADMIN",
        message: "Cannot reject admin users"
      }
    });
  }

  await User.deleteOne({ _id: req.params.id });
  
  res.json({ 
    success: true,
    message: "User rejected and removed successfully" 
  });
});

export const updateMilkRate = asyncHandler(async (req, res) => {
  const { rate } = req.body;
  
  if (!rate || rate <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_RATE",
        message: "Rate must be a positive number"
      }
    });
  }

  await RateChart.findOneAndUpdate({}, { rate }, { upsert: true });
  res.json({ 
    success: true,
    message: "Milk rate updated successfully" 
  });
});

// Create or update comprehensive rate chart
export const createRateChart = asyncHandler(async (req, res) => {
  const { date, name, cowRates, buffaloRates, rangeSettings } = req.body;
  const adminId = req.user.id;

  if (!date || !name) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Date and name are required"
      }
    });
  }

  try {
    const rateChart = new RateChart({
      date: new Date(date),
      name: name.trim(),
      cowRates: cowRates || [],
      buffaloRates: buffaloRates || [],
      rangeSettings: rangeSettings || {},
      createdBy: adminId,
      effectiveFrom: new Date(date)
    });

    await rateChart.save();

    res.json({
      success: true,
      data: rateChart,
      message: "Rate chart saved successfully"
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: {
          code: "DUPLICATE_ENTRY",
          message: "A rate chart with this date already exists"
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: "SAVE_FAILED",
        message: error.message
      }
    });
  }
});

// Get all rate charts
export const getRateCharts = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1 } = req.query;

  try {
    const rateCharts = await RateChart.find({ isActive: true })
      .populate('createdBy', 'username')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await RateChart.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: rateCharts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      message: "Rate charts retrieved successfully"
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

// Delete rate chart
export const deleteRateChart = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const rateChart = await RateChart.findById(id);

    if (!rateChart) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RATE_CHART_NOT_FOUND",
          message: "Rate chart not found"
        }
      });
    }

    // Soft delete by setting isActive to false
    await RateChart.findByIdAndUpdate(id, { isActive: false });

    res.json({
      success: true,
      message: "Rate chart deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: error.message
      }
    });
  }
});

// Get rate chart by ID
export const getRateChartById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const rateChart = await RateChart.findById(id)
      .populate('createdBy', 'username');

    if (!rateChart) {
      return res.status(404).json({
        success: false,
        error: {
          code: "RATE_CHART_NOT_FOUND",
          message: "Rate chart not found"
        }
      });
    }

    res.json({
      success: true,
      data: rateChart,
      message: "Rate chart retrieved successfully"
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

// Get today's reports with cow/buffalo separation
export const getTodayReports = asyncHandler(async (req, res) => {
  // Calculate today's date range
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const todayDateString = today.toISOString().split('T')[0];

  // Get detailed date-wise and session-wise milk collection data for today
  const detailedMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: todayDateString,
        $or: [
          { "cow.quantity": { $gt: 0 } },
          { "buffalo.quantity": { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: {
          date: "$date",
          session: "$session"
        },
        cowLiters: { $sum: "$cow.quantity" },
        cowAmount: { $sum: "$cow.amount" },
        buffaloLiters: { $sum: "$buffalo.quantity" },
        buffaloAmount: { $sum: "$buffalo.amount" },
        totalAmount: { $sum: "$totalAmount" },
        entries: { $sum: 1 },
        farmers: { $addToSet: "$farmer" },
        farmerNames: { $addToSet: "$farmerName" }
      }
    },
    {
      $sort: { "_id.session": 1 }
    }
  ]);

  // Get summary totals for cow and buffalo
  const cowMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: todayDateString,
        "cow.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$cow.quantity" },
        totalAmount: { $sum: "$cow.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  const buffaloMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: todayDateString,
        "buffalo.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$buffalo.quantity" },
        totalAmount: { $sum: "$buffalo.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  // Get today's sales (deliveries) by type
  const cowSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfDay, $lt: endOfDay },
        milkType: "cow",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  const buffaloSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfDay, $lt: endOfDay },
        milkType: "buffalo",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  // Get today's transport data
  const todayTransport = await Transport.findOne({
    date: { $gte: startOfDay, $lt: endOfDay }
  });

  // Count active farmers and buyers today
  const activeFarmersToday = await MilkEntry.distinct("farmer", {
    date: todayDateString,
    $or: [
      { "cow.quantity": { $gt: 0 } },
      { "buffalo.quantity": { $gt: 0 } }
    ]
  });

  const activeBuyersToday = await Delivery.distinct("buyer", {
    deliveryDate: { $gte: startOfDay, $lt: endOfDay },
    status: { $in: ["Approved", "Completed"] }
  });

  // Format response data
  const cowCollection = cowMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const buffaloCollection = buffaloMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const cowSaleData = cowSales[0] || { totalLiters: 0, totalAmount: 0, buyerCount: [] };
  const buffaloSaleData = buffaloSales[0] || { totalLiters: 0, totalAmount: 0, buyerCount: [] };

  const reportData = {
    // Milk Collection Summary
    milkCollection: {
      cow: {
        liters: cowCollection.totalLiters,
        amount: cowCollection.totalAmount,
        entries: cowCollection.totalEntries
      },
      buffalo: {
        liters: buffaloCollection.totalLiters,
        amount: buffaloCollection.totalAmount,
        entries: buffaloCollection.totalEntries
      },
      total: {
        liters: cowCollection.totalLiters + buffaloCollection.totalLiters,
        amount: cowCollection.totalAmount + buffaloCollection.totalAmount,
        entries: cowCollection.totalEntries + buffaloCollection.totalEntries
      }
    },

    // Detailed date-wise and session-wise breakdown
    detailedBreakdown: detailedMilkCollection.map(item => ({
      date: item._id.date,
      session: item._id.session,
      cow: {
        liters: item.cowLiters,
        amount: item.cowAmount
      },
      buffalo: {
        liters: item.buffaloLiters,
        amount: item.buffaloAmount
      },
      total: {
        liters: item.cowLiters + item.buffaloLiters,
        amount: item.totalAmount
      },
      entries: item.entries,
      farmerCount: item.farmers.length,
      farmerNames: item.farmerNames
    })),
    
    // Sales
    sales: {
      cow: {
        liters: cowSaleData.totalLiters,
        amount: cowSaleData.totalAmount
      },
      buffalo: {
        liters: buffaloSaleData.totalLiters,
        amount: buffaloSaleData.totalAmount
      },
      total: {
        liters: cowSaleData.totalLiters + buffaloSaleData.totalLiters,
        amount: cowSaleData.totalAmount + buffaloSaleData.totalAmount
      }
    },

    // Transport
    transport: {
      cow: {
        liters: todayTransport?.cowMilkTransported || 0,
        amount: todayTransport?.cowTransportAmount || 0
      },
      buffalo: {
        liters: todayTransport?.buffaloMilkTransported || 0,
        amount: todayTransport?.buffaloTransportAmount || 0
      },
      total: {
        liters: (todayTransport?.cowMilkTransported || 0) + (todayTransport?.buffaloMilkTransported || 0),
        amount: (todayTransport?.cowTransportAmount || 0) + (todayTransport?.buffaloTransportAmount || 0)
      }
    },

    // Active participants
    activeParticipants: {
      farmers: activeFarmersToday.length,
      buyers: activeBuyersToday.length
    },

    // Period info
    periodInfo: {
      date: todayDateString,
      periodType: 'today'
    }
  };

  res.json({
    success: true,
    data: reportData,
    message: "Today's reports retrieved successfully"
  });
});

// Get yesterday's reports with cow/buffalo separation
export const getYesterdayReports = asyncHandler(async (req, res) => {
  // Calculate yesterday's date range
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
  const yesterdayDateString = yesterday.toISOString().split('T')[0];

  // Get detailed date-wise and session-wise milk collection data for yesterday
  const detailedMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: yesterdayDateString,
        $or: [
          { "cow.quantity": { $gt: 0 } },
          { "buffalo.quantity": { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: {
          date: "$date",
          session: "$session"
        },
        cowLiters: { $sum: "$cow.quantity" },
        cowAmount: { $sum: "$cow.amount" },
        buffaloLiters: { $sum: "$buffalo.quantity" },
        buffaloAmount: { $sum: "$buffalo.amount" },
        totalAmount: { $sum: "$totalAmount" },
        entries: { $sum: 1 },
        farmers: { $addToSet: "$farmer" },
        farmerNames: { $addToSet: "$farmerName" }
      }
    },
    {
      $sort: { "_id.session": 1 }
    }
  ]);

  // Get summary totals for cow and buffalo
  const cowMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: yesterdayDateString,
        "cow.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$cow.quantity" },
        totalAmount: { $sum: "$cow.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  const buffaloMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: yesterdayDateString,
        "buffalo.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$buffalo.quantity" },
        totalAmount: { $sum: "$buffalo.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  // Get yesterday's sales (deliveries) by type
  const cowSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfYesterday, $lt: endOfYesterday },
        milkType: "cow",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  const buffaloSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfYesterday, $lt: endOfYesterday },
        milkType: "buffalo",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  // Get yesterday's transport data
  const yesterdayTransport = await Transport.findOne({
    date: { $gte: startOfYesterday, $lt: endOfYesterday }
  });

  // Count active farmers and buyers yesterday
  const activeFarmersYesterday = await MilkEntry.distinct("farmer", {
    date: yesterdayDateString,
    $or: [
      { "cow.quantity": { $gt: 0 } },
      { "buffalo.quantity": { $gt: 0 } }
    ]
  });

  const activeBuyersYesterday = await Delivery.distinct("buyer", {
    deliveryDate: { $gte: startOfYesterday, $lt: endOfYesterday },
    status: { $in: ["Approved", "Completed"] }
  });

  // Format response data
  const cowCollection = cowMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const buffaloCollection = buffaloMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const cowSaleData = cowSales[0] || { totalLiters: 0, totalAmount: 0, buyerCount: [] };
  const buffaloSaleData = buffaloSales[0] || { totalLiters: 0, totalAmount: 0, buyerCount: [] };

  const reportData = {
    // Milk Collection Summary
    milkCollection: {
      cow: {
        liters: cowCollection.totalLiters,
        amount: cowCollection.totalAmount,
        entries: cowCollection.totalEntries
      },
      buffalo: {
        liters: buffaloCollection.totalLiters,
        amount: buffaloCollection.totalAmount,
        entries: buffaloCollection.totalEntries
      },
      total: {
        liters: cowCollection.totalLiters + buffaloCollection.totalLiters,
        amount: cowCollection.totalAmount + buffaloCollection.totalAmount,
        entries: cowCollection.totalEntries + buffaloCollection.totalEntries
      }
    },

    // Detailed date-wise and session-wise breakdown
    detailedBreakdown: detailedMilkCollection.map(item => ({
      date: item._id.date,
      session: item._id.session,
      cow: {
        liters: item.cowLiters,
        amount: item.cowAmount
      },
      buffalo: {
        liters: item.buffaloLiters,
        amount: item.buffaloAmount
      },
      total: {
        liters: item.cowLiters + item.buffaloLiters,
        amount: item.totalAmount
      },
      entries: item.entries,
      farmerCount: item.farmers.length,
      farmerNames: item.farmerNames
    })),
    
    // Sales
    sales: {
      cow: {
        liters: cowSaleData.totalLiters,
        amount: cowSaleData.totalAmount
      },
      buffalo: {
        liters: buffaloSaleData.totalLiters,
        amount: buffaloSaleData.totalAmount
      },
      total: {
        liters: cowSaleData.totalLiters + buffaloSaleData.totalLiters,
        amount: cowSaleData.totalAmount + buffaloSaleData.totalAmount
      }
    },

    // Transport
    transport: {
      cow: {
        liters: yesterdayTransport?.cowMilkTransported || 0,
        amount: yesterdayTransport?.cowTransportAmount || 0
      },
      buffalo: {
        liters: yesterdayTransport?.buffaloMilkTransported || 0,
        amount: yesterdayTransport?.buffaloTransportAmount || 0
      },
      total: {
        liters: (yesterdayTransport?.cowMilkTransported || 0) + (yesterdayTransport?.buffaloMilkTransported || 0),
        amount: (yesterdayTransport?.cowTransportAmount || 0) + (yesterdayTransport?.buffaloTransportAmount || 0)
      }
    },

    // Active participants
    activeParticipants: {
      farmers: activeFarmersYesterday.length,
      buyers: activeBuyersYesterday.length
    },

    // Period info
    periodInfo: {
      date: yesterdayDateString,
      periodType: 'yesterday'
    }
  };

  res.json({
    success: true,
    data: reportData,
    message: "Yesterday's reports retrieved successfully"
  });
});

// Get current month's reports with cow/buffalo separation
export const getCurrentMonthReports = asyncHandler(async (req, res) => {
  // Calculate current month's date range
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  const startDateString = startOfMonth.toISOString().split('T')[0];
  const endDateString = endOfMonth.toISOString().split('T')[0];

  // Get detailed date-wise and session-wise milk collection data for current month
  const detailedMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDateString, $lte: endDateString },
        $or: [
          { "cow.quantity": { $gt: 0 } },
          { "buffalo.quantity": { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: {
          date: "$date",
          session: "$session"
        },
        cowLiters: { $sum: "$cow.quantity" },
        cowAmount: { $sum: "$cow.amount" },
        buffaloLiters: { $sum: "$buffalo.quantity" },
        buffaloAmount: { $sum: "$buffalo.amount" },
        totalAmount: { $sum: "$totalAmount" },
        entries: { $sum: 1 },
        farmers: { $addToSet: "$farmer" },
        farmerNames: { $addToSet: "$farmerName" }
      }
    },
    {
      $sort: { "_id.date": 1, "_id.session": 1 }
    }
  ]);

  // Get current month's milk collection by type
  const cowMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDateString, $lte: endDateString },
        "cow.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$cow.quantity" },
        totalAmount: { $sum: "$cow.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  const buffaloMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDateString, $lte: endDateString },
        "buffalo.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$buffalo.quantity" },
        totalAmount: { $sum: "$buffalo.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  // Get current month's sales (deliveries) by type
  const cowSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfMonth, $lte: endOfMonth },
        milkType: "cow",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  const buffaloSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfMonth, $lte: endOfMonth },
        milkType: "buffalo",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  // Get current month's transport data (aggregate all transport entries)
  const monthlyTransport = await Transport.aggregate([
    {
      $match: {
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        cowMilkTransported: { $sum: "$cowMilkTransported" },
        cowTransportAmount: { $sum: "$cowTransportAmount" },
        buffaloMilkTransported: { $sum: "$buffaloMilkTransported" },
        buffaloTransportAmount: { $sum: "$buffaloTransportAmount" }
      }
    }
  ]);

  // Count active farmers and buyers this month
  const activeFarmersMonth = await MilkEntry.distinct("farmer", {
    date: { $gte: startDateString, $lte: endDateString },
    $or: [
      { "cow.quantity": { $gt: 0 } },
      { "buffalo.quantity": { $gt: 0 } }
    ]
  });

  const activeBuyersMonth = await Delivery.distinct("buyer", {
    deliveryDate: { $gte: startOfMonth, $lte: endOfMonth },
    status: { $in: ["Approved", "Completed"] }
  });

  // Format response data
  const cowCollection = cowMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const buffaloCollection = buffaloMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const cowSaleData = cowSales[0] || { totalLiters: 0, totalAmount: 0, totalOrders: 0, buyerCount: [] };
  const buffaloSaleData = buffaloSales[0] || { totalLiters: 0, totalAmount: 0, totalOrders: 0, buyerCount: [] };
  const transportData = monthlyTransport[0] || { cowMilkTransported: 0, cowTransportAmount: 0, buffaloMilkTransported: 0, buffaloTransportAmount: 0 };

  const reportData = {
    // Milk Collection Summary
    milkCollection: {
      cow: {
        liters: cowCollection.totalLiters,
        amount: cowCollection.totalAmount,
        entries: cowCollection.totalEntries
      },
      buffalo: {
        liters: buffaloCollection.totalLiters,
        amount: buffaloCollection.totalAmount,
        entries: buffaloCollection.totalEntries
      },
      total: {
        liters: cowCollection.totalLiters + buffaloCollection.totalLiters,
        amount: cowCollection.totalAmount + buffaloCollection.totalAmount,
        entries: cowCollection.totalEntries + buffaloCollection.totalEntries
      }
    },

    // Detailed date-wise and session-wise breakdown
    detailedBreakdown: detailedMilkCollection.map(item => ({
      date: item._id.date,
      session: item._id.session,
      cow: {
        liters: item.cowLiters,
        amount: item.cowAmount
      },
      buffalo: {
        liters: item.buffaloLiters,
        amount: item.buffaloAmount
      },
      total: {
        liters: item.cowLiters + item.buffaloLiters,
        amount: item.totalAmount
      },
      entries: item.entries,
      farmerCount: item.farmers.length,
      farmerNames: item.farmerNames
    })),
    
    // Sales
    sales: {
      cow: {
        liters: cowSaleData.totalLiters,
        amount: cowSaleData.totalAmount,
        orders: cowSaleData.totalOrders
      },
      buffalo: {
        liters: buffaloSaleData.totalLiters,
        amount: buffaloSaleData.totalAmount,
        orders: buffaloSaleData.totalOrders
      },
      total: {
        liters: cowSaleData.totalLiters + buffaloSaleData.totalLiters,
        amount: cowSaleData.totalAmount + buffaloSaleData.totalAmount,
        orders: cowSaleData.totalOrders + buffaloSaleData.totalOrders
      }
    },

    // Transport
    transport: {
      cow: {
        liters: transportData.cowMilkTransported || 0,
        amount: transportData.cowTransportAmount || 0
      },
      buffalo: {
        liters: transportData.buffaloMilkTransported || 0,
        amount: transportData.buffaloTransportAmount || 0
      },
      total: {
        liters: (transportData.cowMilkTransported || 0) + (transportData.buffaloMilkTransported || 0),
        amount: (transportData.cowTransportAmount || 0) + (transportData.buffaloTransportAmount || 0)
      }
    },

    // Active participants
    activeParticipants: {
      farmers: activeFarmersMonth.length,
      buyers: activeBuyersMonth.length
    },

    // Month info
    monthInfo: {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      monthName: today.toLocaleString('default', { month: 'long' }),
      totalDays: endOfMonth.getDate(),
      periodType: 'current_month'
    }
  };

  res.json({
    success: true,
    data: reportData,
    message: "Current month's reports retrieved successfully"
  });
});

// Get previous month's reports with cow/buffalo separation
export const getPreviousMonthReports = asyncHandler(async (req, res) => {
  // Calculate previous month's date range
  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const startOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
  const endOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 23, 59, 59, 999);
  const startDateString = startOfPreviousMonth.toISOString().split('T')[0];
  const endDateString = endOfPreviousMonth.toISOString().split('T')[0];

  // Get detailed date-wise and session-wise milk collection data for previous month
  const detailedMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDateString, $lte: endDateString },
        $or: [
          { "cow.quantity": { $gt: 0 } },
          { "buffalo.quantity": { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: {
          date: "$date",
          session: "$session"
        },
        cowLiters: { $sum: "$cow.quantity" },
        cowAmount: { $sum: "$cow.amount" },
        buffaloLiters: { $sum: "$buffalo.quantity" },
        buffaloAmount: { $sum: "$buffalo.amount" },
        totalAmount: { $sum: "$totalAmount" },
        entries: { $sum: 1 },
        farmers: { $addToSet: "$farmer" },
        farmerNames: { $addToSet: "$farmerName" }
      }
    },
    {
      $sort: { "_id.date": 1, "_id.session": 1 }
    }
  ]);

  // Get previous month's milk collection by type
  const cowMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDateString, $lte: endDateString },
        "cow.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$cow.quantity" },
        totalAmount: { $sum: "$cow.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  const buffaloMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDateString, $lte: endDateString },
        "buffalo.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$buffalo.quantity" },
        totalAmount: { $sum: "$buffalo.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  // Get previous month's sales (deliveries) by type
  const cowSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
        milkType: "cow",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  const buffaloSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
        milkType: "buffalo",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  // Get previous month's transport data (aggregate all transport entries)
  const monthlyTransport = await Transport.aggregate([
    {
      $match: {
        date: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth }
      }
    },
    {
      $group: {
        _id: null,
        cowMilkTransported: { $sum: "$cowMilkTransported" },
        cowTransportAmount: { $sum: "$cowTransportAmount" },
        buffaloMilkTransported: { $sum: "$buffaloMilkTransported" },
        buffaloTransportAmount: { $sum: "$buffaloTransportAmount" }
      }
    }
  ]);

  // Count active farmers and buyers previous month
  const activeFarmersPreviousMonth = await MilkEntry.distinct("farmer", {
    date: { $gte: startDateString, $lte: endDateString },
    $or: [
      { "cow.quantity": { $gt: 0 } },
      { "buffalo.quantity": { $gt: 0 } }
    ]
  });

  const activeBuyersPreviousMonth = await Delivery.distinct("buyer", {
    deliveryDate: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
    status: { $in: ["Approved", "Completed"] }
  });

  // Format response data
  const cowCollection = cowMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const buffaloCollection = buffaloMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const cowSaleData = cowSales[0] || { totalLiters: 0, totalAmount: 0, totalOrders: 0, buyerCount: [] };
  const buffaloSaleData = buffaloSales[0] || { totalLiters: 0, totalAmount: 0, totalOrders: 0, buyerCount: [] };
  const transportData = monthlyTransport[0] || { cowMilkTransported: 0, cowTransportAmount: 0, buffaloMilkTransported: 0, buffaloTransportAmount: 0 };

  const reportData = {
    // Milk Collection Summary
    milkCollection: {
      cow: {
        liters: cowCollection.totalLiters,
        amount: cowCollection.totalAmount,
        entries: cowCollection.totalEntries
      },
      buffalo: {
        liters: buffaloCollection.totalLiters,
        amount: buffaloCollection.totalAmount,
        entries: buffaloCollection.totalEntries
      },
      total: {
        liters: cowCollection.totalLiters + buffaloCollection.totalLiters,
        amount: cowCollection.totalAmount + buffaloCollection.totalAmount,
        entries: cowCollection.totalEntries + buffaloCollection.totalEntries
      }
    },

    // Detailed date-wise and session-wise breakdown
    detailedBreakdown: detailedMilkCollection.map(item => ({
      date: item._id.date,
      session: item._id.session,
      cow: {
        liters: item.cowLiters,
        amount: item.cowAmount
      },
      buffalo: {
        liters: item.buffaloLiters,
        amount: item.buffaloAmount
      },
      total: {
        liters: item.cowLiters + item.buffaloLiters,
        amount: item.totalAmount
      },
      entries: item.entries,
      farmerCount: item.farmers.length,
      farmerNames: item.farmerNames
    })),
    
    // Sales
    sales: {
      cow: {
        liters: cowSaleData.totalLiters,
        amount: cowSaleData.totalAmount,
        orders: cowSaleData.totalOrders
      },
      buffalo: {
        liters: buffaloSaleData.totalLiters,
        amount: buffaloSaleData.totalAmount,
        orders: buffaloSaleData.totalOrders
      },
      total: {
        liters: cowSaleData.totalLiters + buffaloSaleData.totalLiters,
        amount: cowSaleData.totalAmount + buffaloSaleData.totalAmount,
        orders: cowSaleData.totalOrders + buffaloSaleData.totalOrders
      }
    },

    // Transport
    transport: {
      cow: {
        liters: transportData.cowMilkTransported || 0,
        amount: transportData.cowTransportAmount || 0
      },
      buffalo: {
        liters: transportData.buffaloMilkTransported || 0,
        amount: transportData.buffaloTransportAmount || 0
      },
      total: {
        liters: (transportData.cowMilkTransported || 0) + (transportData.buffaloMilkTransported || 0),
        amount: (transportData.cowTransportAmount || 0) + (transportData.buffaloTransportAmount || 0)
      }
    },

    // Active participants
    activeParticipants: {
      farmers: activeFarmersPreviousMonth.length,
      buyers: activeBuyersPreviousMonth.length
    },

    // Month info
    monthInfo: {
      year: previousMonth.getFullYear(),
      month: previousMonth.getMonth() + 1,
      monthName: previousMonth.toLocaleString('default', { month: 'long' }),
      totalDays: endOfPreviousMonth.getDate(),
      periodType: 'previous_month'
    }
  };

  res.json({
    success: true,
    data: reportData,
    message: "Previous month's reports retrieved successfully"
  });
});

// Get custom date range reports with cow/buffalo separation
export const getCustomDateReports = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_DATE_RANGE",
        message: "Both startDate and endDate are required"
      }
    });
  }

  // Validate date format and range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_FORMAT",
        message: "Invalid date format. Use YYYY-MM-DD format"
      }
    });
  }

  if (start > end) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DATE_RANGE",
        message: "Start date must be before or equal to end date"
      }
    });
  }

  // Set time boundaries for the date range
  const startOfPeriod = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endOfPeriod = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);

  // Get detailed date-wise and session-wise milk collection data
  const detailedMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        $or: [
          { "cow.quantity": { $gt: 0 } },
          { "buffalo.quantity": { $gt: 0 } }
        ]
      }
    },
    {
      $group: {
        _id: {
          date: "$date",
          session: "$session"
        },
        cowLiters: { $sum: "$cow.quantity" },
        cowAmount: { $sum: "$cow.amount" },
        buffaloLiters: { $sum: "$buffalo.quantity" },
        buffaloAmount: { $sum: "$buffalo.amount" },
        totalAmount: { $sum: "$totalAmount" },
        entries: { $sum: 1 },
        farmers: { $addToSet: "$farmer" },
        farmerNames: { $addToSet: "$farmerName" }
      }
    },
    {
      $sort: { "_id.date": 1, "_id.session": 1 }
    }
  ]);

  // Get summary totals for cow and buffalo
  const cowMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        "cow.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$cow.quantity" },
        totalAmount: { $sum: "$cow.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  const buffaloMilkCollection = await MilkEntry.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        "buffalo.quantity": { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$buffalo.quantity" },
        totalAmount: { $sum: "$buffalo.amount" },
        totalEntries: { $sum: 1 },
        farmerCount: { $addToSet: "$farmer" }
      }
    }
  ]);

  // Get custom period's sales (deliveries) by type
  const cowSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfPeriod, $lte: endOfPeriod },
        milkType: "cow",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  const buffaloSales = await Delivery.aggregate([
    {
      $match: {
        deliveryDate: { $gte: startOfPeriod, $lte: endOfPeriod },
        milkType: "buffalo",
        status: { $in: ["Approved", "Completed"] }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        buyerCount: { $addToSet: "$buyer" }
      }
    }
  ]);

  // Get custom period's transport data (aggregate all transport entries)
  const customTransport = await Transport.aggregate([
    {
      $match: {
        date: { $gte: startOfPeriod, $lte: endOfPeriod }
      }
    },
    {
      $group: {
        _id: null,
        cowMilkTransported: { $sum: "$cowMilkTransported" },
        cowTransportAmount: { $sum: "$cowTransportAmount" },
        buffaloMilkTransported: { $sum: "$buffaloMilkTransported" },
        buffaloTransportAmount: { $sum: "$buffaloTransportAmount" }
      }
    }
  ]);

  // Count active farmers and buyers in custom period
  const activeFarmersCustom = await MilkEntry.distinct("farmer", {
    date: { $gte: startDate, $lte: endDate },
    $or: [
      { "cow.quantity": { $gt: 0 } },
      { "buffalo.quantity": { $gt: 0 } }
    ]
  });

  const activeBuyersCustom = await Delivery.distinct("buyer", {
    deliveryDate: { $gte: startOfPeriod, $lte: endOfPeriod },
    status: { $in: ["Approved", "Completed"] }
  });

  // Format response data
  const cowCollection = cowMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const buffaloCollection = buffaloMilkCollection[0] || { totalLiters: 0, totalAmount: 0, totalEntries: 0, farmerCount: [] };
  const cowSaleData = cowSales[0] || { totalLiters: 0, totalAmount: 0, totalOrders: 0, buyerCount: [] };
  const buffaloSaleData = buffaloSales[0] || { totalLiters: 0, totalAmount: 0, totalOrders: 0, buyerCount: [] };
  const transportData = customTransport[0] || { cowMilkTransported: 0, cowTransportAmount: 0, buffaloMilkTransported: 0, buffaloTransportAmount: 0 };

  // Calculate period duration
  const periodDays = Math.ceil((endOfPeriod - startOfPeriod) / (1000 * 60 * 60 * 24)) + 1;

  const reportData = {
    // Milk Collection Summary
    milkCollection: {
      cow: {
        liters: cowCollection.totalLiters,
        amount: cowCollection.totalAmount,
        entries: cowCollection.totalEntries
      },
      buffalo: {
        liters: buffaloCollection.totalLiters,
        amount: buffaloCollection.totalAmount,
        entries: buffaloCollection.totalEntries
      },
      total: {
        liters: cowCollection.totalLiters + buffaloCollection.totalLiters,
        amount: cowCollection.totalAmount + buffaloCollection.totalAmount,
        entries: cowCollection.totalEntries + buffaloCollection.totalEntries
      }
    },

    // Detailed date-wise and session-wise breakdown
    detailedBreakdown: detailedMilkCollection.map(item => ({
      date: item._id.date,
      session: item._id.session,
      cow: {
        liters: item.cowLiters,
        amount: item.cowAmount
      },
      buffalo: {
        liters: item.buffaloLiters,
        amount: item.buffaloAmount
      },
      total: {
        liters: item.cowLiters + item.buffaloLiters,
        amount: item.totalAmount
      },
      entries: item.entries,
      farmerCount: item.farmers.length,
      farmerNames: item.farmerNames
    })),
    
    // Sales
    sales: {
      cow: {
        liters: cowSaleData.totalLiters,
        amount: cowSaleData.totalAmount,
        orders: cowSaleData.totalOrders
      },
      buffalo: {
        liters: buffaloSaleData.totalLiters,
        amount: buffaloSaleData.totalAmount,
        orders: buffaloSaleData.totalOrders
      },
      total: {
        liters: cowSaleData.totalLiters + buffaloSaleData.totalLiters,
        amount: cowSaleData.totalAmount + buffaloSaleData.totalAmount,
        orders: cowSaleData.totalOrders + buffaloSaleData.totalOrders
      }
    },

    // Transport
    transport: {
      cow: {
        liters: transportData.cowMilkTransported || 0,
        amount: transportData.cowTransportAmount || 0
      },
      buffalo: {
        liters: transportData.buffaloMilkTransported || 0,
        amount: transportData.buffaloTransportAmount || 0
      },
      total: {
        liters: (transportData.cowMilkTransported || 0) + (transportData.buffaloMilkTransported || 0),
        amount: (transportData.cowTransportAmount || 0) + (transportData.buffaloTransportAmount || 0)
      }
    },

    // Active participants
    activeParticipants: {
      farmers: activeFarmersCustom.length,
      buyers: activeBuyersCustom.length
    },

    // Period info
    periodInfo: {
      startDate,
      endDate,
      totalDays: periodDays,
      periodType: 'custom'
    }
  };

  res.json({
    success: true,
    data: reportData,
    message: `Custom period reports (${startDate} to ${endDate}) retrieved successfully`
  });
});
export const getDairyInfo = asyncHandler(async (req, res) => {
  let dairyInfo = await DairyInfo.findOne({});
  
  if (!dairyInfo) {
    // Return null if no dairy info exists - no default values
    return res.json({
      success: true,
      data: null,
      message: "No dairy information found. Please add dairy information."
    });
  }

  res.json({
    success: true,
    data: dairyInfo,
    message: "Dairy information retrieved successfully"
  });
});

// Get landing page statistics
export const getLandingStats = asyncHandler(async (req, res) => {
  try {
    // Get total counts with role-specific activity metrics
    const totalFarmers = await User.countDocuments({ role: "farmer", approved: true });
    const totalBuyers = await User.countDocuments({ role: "buyer", approved: true });
    const totalEmployees = await User.countDocuments({ role: "employee", approved: true, isActive: true });
    const totalLoanFeedManagers = await User.countDocuments({ role: "employee", approved: true, isActive: true, specialization: { $in: ["loan", "feed"] } });

    // Get pending approvals by role
    const pendingApprovals = await User.aggregate([
      {
        $match: {
          approved: false,
          isVerified: true
        }
      },
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      }
    ]);

    // Get animal statistics with health status
    const animalStats = await Animal.aggregate([
      {
        $group: {
          _id: { type: "$animalType", health: "$healthStatus" },
          count: { $sum: 1 },
          avgMilkCapacity: { $avg: "$milkCapacity" }
        }
      }
    ]);

    const cowCount = animalStats.filter(stat => stat._id.type === "cow").reduce((sum, stat) => sum + stat.count, 0);
    const buffaloCount = animalStats.filter(stat => stat._id.type === "buffalo").reduce((sum, stat) => sum + stat.count, 0);
    
    // Health status breakdown
    const healthStats = animalStats.reduce((acc, stat) => {
      const health = stat._id.health || 'unknown';
      acc[health] = (acc[health] || 0) + stat.count;
      return acc;
    }, {});

    // Calculate date ranges
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get comprehensive milk collection statistics
    const milkCollectionStats = await MilkEntry.aggregate([
      {
        $facet: {
          monthly: [
            {
              $match: {
                date: { 
                  $gte: startOfMonth.toISOString().split('T')[0], 
                  $lte: endOfMonth.toISOString().split('T')[0] 
                }
              }
            },
            {
              $group: {
                _id: "$milkType",
                totalLiters: { $sum: { $add: ["$cow.quantity", "$buffalo.quantity"] } },
                totalAmount: { $sum: "$totalAmount" },
                entryCount: { $sum: 1 },
                avgFat: { $avg: "$fat" },
                uniqueFarmers: { $addToSet: "$farmer" }
              }
            }
          ],
          yearly: [
            {
              $match: {
                date: { 
                  $gte: startOfYear.toISOString().split('T')[0], 
                  $lte: today.toISOString().split('T')[0] 
                }
              }
            },
            {
              $group: {
                _id: null,
                totalLiters: { $sum: { $add: ["$cow.quantity", "$buffalo.quantity"] } },
                totalAmount: { $sum: "$totalAmount" },
                entryCount: { $sum: 1 }
              }
            }
          ],
          trends: [
            {
              $match: {
                date: { 
                  $gte: last30Days.toISOString().split('T')[0], 
                  $lte: today.toISOString().split('T')[0] 
                }
              }
            },
            {
              $group: {
                _id: "$date",
                dailyLiters: { $sum: { $add: ["$cow.quantity", "$buffalo.quantity"] } },
                dailyAmount: { $sum: "$totalAmount" }
              }
            },
            { $sort: { "_id": 1 } },
            { $limit: 7 } // Last 7 days
          ]
        }
      }
    ]);

    // Get delivery statistics with status breakdown
    const deliveryStats = await Delivery.aggregate([
      {
        $facet: {
          monthly: [
            {
              $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
              }
            },
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalLiters: { $sum: "$quantity" },
                totalAmount: { $sum: "$totalAmount" }
              }
            }
          ],
          performance: [
            {
              $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                status: { $in: ["Completed", "Delivered"] }
              }
            },
            {
              $group: {
                _id: null,
                avgDeliveryTime: { $avg: { $subtract: ["$deliveredAt", "$createdAt"] } },
                onTimeDeliveries: { $sum: { $cond: [{ $lte: [{ $subtract: ["$deliveredAt", "$deliveryDate"] }, 0] }, 1, 0] } },
                totalDeliveries: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Get loan statistics
    const loanStats = await Loan.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Get feed statistics
    const feedStats = await FeedStock.aggregate([
      {
        $group: {
          _id: "$feedType",
          totalStock: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$pricePerUnit"] } }
        }
      }
    ]);

    // Get system performance metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      lastUpdated: new Date()
    };

    // Get module usage statistics (based on user roles and activities)
    const moduleUsage = {
      milkCollection: {
        activeUsers: totalFarmers,
        dailyEntries: milkCollectionStats[0].monthly.reduce((sum, stat) => sum + stat.entryCount, 0) / 30,
        adoption: totalFarmers > 0 ? (milkCollectionStats[0].monthly.reduce((sum, stat) => sum + stat.uniqueFarmers.length, 0) / totalFarmers * 100) : 0
      },
      deliveryManagement: {
        activeUsers: totalBuyers,
        monthlyOrders: deliveryStats[0].monthly.reduce((sum, stat) => sum + stat.count, 0),
        adoption: totalBuyers > 0 ? 85 : 0 // Estimated based on active buyers
      },
      userManagement: {
        totalUsers: totalFarmers + totalBuyers + totalEmployees,
        pendingApprovals: pendingApprovals.reduce((sum, stat) => sum + stat.count, 0),
        approvalRate: 95 // Estimated
      },
      animalManagement: {
        totalAnimals: cowCount + buffaloCount,
        healthyAnimals: healthStats.healthy || 0,
        healthRate: (healthStats.healthy || 0) / (cowCount + buffaloCount) * 100 || 0
      }
    };

    // Process milk collection data
    const monthlyMilk = milkCollectionStats[0].monthly;
    const cowMilk = monthlyMilk.find(milk => milk._id === "cow") || { totalLiters: 0, totalAmount: 0, entryCount: 0, uniqueFarmers: [] };
    const buffaloMilk = monthlyMilk.find(milk => milk._id === "buffalo") || { totalLiters: 0, totalAmount: 0, entryCount: 0, uniqueFarmers: [] };

    // Process delivery data
    const monthlyDeliveries = deliveryStats[0].monthly;
    const completedDeliveries = monthlyDeliveries.filter(d => ["Completed", "Delivered"].includes(d._id));
    const totalDeliveryStats = completedDeliveries.reduce((acc, stat) => ({
      count: acc.count + stat.count,
      liters: acc.liters + stat.totalLiters,
      amount: acc.amount + stat.totalAmount
    }), { count: 0, liters: 0, amount: 0 });

    // Get dairy info
    const dairyInfo = await DairyInfo.findOne({});

    // Calculate comprehensive revenue
    const totalRevenue = cowMilk.totalAmount + buffaloMilk.totalAmount + totalDeliveryStats.amount;
    const yearlyRevenue = milkCollectionStats[0].yearly[0]?.totalAmount || 0;

    const stats = {
      // Enhanced user statistics with role-specific metrics
      users: {
        farmers: {
          total: totalFarmers,
          active: cowMilk.uniqueFarmers.length + buffaloMilk.uniqueFarmers.length,
          pending: pendingApprovals.find(p => p._id === "farmer")?.count || 0
        },
        buyers: {
          total: totalBuyers,
          active: Math.floor(totalBuyers * 0.8), // Estimated active buyers
          pending: pendingApprovals.find(p => p._id === "buyer")?.count || 0
        },
        employees: {
          total: totalEmployees,
          active: totalEmployees,
          pending: pendingApprovals.find(p => p._id === "employee")?.count || 0
        },
        loanFeedManagers: {
          total: totalLoanFeedManagers,
          active: totalLoanFeedManagers
        },
        total: totalFarmers + totalBuyers + totalEmployees,
        growth: {
          monthly: 12, // Estimated monthly growth percentage
          yearly: 45   // Estimated yearly growth percentage
        }
      },

      // Enhanced animal statistics with health breakdown
      animals: {
        cows: cowCount,
        buffaloes: buffaloCount,
        total: cowCount + buffaloCount,
        health: {
          healthy: healthStats.healthy || 0,
          sick: healthStats.sick || 0,
          pregnant: healthStats.pregnant || 0,
          dry: healthStats.dry || 0
        },
        productivity: {
          avgMilkCapacity: animalStats.reduce((sum, stat) => sum + (stat.avgMilkCapacity || 0), 0) / animalStats.length || 0,
          healthRate: (healthStats.healthy || 0) / (cowCount + buffaloCount) * 100 || 0
        }
      },

      // Enhanced milk collection with trends
      milkCollection: {
        monthly: {
          cow: {
            liters: cowMilk.totalLiters,
            amount: cowMilk.totalAmount,
            entries: cowMilk.entryCount,
            farmers: cowMilk.uniqueFarmers.length
          },
          buffalo: {
            liters: buffaloMilk.totalLiters,
            amount: buffaloMilk.totalAmount,
            entries: buffaloMilk.entryCount,
            farmers: buffaloMilk.uniqueFarmers.length
          },
          total: {
            liters: cowMilk.totalLiters + buffaloMilk.totalLiters,
            amount: cowMilk.totalAmount + buffaloMilk.totalAmount,
            entries: cowMilk.entryCount + buffaloMilk.entryCount,
            farmers: [...new Set([...cowMilk.uniqueFarmers, ...buffaloMilk.uniqueFarmers])].length
          }
        },
        yearly: milkCollectionStats[0].yearly[0] || { totalLiters: 0, totalAmount: 0, entryCount: 0 },
        trends: milkCollectionStats[0].trends || []
      },

      // Enhanced delivery statistics with performance metrics
      deliveries: {
        monthly: {
          total: totalDeliveryStats.count,
          liters: totalDeliveryStats.liters,
          amount: totalDeliveryStats.amount,
          byStatus: monthlyDeliveries.reduce((acc, stat) => {
            acc[stat._id.toLowerCase()] = stat.count;
            return acc;
          }, {})
        },
        performance: deliveryStats[0].performance[0] || {
          avgDeliveryTime: 0,
          onTimeDeliveries: 0,
          totalDeliveries: 0,
          onTimeRate: 0
        }
      },

      // Loan management statistics
      loans: {
        byStatus: loanStats.reduce((acc, stat) => {
          acc[stat._id] = { count: stat.count, amount: stat.totalAmount };
          return acc;
        }, {}),
        totalRequested: loanStats.reduce((sum, stat) => sum + stat.totalAmount, 0),
        totalApproved: loanStats.filter(s => ["approved", "disbursed"].includes(s._id)).reduce((sum, stat) => sum + stat.totalAmount, 0)
      },

      // Feed management statistics
      feeds: {
        byType: feedStats.reduce((acc, stat) => {
          acc[stat._id] = { stock: stat.totalStock, value: stat.totalValue };
          return acc;
        }, {}),
        totalStock: feedStats.reduce((sum, stat) => sum + stat.totalStock, 0),
        totalValue: feedStats.reduce((sum, stat) => sum + stat.totalValue, 0)
      },

      // Enhanced financial overview
      revenue: {
        monthly: totalRevenue,
        yearly: yearlyRevenue,
        milkSales: cowMilk.totalAmount + buffaloMilk.totalAmount,
        deliveryRevenue: totalDeliveryStats.amount,
        growth: {
          monthlyGrowth: 15, // Estimated
          yearlyGrowth: 35   // Estimated
        },
        breakdown: {
          milkCollection: ((cowMilk.totalAmount + buffaloMilk.totalAmount) / totalRevenue * 100) || 0,
          deliveries: (totalDeliveryStats.amount / totalRevenue * 100) || 0
        }
      },

      // Module usage and adoption metrics
      modules: moduleUsage,

      // System performance metrics
      system: {
        uptime: Math.floor(systemMetrics.uptime / 3600), // Hours
        performance: {
          memoryUsage: Math.round(systemMetrics.memoryUsage.used / 1024 / 1024), // MB
          responseTime: "< 200ms", // Estimated
          availability: "99.9%"    // Estimated
        },
        version: systemMetrics.nodeVersion,
        lastUpdated: systemMetrics.lastUpdated
      },

      // Enhanced dairy information
      dairyInfo: dairyInfo ? {
        name: dairyInfo.dairyName,
        fullAddress: `${dairyInfo.area}, ${dairyInfo.place}, ${dairyInfo.taluka}, ${dairyInfo.district} - ${dairyInfo.pincode}`,
        location: `${dairyInfo.place}, ${dairyInfo.district}`,
        contact: dairyInfo.mobileNo,
        email: dairyInfo.email || null,
        morningHours: dairyInfo.morningOpenTime && dairyInfo.morningCloseTime 
          ? `${dairyInfo.morningOpenTime} - ${dairyInfo.morningCloseTime}`
          : null,
        eveningHours: dairyInfo.eveningOpenTime && dairyInfo.eveningCloseTime 
          ? `${dairyInfo.eveningOpenTime} - ${dairyInfo.eveningCloseTime}`
          : null,
        operatingHours: dairyInfo.openingTime && dairyInfo.closingTime 
          ? `${dairyInfo.openingTime} - ${dairyInfo.closingTime}`
          : null,
        timings: {
          morningOpen: dairyInfo.morningOpenTime,
          morningClose: dairyInfo.morningCloseTime,
          eveningOpen: dairyInfo.eveningOpenTime,
          eveningClose: dairyInfo.eveningCloseTime
        },
        established: dairyInfo.createdAt || null,
        capacity: {
          dailyCollection: (cowMilk.totalLiters + buffaloMilk.totalLiters) / 30 || 0,
          farmers: totalFarmers,
          animals: cowCount + buffaloCount
        }
      } : null,

      // Enhanced system features with adoption rates
      features: {
        milkCollection: { enabled: true, adoption: moduleUsage.milkCollection.adoption },
        animalManagement: { enabled: true, adoption: moduleUsage.animalManagement.healthRate },
        homeDelivery: { enabled: true, adoption: moduleUsage.deliveryManagement.adoption },
        digitalPayments: { enabled: true, adoption: 78 },
        rateManagement: { enabled: true, adoption: 95 },
        reportGeneration: { enabled: true, adoption: 65 },
        userManagement: { enabled: true, adoption: 100 },
        notifications: { enabled: true, adoption: 85 },
        loanManagement: { enabled: true, adoption: 45 },
        feedManagement: { enabled: true, adoption: 60 }
      },

      // Operational efficiency metrics
      efficiency: {
        collectionEfficiency: (moduleUsage.milkCollection.dailyEntries / totalFarmers * 100) || 0,
        deliveryEfficiency: deliveryStats[0].performance[0]?.onTimeRate || 85,
        systemUtilization: 78, // Estimated overall system utilization
        userSatisfaction: 4.2,  // Estimated rating out of 5
        costSavings: 40,        // Estimated percentage cost savings vs manual
        timeReduction: 60       // Estimated percentage time reduction
      }
    };

    res.json({
      success: true,
      data: stats,
      message: "Comprehensive landing page statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching comprehensive landing stats:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "COMPREHENSIVE_STATS_FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Advanced search and filtering with comprehensive criteria
export const advancedUserSearch = asyncHandler(async (req, res) => {
  const searchParams = {
    role: req.query.role,
    approved: req.query.approved,
    search: req.query.search,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    uniqueIdPattern: req.query.uniqueIdPattern,
    location: req.query.location,
    activityLevel: req.query.activityLevel,
    hasAnimals: req.query.hasAnimals,
    hasOrders: req.query.hasOrders,
    hasMilkEntries: req.query.hasMilkEntries
  };

  const paginationParams = {
    page: req.query.page || 1,
    limit: req.query.limit || 20,
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc'
  };

  // Validate search parameters
  const validation = SearchService.validateSearchParams(searchParams);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_SEARCH_PARAMS",
        message: "Invalid search parameters",
        details: validation.errors
      }
    });
  }

  try {
    const searchResults = await SearchService.searchUsers(searchParams, paginationParams);
    
    // Enhance users with role-specific data
    const enhancedUsers = await Promise.all(searchResults.users.map(async (user) => {
      const userData = { ...user };
      
      // Add role-specific summary data
      switch (user.role) {
        case 'farmer':
          const milkSummary = await MilkEntry.aggregate([
            { $match: { farmer: user._id } },
            {
              $group: {
                _id: null,
                totalEntries: { $sum: 1 },
                totalLiters: { $sum: "$liters" },
                totalAmount: { $sum: "$totalAmount" },
                lastEntry: { $max: "$date" }
              }
            }
          ]);
          
          const animalCount = await Animal.countDocuments({ farmer: user._id, isActive: true });
          
          userData.farmerData = {
            milkEntries: milkSummary[0] || { totalEntries: 0, totalLiters: 0, totalAmount: 0, lastEntry: null },
            animalCount
          };
          break;
          
        case 'buyer':
          const deliverySummary = await Delivery.aggregate([
            { $match: { buyer: user._id } },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalQuantity: { $sum: "$quantity" },
                totalAmount: { $sum: "$totalAmount" },
                lastOrder: { $max: "$deliveryDate" }
              }
            }
          ]);
          
          userData.buyerData = {
            orders: deliverySummary[0] || { totalOrders: 0, totalQuantity: 0, totalAmount: 0, lastOrder: null }
          };
          break;
          
        case 'employee':
          const collectionSummary = await MilkEntry.aggregate([
            { $match: { collectedBy: user._id } },
            {
              $group: {
                _id: null,
                totalCollections: { $sum: 1 },
                totalLiters: { $sum: "$liters" },
                lastCollection: { $max: "$date" }
              }
            }
          ]);
          
          userData.employeeData = {
            collections: collectionSummary[0] || { totalCollections: 0, totalLiters: 0, lastCollection: null }
          };
          break;
      }
      
      return userData;
    }));

    res.json({
      success: true,
      data: {
        users: enhancedUsers,
        pagination: searchResults.pagination,
        searchMetadata: searchResults.searchMetadata
      },
      message: "Advanced search completed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "SEARCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get search suggestions for autocomplete
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { query, field = 'username', limit = 10 } = req.query;

  if (!query || query.trim().length < 2) {
    return res.json({
      success: true,
      data: [],
      message: "Query too short for suggestions"
    });
  }

  try {
    const suggestions = await SearchService.getSearchSuggestions(query, field, limit);
    
    res.json({
      success: true,
      data: suggestions,
      message: "Search suggestions retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "SUGGESTIONS_FAILED",
        message: error.message
      }
    });
  }
});

// Get search analytics and statistics
export const getSearchAnalytics = asyncHandler(async (req, res) => {
  const searchParams = {
    role: req.query.role,
    approved: req.query.approved,
    search: req.query.search,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
    uniqueIdPattern: req.query.uniqueIdPattern,
    location: req.query.location,
    activityLevel: req.query.activityLevel,
    hasAnimals: req.query.hasAnimals,
    hasOrders: req.query.hasOrders,
    hasMilkEntries: req.query.hasMilkEntries
  };

  try {
    const analytics = await SearchService.getSearchAnalytics(searchParams);
    
    res.json({
      success: true,
      data: analytics,
      message: "Search analytics retrieved successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "ANALYTICS_FAILED",
        message: error.message
      }
    });
  }
});

// Reset search filters
export const resetSearchFilters = asyncHandler(async (req, res) => {
  const resetFilters = SearchService.resetFilters();
  
  res.json({
    success: true,
    data: resetFilters,
    message: "Search filters reset successfully"
  });
});

// Update dairy information
export const updateDairyInfo = asyncHandler(async (req, res) => {
  const { 
    dairyName, district, taluka, post, pincode, place, area, mobileNo, email, 
    morningOpenTime, morningCloseTime, eveningOpenTime, eveningCloseTime,
    openingTime, closingTime 
  } = req.body;

  if (!dairyName || !district || !taluka || !post || !pincode || !place || !area || !mobileNo) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "All fields are required: dairyName, district, taluka, post, pincode, place, area, mobileNo"
      }
    });
  }

  if (!/^\d{10}$/.test(mobileNo)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_MOBILE",
        message: "Mobile number must be exactly 10 digits"
      }
    });
  }

  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PINCODE",
        message: "Pincode must be exactly 6 digits"
      }
    });
  }

  // Validate email if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_EMAIL",
        message: "Please enter a valid email address"
      }
    });
  }

  const updateData = { 
    dairyName, 
    district, 
    taluka, 
    post, 
    pincode, 
    place, 
    area, 
    mobileNo 
  };

  // Add email if provided
  if (email) updateData.email = email;
  
  // Add morning and evening times if provided
  if (morningOpenTime) updateData.morningOpenTime = morningOpenTime;
  if (morningCloseTime) updateData.morningCloseTime = morningCloseTime;
  if (eveningOpenTime) updateData.eveningOpenTime = eveningOpenTime;
  if (eveningCloseTime) updateData.eveningCloseTime = eveningCloseTime;
  
  // Keep backward compatibility with old time fields
  if (openingTime) updateData.openingTime = openingTime;
  if (closingTime) updateData.closingTime = closingTime;

  const dairyInfo = await DairyInfo.findOneAndUpdate(
    {},
    updateData,
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    data: dairyInfo,
    message: "Dairy information updated successfully"
  });
});
// Get selling rates for online buyers
export const getSellingRates = asyncHandler(async (req, res) => {
  try {
    // Try to get selling rates from DairyInfo or create a separate collection
    let dairyInfo = await DairyInfo.findOne({});
    
    const defaultRates = {
      cowMilk: {
        rate: "0.00",
        description: "Fresh cow milk with high nutritional value"
      },
      buffaloMilk: {
        rate: "0.00", 
        description: "Rich buffalo milk with higher fat content"
      }
    };

    // Get existing rates and exclude mixed milk
    let sellingRates = dairyInfo?.sellingRates || defaultRates;
    
    // Remove mixed milk from response if it exists
    if (sellingRates.mixedMilk) {
      const { mixedMilk, ...ratesWithoutMixed } = sellingRates;
      sellingRates = ratesWithoutMixed;
    }

    res.json({
      success: true,
      data: sellingRates,
      message: "Selling rates retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching selling rates:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch selling rates"
      }
    });
  }
});

// Update selling rates for online buyers
export const updateSellingRates = asyncHandler(async (req, res) => {
  const { cowMilk, buffaloMilk } = req.body;

  // Validate input - only cow and buffalo milk required
  if (!cowMilk || !buffaloMilk) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_RATES",
        message: "Both cow and buffalo milk rates are required"
      }
    });
  }

  // Validate rate values
  const validateRate = (rate, type) => {
    if (!rate.rate || parseFloat(rate.rate) < 0) {
      throw new Error(`Invalid rate for ${type} milk`);
    }
  };

  try {
    validateRate(cowMilk, "cow");
    validateRate(buffaloMilk, "buffalo");
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_RATE",
        message: error.message
      }
    });
  }

  const sellingRates = {
    cowMilk: {
      rate: parseFloat(cowMilk.rate).toFixed(2),
      description: cowMilk.description || "Fresh cow milk with high nutritional value"
    },
    buffaloMilk: {
      rate: parseFloat(buffaloMilk.rate).toFixed(2),
      description: buffaloMilk.description || "Rich buffalo milk with higher fat content"
    }
  };

  // Get current dairy info to preserve existing rate history
  let dairyInfo = await DairyInfo.findOne({});
  
  // Check if any rates are being updated (individual or full update)
  let ratesChanged = false;
  let isFullUpdate = false;
  
  if (dairyInfo && dairyInfo.sellingRates) {
    const currentRates = dairyInfo.sellingRates;
    ratesChanged = (
      currentRates.cowMilk.rate !== sellingRates.cowMilk.rate ||
      currentRates.buffaloMilk.rate !== sellingRates.buffaloMilk.rate
    );

    // Check if this is a full update (both rates have valid values)
    isFullUpdate = (
      parseFloat(sellingRates.cowMilk.rate) > 0 &&
      parseFloat(sellingRates.buffaloMilk.rate) > 0
    );
  } else {
    // First time setting rates
    ratesChanged = true;
    isFullUpdate = (
      parseFloat(sellingRates.cowMilk.rate) > 0 &&
      parseFloat(sellingRates.buffaloMilk.rate) > 0
    );
  }

  if (ratesChanged && dairyInfo && dairyInfo.sellingRates) {
    // Add current rates to history before updating (exclude mixed milk)
    const historyEntry = {
      cowMilk: {
        rate: dairyInfo.sellingRates.cowMilk.rate,
        description: dairyInfo.sellingRates.cowMilk.description
      },
      buffaloMilk: {
        rate: dairyInfo.sellingRates.buffaloMilk.rate,
        description: dairyInfo.sellingRates.buffaloMilk.description
      },
      savedAt: new Date(),
      savedBy: "admin"
    };

    // Initialize rateHistory if it doesn't exist
    if (!dairyInfo.rateHistory) {
      dairyInfo.rateHistory = [];
    }

    // Add to history (keep last 10 entries)
    dairyInfo.rateHistory.unshift(historyEntry);
    if (dairyInfo.rateHistory.length > 10) {
      dairyInfo.rateHistory = dairyInfo.rateHistory.slice(0, 10);
    }
  }

  // Update or create dairy info with selling rates
  dairyInfo = await DairyInfo.findOneAndUpdate(
    {},
    { 
      sellingRates,
      ...(ratesChanged && dairyInfo && dairyInfo.rateHistory ? { rateHistory: dairyInfo.rateHistory } : {})
    },
    { upsert: true, new: true }
  );

  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  res.json({
    success: true,
    data: {
      sellingRates,
      savedAt: currentDate,
      isFullUpdate
    },
    message: isFullUpdate 
      ? `All selling rates saved successfully on ${currentDate}!`
      : "Selling rates updated successfully"
  });
});

// Get selling rates history
export const getSellingRatesHistory = asyncHandler(async (req, res) => {
  try {
    const dairyInfo = await DairyInfo.findOne({});
    
    let history = dairyInfo?.rateHistory || [];
    
    // Remove mixed milk from history entries if they exist
    history = history.map(entry => {
      if (entry.mixedMilk) {
        const { mixedMilk, ...entryWithoutMixed } = entry;
        return entryWithoutMixed;
      }
      return entry;
    });
    
    res.json({
      success: true,
      data: history,
      message: "Selling rates history retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching selling rates history:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to fetch selling rates history"
      }
    });
  }
});

// Get comprehensive analytics dashboard data
export const getComprehensiveAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get date range from query parameters or use defaults
    const { fromDate, toDate } = req.query;
    
    // Date ranges - use custom dates if provided, otherwise use current month
    const today = new Date();
    let startOfPeriod, endOfPeriod;
    
    if (fromDate && toDate) {
      startOfPeriod = new Date(fromDate);
      endOfPeriod = new Date(toDate);
      endOfPeriod.setHours(23, 59, 59, 999); // End of day
    } else {
      // Default to current month
      startOfPeriod = new Date(today.getFullYear(), today.getMonth(), 1);
      endOfPeriod = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    // Additional date ranges for various analytics
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);
    
    const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const startOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    const endOfPreviousMonth = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // 1. USER ANALYTICS
    const userAnalytics = await Promise.all([
      // Total users by role (only active employees)
      User.aggregate([
        { 
          $match: { 
            $or: [
              { role: "farmer" },                     // All farmers
              { role: "buyer" },                      // All buyers
              { role: "employee", isActive: true }    // Only active employees
            ]
          } 
        },
        { $group: { _id: "$role", total: { $sum: 1 }, approved: { $sum: { $cond: ["$approved", 1, 0] } } } }
      ]),
      // Registration trends (only active employees) - use custom period
      User.aggregate([
        { 
          $match: { 
            createdAt: { $gte: startOfPeriod, $lte: endOfPeriod },
            $or: [
              { role: "farmer" },                     // All farmers
              { role: "buyer" },                      // All buyers
              { role: "employee", isActive: true }    // Only active employees
            ]
          } 
        },
        { $group: { 
          _id: { 
            role: "$role", 
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          }, 
          count: { $sum: 1 } 
        } }
      ]),
      // Today's registrations (only active employees)
      User.countDocuments({ 
        createdAt: { $gte: startOfToday, $lt: endOfToday },
        $or: [
          { role: "farmer" },                     // All farmers
          { role: "buyer" },                      // All buyers
          { role: "employee", isActive: true }    // Only active employees
        ]
      })
    ]);

    // 2. MILK COLLECTION ANALYTICS
    const milkAnalytics = await Promise.all([
      // Today's collection by type and session
      MilkEntry.aggregate([
        { $match: { createdAt: { $gte: startOfToday, $lt: endOfToday } } },
        { $group: {
          _id: { milkType: "$cow.quantity" > 0 ? "cow" : "buffalo", session: "$session" },
          totalLiters: { $sum: { $add: ["$cow.quantity", "$buffalo.quantity"] } },
          totalAmount: { $sum: "$totalAmount" },
          entries: { $sum: 1 },
          farmers: { $addToSet: "$farmer" }
        }}
      ]),
      // Period collection trend (use custom date range)
      MilkEntry.aggregate([
        { $match: { 
          date: { 
            $gte: startOfPeriod.toISOString().split('T')[0], 
            $lte: endOfPeriod.toISOString().split('T')[0] 
          } 
        } },
        { $group: {
          _id: "$date",
          cowMilk: { $sum: "$cow.quantity" },
          buffaloMilk: { $sum: "$buffalo.quantity" },
          totalAmount: { $sum: "$totalAmount" },
          entries: { $sum: 1 }
        }},
        { $sort: { "_id": 1 } }
      ]),
      // Period comparison (use custom date range)
      MilkEntry.aggregate([
        { $match: { 
          date: { 
            $gte: startOfPeriod.toISOString().split('T')[0], 
            $lte: endOfPeriod.toISOString().split('T')[0] 
          } 
        } },
        { $group: {
          _id: { 
            month: { $toInt: { $substr: ["$date", 5, 2] } },
            year: { $toInt: { $substr: ["$date", 0, 4] } }
          },
          cowMilk: { $sum: "$cow.quantity" },
          buffaloMilk: { $sum: "$buffalo.quantity" },
          totalAmount: { $sum: "$totalAmount" },
          entries: { $sum: 1 },
          farmers: { $addToSet: "$farmer" }
        }}
      ]),
      // Top performing farmers (use custom date range)
      MilkEntry.aggregate([
        { $match: { 
          date: { 
            $gte: startOfPeriod.toISOString().split('T')[0], 
            $lte: endOfPeriod.toISOString().split('T')[0] 
          } 
        } },
        { $group: {
          _id: "$farmer",
          totalLiters: { $sum: { $add: ["$cow.quantity", "$buffalo.quantity"] } },
          totalAmount: { $sum: "$totalAmount" },
          entries: { $sum: 1 }
        }},
        { $sort: { totalLiters: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "farmerInfo" } }
      ])
    ]);

    // 3. DELIVERY & SALES ANALYTICS
    const deliveryAnalytics = await Promise.all([
      // Today's deliveries by status
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startOfToday, $lt: endOfToday } } },
        { $group: {
          _id: { status: "$status", milkType: "$milkType" },
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" }
        }}
      ]),
      // Period delivery trend (use custom date range)
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }},
        { $sort: { "_id": 1 } }
      ]),
      // Payment method distribution (use custom date range)
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } } },
        { $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }}
      ]),
      // Top buyers (use custom date range)
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } } },
        { $group: {
          _id: "$buyer",
          orders: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" }
        }},
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "buyerInfo" } }
      ])
    ]);

    // 4. FINANCIAL ANALYTICS
    const financialAnalytics = await Promise.all([
      // Revenue breakdown (use custom date range)
      Promise.all([
        MilkEntry.aggregate([
          { $match: { 
            date: { 
              $gte: startOfPeriod.toISOString().split('T')[0], 
              $lte: endOfPeriod.toISOString().split('T')[0] 
            } 
          } },
          { $group: { _id: null, milkRevenue: { $sum: "$totalAmount" } } }
        ]),
        Delivery.aggregate([
          { $match: { createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } } },
          { $group: { _id: null, deliveryRevenue: { $sum: "$totalAmount" } } }
        ]),
        FarmerPayment.aggregate([
          { $match: { paymentDate: { $gte: startOfPeriod, $lte: endOfPeriod } } },
          { $group: { _id: null, farmerPayments: { $sum: "$amount" } } }
        ])
      ]),
      // Daily revenue trend (use custom date range)
      MilkEntry.aggregate([
        { $match: { 
          date: { 
            $gte: startOfPeriod.toISOString().split('T')[0], 
            $lte: endOfPeriod.toISOString().split('T')[0] 
          } 
        } },
        { $group: {
          _id: "$date",
          revenue: { $sum: "$totalAmount" }
        }},
        { $sort: { "_id": 1 } }
      ])
    ]);

    // 5. OPERATIONAL ANALYTICS
    const operationalAnalytics = await Promise.all([
      // Transport data (use custom date range)
      Transport.aggregate([
        { $match: { date: { $gte: startOfPeriod, $lte: endOfPeriod } } },
        { $group: {
          _id: null,
          totalTransported: { $sum: { $add: ["$cowMilkTransported", "$buffaloMilkTransported"] } },
          totalCost: { $sum: { $add: ["$cowTransportAmount", "$buffaloTransportAmount"] } },
          trips: { $sum: 1 }
        }}
      ]),
      // Feed stock status
      FeedStock.aggregate([
        { $project: {
          feedType: 1,
          currentStock: 1,
          maxCapacity: 1,
          minThreshold: 1,
          stockPercentage: { $multiply: [{ $divide: ["$currentStock", "$maxCapacity"] }, 100] },
          isLowStock: { $lte: ["$currentStock", "$minThreshold"] }
        }}
      ]),
      // Loan analytics
      Loan.aggregate([
        { $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$approvedAmount" },
          totalDue: { $sum: "$totalDue" }
        }}
      ]),
      // Animal health statistics with detailed breakdown
      Animal.aggregate([
        { $match: { isActive: true } },
        { $group: {
          _id: "$healthStatus",
          count: { $sum: 1 },
          avgMilkCapacity: { $avg: "$milkCapacity" },
          totalCapacity: { $sum: "$milkCapacity" },
          farmers: { $addToSet: "$farmer" }
        }},
        { $addFields: {
          farmerCount: { $size: "$farmers" }
        }},
        { $project: {
          _id: 1,
          count: 1,
          avgMilkCapacity: 1,
          totalCapacity: 1,
          farmerCount: 1
        }}
      ])
    ]);

    // 6. COMPREHENSIVE LOAN ANALYTICS
    const loanAnalytics = await LoanAnalyticsService.getComprehensiveLoanAnalytics({
      dateRange: {
        start: startOfMonth,
        end: endOfMonth
      },
      period: 'month',
      topBorrowersLimit: 10
    });

    // 7. EMPLOYEE PERFORMANCE
    const employeeAnalytics = await Promise.all([
      // Milk collection by employees (only active employees) - use custom date range
      MilkEntry.aggregate([
        { $match: { 
          date: { 
            $gte: startOfPeriod.toISOString().split('T')[0], 
            $lte: endOfPeriod.toISOString().split('T')[0] 
          } 
        } },
        { $group: {
          _id: "$collectedBy",
          collections: { $sum: 1 },
          totalLiters: { $sum: { $add: ["$cow.quantity", "$buffalo.quantity"] } },
          totalAmount: { $sum: "$totalAmount" }
        }},
        { $sort: { collections: -1 } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "employeeInfo" } },
        // Filter to only include active employees
        { $match: { "employeeInfo.isActive": true } }
      ]),
      // Delivery handling by employees (only active employees) - use custom date range
      Delivery.aggregate([
        { $match: { createdAt: { $gte: startOfPeriod, $lte: endOfPeriod }, handledBy: { $exists: true } } },
        { $group: {
          _id: "$handledBy",
          deliveries: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          completed: { $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] } }
        }},
        { $sort: { deliveries: -1 } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "employeeInfo" } },
        // Filter to only include active employees
        { $match: { "employeeInfo.isActive": true } }
      ])
    ]);

    // Format response
    const analytics = {
      overview: {
        totalUsers: userAnalytics[0].reduce((sum, item) => sum + item.total, 0),
        totalApproved: userAnalytics[0].reduce((sum, item) => sum + item.approved, 0),
        todayRegistrations: userAnalytics[2],
        totalRevenue: financialAnalytics[0][0]?.[0]?.milkRevenue || 0 + financialAnalytics[0][1]?.[0]?.deliveryRevenue || 0,
        totalMilkCollected: milkAnalytics[2]?.reduce((sum, item) => sum + item.cowMilk + item.buffaloMilk, 0) || 0,
        totalDeliveries: deliveryAnalytics[1]?.reduce((sum, item) => sum + item.orders, 0) || 0,
        // Add loan overview to main overview
        totalLoanRequested: loanAnalytics.overview.totalRequested,
        totalLoanApproved: loanAnalytics.overview.totalApproved,
        totalLoanReturned: loanAnalytics.overview.totalReturned,
        totalLoanOutstanding: loanAnalytics.overview.totalOutstanding
      },
      
      users: {
        byRole: userAnalytics[0],
        registrationTrend: userAnalytics[1],
        todayRegistrations: userAnalytics[2]
      },
      
      milkCollection: {
        today: milkAnalytics[0],
        weeklyTrend: milkAnalytics[1],
        monthlyComparison: milkAnalytics[2],
        topFarmers: milkAnalytics[3]
      },
      
      deliveries: {
        todayStatus: deliveryAnalytics[0],
        weeklyTrend: deliveryAnalytics[1],
        paymentMethods: deliveryAnalytics[2],
        topBuyers: deliveryAnalytics[3]
      },
      
      financial: {
        revenue: financialAnalytics[0],
        dailyTrend: financialAnalytics[1]
      },
      
      operations: {
        transport: operationalAnalytics[0][0] || { totalTransported: 0, totalCost: 0, trips: 0 },
        feedStock: operationalAnalytics[1],
        loans: operationalAnalytics[2],
        animals: operationalAnalytics[3]
      },
      
      // Add comprehensive loan analytics
      loans: loanAnalytics,
      
      employees: {
        milkCollectors: employeeAnalytics[0],
        deliveryHandlers: employeeAnalytics[1]
      },
      
      metadata: {
        generatedAt: new Date(),
        customDateRange: fromDate && toDate ? { start: startOfPeriod, end: endOfPeriod } : null,
        dateRanges: {
          today: { start: startOfToday, end: endOfToday },
          period: { start: startOfPeriod, end: endOfPeriod },
          week: { start: startOfWeek, end: today },
          month: { start: startOfMonth, end: endOfMonth },
          previousMonth: { start: startOfPreviousMonth, end: endOfPreviousMonth }
        }
      }
    };

    res.json({
      success: true,
      data: analytics,
      message: "Comprehensive analytics retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching comprehensive analytics:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "ANALYTICS_FETCH_FAILED",
        message: error.message
      }
    });
  }
});

// Get farmer payments for admin view
export const getAdminFarmerPayments = asyncHandler(async (req, res) => {
  const { 
    dateFrom, 
    dateTo, 
    farmerId, 
    paymentType, 
    processedBy,
    milkType,
    status,
    page = 1, 
    limit = 50 
  } = req.query;

  try {
    let filter = {};

    // Date range filter
    if (dateFrom && dateTo) {
      filter.paymentDate = { 
        $gte: new Date(dateFrom), 
        $lte: new Date(dateTo + 'T23:59:59.999Z') 
      };
    } else if (dateFrom) {
      filter.paymentDate = { $gte: new Date(dateFrom) };
    } else if (dateTo) {
      filter.paymentDate = { $lte: new Date(dateTo + 'T23:59:59.999Z') };
    }

    // Farmer filter
    if (farmerId) {
      filter.farmer = farmerId;
    }

    // Payment type filter
    if (paymentType && paymentType !== 'all') {
      filter.paymentType = paymentType;
    }

    // Milk type filter
    if (milkType && milkType !== 'all') {
      filter.milkType = milkType;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Processed by filter (employee who processed the payment)
    if (processedBy) {
      filter.processedBy = processedBy;
    }

    // Get payments with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await FarmerPayment.find(filter)
      .populate('farmer', 'username uniqueId mobile')
      .populate('processedBy', 'username uniqueId role')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Enhance payments with calculated cow/buffalo amounts for legacy payments
    const enhancedPayments = await Promise.all(payments.map(async (payment) => {
      const paymentObj = payment.toObject();
      
      // Check if payment already has breakdown amounts
      const hasBreakdown = (paymentObj.cowMilkAmount > 0) || (paymentObj.buffaloMilkAmount > 0);
      
      if (!hasBreakdown && paymentObj.billPeriod && paymentObj.billPeriod.dateFrom && paymentObj.billPeriod.dateTo) {
        // Calculate cow/buffalo amounts from milk entries for the bill period
        try {
          const milkEntries = await MilkEntry.find({
            farmer: paymentObj.farmer._id,
            date: {
              $gte: paymentObj.billPeriod.dateFrom.toISOString().split('T')[0],
              $lte: paymentObj.billPeriod.dateTo.toISOString().split('T')[0]
            }
          });

          let calculatedCowAmount = 0;
          let calculatedBuffaloAmount = 0;

          milkEntries.forEach(entry => {
            if (entry.milkType === 'cow') {
              calculatedCowAmount += entry.totalAmount || 0;
            } else if (entry.milkType === 'buffalo') {
              calculatedBuffaloAmount += entry.totalAmount || 0;
            } else if (entry.milkType === 'mixed') {
              // For mixed entries, try to split proportionally based on liters if available
              const cowLiters = entry.cowLiters || 0;
              const buffaloLiters = entry.buffaloLiters || 0;
              const totalLiters = cowLiters + buffaloLiters;
              
              if (totalLiters > 0) {
                const cowProportion = cowLiters / totalLiters;
                const buffaloProportion = buffaloLiters / totalLiters;
                calculatedCowAmount += (entry.totalAmount || 0) * cowProportion;
                calculatedBuffaloAmount += (entry.totalAmount || 0) * buffaloProportion;
              } else {
                // If no breakdown available, split equally
                calculatedCowAmount += (entry.totalAmount || 0) * 0.5;
                calculatedBuffaloAmount += (entry.totalAmount || 0) * 0.5;
              }
            }
          });

          // Update the payment object with calculated amounts
          paymentObj.cowMilkAmount = Math.round(calculatedCowAmount);
          paymentObj.buffaloMilkAmount = Math.round(calculatedBuffaloAmount);
          
          // Update milk type based on calculated amounts
          if (calculatedCowAmount > 0 && calculatedBuffaloAmount > 0) {
            paymentObj.milkType = 'mixed';
          } else if (calculatedCowAmount > 0) {
            paymentObj.milkType = 'cow';
          } else if (calculatedBuffaloAmount > 0) {
            paymentObj.milkType = 'buffalo';
          }
        } catch (error) {
          console.error(`Error calculating breakdown for payment ${paymentObj._id}:`, error);
          // If calculation fails, try to split the total amount based on milk type
          if (paymentObj.milkType === 'cow') {
            paymentObj.cowMilkAmount = paymentObj.amount;
            paymentObj.buffaloMilkAmount = 0;
          } else if (paymentObj.milkType === 'buffalo') {
            paymentObj.cowMilkAmount = 0;
            paymentObj.buffaloMilkAmount = paymentObj.amount;
          } else {
            // For mixed or unknown, split equally
            paymentObj.cowMilkAmount = Math.round(paymentObj.amount * 0.5);
            paymentObj.buffaloMilkAmount = Math.round(paymentObj.amount * 0.5);
          }
        }
      } else if (!hasBreakdown) {
        // For payments without bill period, try to split based on milk type
        if (paymentObj.milkType === 'cow') {
          paymentObj.cowMilkAmount = paymentObj.amount;
          paymentObj.buffaloMilkAmount = 0;
        } else if (paymentObj.milkType === 'buffalo') {
          paymentObj.cowMilkAmount = 0;
          paymentObj.buffaloMilkAmount = paymentObj.amount;
        } else {
          // For mixed or unknown, split equally
          paymentObj.cowMilkAmount = Math.round(paymentObj.amount * 0.5);
          paymentObj.buffaloMilkAmount = Math.round(paymentObj.amount * 0.5);
        }
      }
      
      return paymentObj;
    }));

    // Get total count for pagination
    const totalPayments = await FarmerPayment.countDocuments(filter);

    // Get last bill generated date by milk collector with detailed information
    const lastBillGenerated = await FarmerPayment.findOne({
      'processedBy': { $exists: true }
    })
      .sort({ paymentDate: -1 })
      .populate('processedBy', 'username uniqueId role')
      .select('paymentDate processedBy billPeriod');

    let lastBillInfo = null;
    if (lastBillGenerated && lastBillGenerated.processedBy?.role === 'employee') {
      lastBillInfo = {
        generatedDate: lastBillGenerated.paymentDate,
        dateFrom: lastBillGenerated.billPeriod?.dateFrom || null,
        dateTo: lastBillGenerated.billPeriod?.dateTo || null,
        collectorName: lastBillGenerated.processedBy.username,
        collectorId: lastBillGenerated.processedBy.uniqueId
      };
    }

    // Calculate summary using enhanced payments
    const summaryTotalAmount = enhancedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const summaryPaymentCount = enhancedPayments.length;
    const summaryAvgPayment = summaryPaymentCount > 0 ? summaryTotalAmount / summaryPaymentCount : 0;

    // Get payment type breakdown
    const paymentTypeBreakdown = await FarmerPayment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      }
    ]);

    // Get milk type breakdown using enhanced data
    const milkTypeBreakdown = enhancedPayments.reduce((acc, payment) => {
      const existing = acc.find(item => item._id === payment.milkType);
      if (existing) {
        existing.count += 1;
        existing.totalAmount += payment.amount;
      } else {
        acc.push({
          _id: payment.milkType,
          count: 1,
          totalAmount: payment.amount
        });
      }
      return acc;
    }, []);

    // Get monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrends = await FarmerPayment.aggregate([
      { 
        $match: { 
          paymentDate: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        payments: enhancedPayments,
        lastBillInfo,
        summary: { 
          totalAmount: summaryTotalAmount, 
          paymentCount: summaryPaymentCount, 
          avgPayment: summaryAvgPayment 
        },
        paymentTypeBreakdown,
        milkTypeBreakdown,
        monthlyTrends,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalPayments,
          pages: Math.ceil(totalPayments / parseInt(limit))
        },
        filters: {
          dateFrom,
          dateTo,
          farmerId,
          paymentType,
          processedBy,
          milkType
        }
      },
      message: "Farmer payments retrieved successfully"
    });

  } catch (error) {
    console.error("Error fetching farmer payments:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: error.message
      }
    });
  }
});


// Get buyer payments for admin view
export const getAdminBuyerPayments = asyncHandler(async (req, res) => {
  // Get all buyer purchases with payment information
  const buyerPayments = await Delivery.find({
    status: { $in: ["Pending", "Approved", "Out for Delivery", "Completed"] }
  })
    .populate('buyer', 'username mobile uniqueId')
    .populate('handledBy', 'username')
    .sort({ createdAt: -1 });

  // Format the response to include payment details
  const formattedPayments = buyerPayments.map(delivery => ({
    _id: delivery._id,
    buyer: delivery.buyer,
    milkType: delivery.milkType,
    quantity: delivery.quantity,
    rate: delivery.rate,
    totalAmount: delivery.totalAmount,
    address: delivery.address,
    deliveryDate: delivery.deliveryDate,
    status: delivery.status,
    paymentMethod: delivery.paymentMethod,
    paymentCompleted: delivery.paymentCompleted,
    paymentDate: delivery.paymentDate,
    handledBy: delivery.handledBy,
    completedAt: delivery.completedAt,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt
  }));

  // Calculate summary
  const summary = {
    totalOrders: formattedPayments.length,
    totalAmount: formattedPayments.reduce((sum, p) => sum + p.totalAmount, 0),
    paidAmount: formattedPayments.filter(p => p.paymentCompleted).reduce((sum, p) => sum + p.totalAmount, 0),
    pendingAmount: formattedPayments.filter(p => !p.paymentCompleted).reduce((sum, p) => sum + p.totalAmount, 0),
    onlinePayments: formattedPayments.filter(p => p.paymentMethod !== 'cod' && p.paymentCompleted).length,
    codPayments: formattedPayments.filter(p => p.paymentMethod === 'cod').length,
    codPending: formattedPayments.filter(p => p.paymentMethod === 'cod' && !p.paymentCompleted).length,
    codCompleted: formattedPayments.filter(p => p.paymentMethod === 'cod' && p.paymentCompleted).length
  };

  res.json({
    success: true,
    data: {
      payments: formattedPayments,
      summary
    },
    message: "Buyer payments retrieved successfully"
  });
});
