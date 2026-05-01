import Loan from "../models/Loan.model.js";
import Feed from "../models/Feed.model.js";
import FeedStock from "../models/FeedStock.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

// Get loan/feed dashboard stats
export const getLoanFeedDashboard = asyncHandler(async (req, res) => {
  // Loan stats - only count approved loans
  const loanStats = await Loan.aggregate([
    {
      $match: {
        status: { $ne: "requested" } // Exclude requested loans from analytics
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalApproved: { 
          $sum: { 
            $cond: [{ $ne: ["$approvedAmount", null] }, "$approvedAmount", 0] 
          } 
        },
        totalReturned: { $sum: "$totalReturned" },
        totalDue: { $sum: "$totalDue" }
      }
    }
  ]);

  // Feed stats with unique farmers count
  const feedStats = await Feed.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  // Feed summary with unique farmers for approved/delivered feeds
  const feedSummary = await Feed.aggregate([
    {
      $match: {
        status: { $in: ["approved", "delivered"] }
      }
    },
    {
      $group: {
        _id: null,
        uniqueFarmers: { $addToSet: "$farmer" },
        totalRequests: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalAmount: { $sum: "$totalAmount" }
      }
    },
    {
      $project: {
        uniqueFarmers: { $size: "$uniqueFarmers" },
        totalRequests: 1,
        totalQuantity: 1,
        totalAmount: 1
      }
    }
  ]);

  // For stock alerts, we'll use mock data since the frontend uses localStorage
  // In a real implementation, you would query the actual FeedStock collection
  const mockStockData = [
    { feedType: "cattle_feed", currentStock: 500 },
    { feedType: "buffalo_feed", currentStock: 2003 },
    { feedType: "green_fodder", currentStock: 2002 },
    { feedType: "dry_fodder", currentStock: 0 },
    { feedType: "mineral_mix", currentStock: 0 },
    { feedType: "concentrate_feed", currentStock: 0 }
  ];

  // Calculate stock alerts from mock data
  const lowStockItems = mockStockData.filter(stock => stock.currentStock > 0 && stock.currentStock < 200);
  const outOfStockItems = mockStockData.filter(stock => stock.currentStock === 0);

  // Recent loans (approved only)
  const recentLoans = await Loan.find({ status: { $ne: "requested" } })
    .populate('farmer', 'username mobile uniqueId')
    .populate('approvedBy', 'username')
    .sort({ updatedAt: -1 })
    .limit(10);

  // Recent feed entries
  const recentFeeds = await Feed.find({})
    .populate('farmer', 'username mobile uniqueId')
    .populate('managedBy', 'username')
    .sort({ createdAt: -1 })
    .limit(10);

  // Format loan stats
  const formattedLoanStats = {
    approved: loanStats.find(s => s._id === "approved") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    partially_paid: loanStats.find(s => s._id === "partially_paid") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    fully_cleared: loanStats.find(s => s._id === "fully_cleared") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    closed: loanStats.find(s => s._id === "closed") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 }
  };

  // Calculate totals
  const totalStats = loanStats.reduce((acc, stat) => {
    acc.totalApproved += stat.totalApproved;
    acc.totalReturned += stat.totalReturned;
    acc.totalDue += stat.totalDue;
    acc.activeFarmers += stat.count;
    return acc;
  }, { totalApproved: 0, totalReturned: 0, totalDue: 0, activeFarmers: 0 });

  // Format feed stats
  const formattedFeedStats = {
    pending: feedStats.find(s => s._id === "pending") || { count: 0, totalQuantity: 0, totalAmount: 0 },
    approved: feedStats.find(s => s._id === "approved") || { count: 0, totalQuantity: 0, totalAmount: 0 },
    delivered: feedStats.find(s => s._id === "delivered") || { count: 0, totalQuantity: 0, totalAmount: 0 }
  };

  res.json({
    success: true,
    data: {
      loanStats: formattedLoanStats,
      totalLoanStats: totalStats,
      feedStats: formattedFeedStats,
      feedSummary: feedSummary[0] || { uniqueFarmers: 0, totalRequests: 0, totalQuantity: 0, totalAmount: 0 },
      lowStockAlerts: lowStockItems.length,
      outOfStockAlerts: outOfStockItems.length,
      recentLoans,
      recentFeeds
    },
    message: "Loan/Feed dashboard data retrieved successfully"
  });
});

// Get all loans with filters
export const getLoanManagement = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search, farmerId, dateFrom, dateTo } = req.query;
  
  let filter = {};
  
  // Status filter
  if (status && status !== 'all') {
    filter.status = status;
  }

  // Farmer filter
  if (farmerId) {
    filter.farmer = farmerId;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    filter.requestDate = {};
    if (dateFrom) filter.requestDate.$gte = new Date(dateFrom);
    if (dateTo) filter.requestDate.$lte = new Date(dateTo);
  }

  // Search filter
  if (search) {
    const farmers = await User.find({
      role: "farmer",
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    filter.farmer = { $in: farmers.map(f => f._id) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const loans = await Loan.find(filter)
    .populate('farmer', 'username mobile uniqueId')
    .populate('approvedBy', 'username uniqueId')
    .populate('clearedBy', 'username uniqueId')
    .populate('closedBy', 'username uniqueId')
    .sort({ requestDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Loan.countDocuments(filter);

  res.json({
    success: true,
    data: {
      loans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    },
    message: "Loans retrieved successfully"
  });
});

// Approve a loan
export const approveLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approvedAmount } = req.body;
  const employeeId = req.user.id;

  if (!approvedAmount || approvedAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_AMOUNT",
        message: "Approved amount must be greater than 0"
      }
    });
  }

  try {
    const loan = await Loan.approveLoan(id, approvedAmount, employeeId);
    await loan.populate('farmer', 'username mobile uniqueId');
    await loan.populate('approvedBy', 'username uniqueId');

    res.json({
      success: true,
      data: loan,
      message: "Loan approved successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "APPROVAL_FAILED",
        message: error.message
      }
    });
  }
});

// Add payment to a loan
export const addLoanPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentAmount, paymentMode, notes } = req.body;
  const employeeId = req.user.id;

  if (!paymentAmount || paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PAYMENT",
        message: "Payment amount must be greater than 0"
      }
    });
  }

  if (!paymentMode) {
    return res.status(400).json({
      success: false,
      error: {
        code: "PAYMENT_MODE_REQUIRED",
        message: "Payment mode is required"
      }
    });
  }

  try {
    const loan = await Loan.addPayment(id, paymentAmount, paymentMode, employeeId, notes);
    await loan.populate('farmer', 'username mobile uniqueId');

    res.json({
      success: true,
      data: loan,
      message: "Payment added successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "PAYMENT_FAILED",
        message: error.message
      }
    });
  }
});

// Clear a loan
export const clearLoan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employeeId = req.user.id;

  try {
    const loan = await Loan.clearLoan(id, employeeId);
    await loan.populate('farmer', 'username mobile uniqueId');
    await loan.populate('clearedBy', 'username uniqueId');

    res.json({
      success: true,
      data: loan,
      message: "Loan cleared successfully"
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: "CLEARANCE_FAILED",
        message: error.message
      }
    });
  }
});

// Get loan history for a specific farmer
export const getLoanHistory = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found"
      }
    });
  }

  const loans = await Loan.find({ farmer: farmerId })
    .populate('farmer', 'username mobile uniqueId')
    .populate('approvedBy', 'username')
    .populate('clearedBy', 'username')
    .populate('closedBy', 'username')
    .populate('history.processedBy', 'username')
    .sort({ requestDate: -1 });

  // Flatten all history entries with loan context
  const allHistory = [];
  loans.forEach(loan => {
    loan.history.forEach(historyEntry => {
      allHistory.push({
        ...historyEntry.toObject(),
        loanId: loan._id,
        loanPurpose: loan.purpose,
        requestedAmount: loan.requestedAmount,
        approvedAmount: loan.approvedAmount
      });
    });
  });

  // Sort by date descending
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Paginate
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedHistory = allHistory.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    data: {
      farmer,
      history: paginatedHistory,
      loans: loans.map(loan => ({
        _id: loan._id,
        purpose: loan.purpose,
        requestedAmount: loan.requestedAmount,
        approvedAmount: loan.approvedAmount,
        totalReturned: loan.totalReturned,
        totalDue: loan.totalDue,
        status: loan.status,
        requestDate: loan.requestDate,
        approvalDate: loan.approvalDate
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: allHistory.length,
        pages: Math.ceil(allHistory.length / parseInt(limit))
      }
    },
    message: "Loan history retrieved successfully"
  });
});

// Get loan statistics
export const getLoanFeedStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const employeeId = req.user.id;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  // Overall loan statistics (approved loans only)
  const loanStats = await Loan.aggregate([
    {
      $match: {
        approvalDate: { $gte: start, $lte: end },
        status: { $ne: "requested" }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalApproved: { 
          $sum: { 
            $cond: [{ $ne: ["$approvedAmount", null] }, "$approvedAmount", 0] 
          } 
        },
        totalReturned: { $sum: "$totalReturned" },
        totalDue: { $sum: "$totalDue" }
      }
    }
  ]);

  // Feed statistics
  const feedStats = await Feed.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end }
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

  // My managed loan statistics
  const myLoanStats = await Loan.aggregate([
    {
      $match: {
        approvedBy: employeeId,
        approvalDate: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalApproved: { $sum: "$approvedAmount" },
        totalReturned: { $sum: "$totalReturned" },
        totalDue: { $sum: "$totalDue" }
      }
    }
  ]);

  // My managed feed statistics
  const myFeedStats = await Feed.aggregate([
    {
      $match: {
        managedBy: employeeId,
        createdAt: { $gte: start, $lte: end }
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

  // Format loan stats for frontend
  const formattedLoanStats = {
    approved: loanStats.find(s => s._id === "approved") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    partially_paid: loanStats.find(s => s._id === "partially_paid") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    fully_cleared: loanStats.find(s => s._id === "fully_cleared") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    closed: loanStats.find(s => s._id === "closed") || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 }
  };

  res.json({
    success: true,
    data: {
      loanStats: formattedLoanStats,
      feedStats,
      myLoanStats,
      myFeedStats,
      dateRange: { start, end }
    },
    message: "Loan/Feed statistics retrieved successfully"
  });
});

// Feed Management (keeping existing functionality)
export const getFeedManagement = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  
  let filter = {};
  
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search) {
    const farmers = await User.find({
      role: "farmer",
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { uniqueId: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    filter.farmer = { $in: farmers.map(f => f._id) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const feeds = await Feed.find(filter)
    .populate('farmer', 'username mobile uniqueId')
    .populate('managedBy', 'username uniqueId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Feed.countDocuments(filter);

  res.json({
    success: true,
    data: {
      feeds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    },
    message: "Feed entries retrieved successfully"
  });
});

export const createFeedEntry = asyncHandler(async (req, res) => {
  const { farmerId, feedType, quantity, pricePerUnit, totalAmount } = req.body;
  const employeeId = req.user.id;

  const farmer = await User.findById(farmerId);
  if (!farmer || farmer.role !== "farmer") {
    return res.status(404).json({
      success: false,
      error: {
        code: "FARMER_NOT_FOUND",
        message: "Farmer not found"
      }
    });
  }

  const feed = await Feed.create({
    farmer: farmerId,
    feedType,
    quantity,
    pricePerUnit,
    totalAmount,
    managedBy: employeeId,
    status: "pending"
  });

  await feed.populate('farmer', 'username mobile uniqueId');

  res.json({
    success: true,
    data: feed,
    message: "Feed entry created successfully"
  });
});

export const updateFeedEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, deliveryDate } = req.body;
  const employeeId = req.user.id;

  const feed = await Feed.findById(id);
  if (!feed) {
    return res.status(404).json({
      success: false,
      error: {
        code: "FEED_NOT_FOUND",
        message: "Feed entry not found"
      }
    });
  }

  const updateData = { managedBy: employeeId };
  
  if (status) updateData.status = status;
  if (notes) updateData.notes = notes;
  if (deliveryDate) updateData.deliveryDate = deliveryDate;

  const updatedFeed = await Feed.findByIdAndUpdate(id, updateData, { new: true })
    .populate('farmer', 'username mobile uniqueId')
    .populate('managedBy', 'username uniqueId');

  res.json({
    success: true,
    data: updatedFeed,
    message: "Feed entry updated successfully"
  });
});

export const deleteFeedEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feed = await Feed.findById(id);
  if (!feed) {
    return res.status(404).json({
      success: false,
      error: {
        code: "FEED_NOT_FOUND",
        message: "Feed entry not found"
      }
    });
  }

  await Feed.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Feed entry deleted successfully"
  });
});

// Feed Stock Management (keeping existing functionality)
export const getFeedStockManagement = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  let filter = {};
  
  if (search) {
    filter.$or = [
      { feedType: { $regex: search, $options: 'i' } },
      { supplier: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const feedStocks = await FeedStock.find(filter)
    .sort({ currentStock: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FeedStock.countDocuments(filter);

  // Get low stock alerts
  const lowStockCount = await FeedStock.countDocuments({
    $expr: {
      $lt: ["$currentStock", { $multiply: ["$maxCapacity", 0.2] }]
    }
  });

  res.json({
    success: true,
    data: {
      feedStocks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      lowStockCount
    },
    message: "Feed stock retrieved successfully"
  });
});

export const updateFeedStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentStock, maxCapacity, minThreshold, supplier, notes } = req.body;
  const employeeId = req.user.id;

  const feedStock = await FeedStock.findById(id);
  if (!feedStock) {
    return res.status(404).json({
      success: false,
      error: {
        code: "FEED_STOCK_NOT_FOUND",
        message: "Feed stock not found"
      }
    });
  }

  const updateData = { updatedBy: employeeId };
  
  if (currentStock !== undefined) updateData.currentStock = currentStock;
  if (maxCapacity !== undefined) updateData.maxCapacity = maxCapacity;
  if (minThreshold !== undefined) updateData.minThreshold = minThreshold;
  if (supplier) updateData.supplier = supplier;
  if (notes) updateData.notes = notes;

  const updatedFeedStock = await FeedStock.findByIdAndUpdate(id, updateData, { new: true });

  res.json({
    success: true,
    data: updatedFeedStock,
    message: "Feed stock updated successfully"
  });
});

// Get loan/feed history (keeping existing functionality)
export const getLoanFeedHistory = asyncHandler(async (req, res) => {
  const { type = 'all', page = 1, limit = 20 } = req.query;
  const employeeId = req.user.id;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let data = {};

  if (type === 'loans' || type === 'all') {
    const loans = await Loan.find({ approvedBy: employeeId })
      .populate('farmer', 'username mobile uniqueId')
      .sort({ updatedAt: -1 })
      .skip(type === 'all' ? 0 : skip)
      .limit(type === 'all' ? 10 : parseInt(limit));

    data.loans = loans;
    
    if (type === 'loans') {
      const totalLoans = await Loan.countDocuments({ approvedBy: employeeId });
      data.loansPagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalLoans,
        pages: Math.ceil(totalLoans / parseInt(limit))
      };
    }
  }

  if (type === 'feeds' || type === 'all') {
    const feeds = await Feed.find({ managedBy: employeeId })
      .populate('farmer', 'username mobile uniqueId')
      .sort({ updatedAt: -1 })
      .skip(type === 'all' ? 0 : skip)
      .limit(type === 'all' ? 10 : parseInt(limit));

    data.feeds = feeds;
    
    if (type === 'feeds') {
      const totalFeeds = await Feed.countDocuments({ managedBy: employeeId });
      data.feedsPagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalFeeds,
        pages: Math.ceil(totalFeeds / parseInt(limit))
      };
    }
  }

  res.json({
    success: true,
    data,
    message: "Loan/Feed history retrieved successfully"
  });
});

// Get stock alerts from frontend data
export const getStockAlerts = asyncHandler(async (req, res) => {
  const { stockData } = req.body;
  
  if (!stockData || !Array.isArray(stockData)) {
    return res.status(400).json({
      success: false,
      message: "Stock data is required"
    });
  }

  // Calculate stock alerts
  const lowStockItems = stockData.filter(stock => 
    stock.availableQuantity > 0 && stock.availableQuantity < 200
  );
  
  const outOfStockItems = stockData.filter(stock => 
    stock.availableQuantity === 0
  );

  res.json({
    success: true,
    data: {
      lowStockAlerts: lowStockItems.length,
      outOfStockAlerts: outOfStockItems.length,
      lowStockItems,
      outOfStockItems
    },
    message: "Stock alerts calculated successfully"
  });
});