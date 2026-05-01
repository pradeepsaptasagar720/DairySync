import MilkQualityRating from "../models/MilkQualityRating.model.js";
import Delivery from "../models/Delivery.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";
import xss from "xss";

/**
 * Submit a milk quality rating
 * POST /api/ratings
 */
export const submitRating = asyncHandler(async (req, res) => {
  const { orderId, rating, comments = "" } = req.body;
  const buyerId = req.user.id;
  
  // Validate rating value
  const ratingNum = parseInt(rating);
  if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_RATING_VALUE",
        message: "Rating must be an integer between 1 and 5"
      }
    });
  }
  
  // Validate comments length
  if (comments && comments.length > 500) {
    return res.status(400).json({
      success: false,
      error: {
        code: "COMMENTS_TOO_LONG",
        message: "Comments exceed 500 character limit"
      }
    });
  }
  
  // Check if order exists
  const order = await Delivery.findById(orderId);
  if (!order) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found"
      }
    });
  }
  
  // Check if order belongs to buyer
  const orderBuyerId = order.buyer?._id ? order.buyer._id.toString() : order.buyer.toString();
  const requestBuyerId = req.user.id.toString();
  
  if (orderBuyerId !== requestBuyerId) {
    console.log(`[MilkQualityRating] 403 - order.buyer: ${orderBuyerId}, req.user.id: ${requestBuyerId}`);
    return res.status(403).json({
      success: false,
      error: {
        code: "RATING_UNAUTHORIZED",
        message: "Only the buyer can rate this order"
      }
    });
  }
  
  // Check if order is completed
  if (order.status !== "Completed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "ORDER_NOT_COMPLETED",
        message: "Can only rate completed orders"
      }
    });
  }
  
  // Check time window (7 days)
  if (order.completedAt) {
    const daysSinceCompletion = (Date.now() - new Date(order.completedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCompletion > 7) {
      return res.status(400).json({
        success: false,
        error: {
          code: "RATING_WINDOW_EXPIRED",
          message: "Rating window has expired (>7 days)"
        }
      });
    }
  }
  
  // Check for duplicate rating
  const existingRating = await MilkQualityRating.findOne({ orderId });
  if (existingRating) {
    return res.status(400).json({
      success: false,
      error: {
        code: "DUPLICATE_RATING",
        message: "This order has already been rated"
      }
    });
  }
  
  // Sanitize comments
  const sanitizedComments = comments ? xss(comments.trim(), {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script"]
  }) : "";
  
  // Create rating
  const milkQualityRating = await MilkQualityRating.create({
    orderId,
    buyerId,
    rating: ratingNum,
    comments: sanitizedComments
  });
  
  // Update order
  await Delivery.findByIdAndUpdate(orderId, {
    milkQualityRated: true,
    milkQualityRatingId: milkQualityRating._id
  });
  
  res.status(201).json({
    success: true,
    data: {
      _id: milkQualityRating._id,
      orderId: milkQualityRating.orderId,
      buyerId: milkQualityRating.buyerId,
      rating: milkQualityRating.rating,
      comments: milkQualityRating.comments,
      createdAt: milkQualityRating.createdAt
    }
  });
});

/**
 * Get the current buyer's own ratings
 * GET /api/ratings/my-ratings
 */
export const getMyRatings = asyncHandler(async (req, res) => {
  const buyerId = new mongoose.Types.ObjectId(req.user.id || req.user._id);

  const ratings = await MilkQualityRating.find({ buyerId })
    .select("orderId rating comments createdAt")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: ratings.map(r => ({
      _id: r._id,
      orderId: r.orderId.toString(),
      rating: r.rating,
      comments: r.comments,
      createdAt: r.createdAt
    }))
  });
});

/**
 * Get ratings for admin dashboard with filtering and pagination
 * GET /api/admin/ratings
 */
export const getRatings = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    startDate,
    endDate,
    rating: ratingFilter,
    buyerName,
    lowRatingsOnly
  } = req.query;
  
  // Build query
  const query = {};
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }
  
  // Rating filter
  if (ratingFilter) {
    const ratings = ratingFilter.split(",").map(r => parseInt(r)).filter(r => r >= 1 && r <= 5);
    if (ratings.length > 0) {
      query.rating = { $in: ratings };
    }
  }
  
  // Low ratings filter
  if (lowRatingsOnly === "true") {
    query.rating = { $lte: 3 };
  }
  
  // Get total count for pagination
  const total = await MilkQualityRating.countDocuments(query);
  
  // Fetch ratings with pagination
  let ratingsQuery = MilkQualityRating.find(query)
    .populate("buyerId", "username")
    .populate("orderId", "deliveryDate")
    .sort({ createdAt: -1 }) // Newest first
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  
  const ratings = await ratingsQuery;
  
  // Filter by buyer name if provided (after population)
  let filteredRatings = ratings;
  if (buyerName) {
    const searchTerm = buyerName.toLowerCase();
    filteredRatings = ratings.filter(r => 
      r.buyerId && r.buyerId.username && r.buyerId.username.toLowerCase().includes(searchTerm)
    );
  }
  
  // Format response
  const formattedRatings = filteredRatings.map(r => ({
    _id: r._id,
    orderId: r.orderId._id,
    buyerName: r.buyerId ? r.buyerId.username : "Unknown",
    rating: r.rating,
    comments: r.comments,
    createdAt: r.createdAt
  }));
  
  res.status(200).json({
    success: true,
    data: {
      ratings: formattedRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      filteredCount: filteredRatings.length
    }
  });
});

/**
 * Get rating statistics
 * GET /api/admin/ratings/stats
 */
export const getRatingStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, rating: ratingFilter } = req.query;
  
  // Build query
  const query = {};
  
  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }
  
  // Rating filter
  if (ratingFilter) {
    const ratings = ratingFilter.split(",").map(r => parseInt(r)).filter(r => r >= 1 && r <= 5);
    if (ratings.length > 0) {
      query.rating = { $in: ratings };
    }
  }
  
  // Get all ratings matching the query
  const ratings = await MilkQualityRating.find(query).select("rating createdAt");
  
  // Calculate statistics
  const totalRatings = ratings.length;
  
  if (totalRatings === 0) {
    return res.status(200).json({
      success: true,
      data: {
        averageRating: 0,
        totalRatings: 0,
        distribution: {
          1: { count: 0, percentage: 0 },
          2: { count: 0, percentage: 0 },
          3: { count: 0, percentage: 0 },
          4: { count: 0, percentage: 0 },
          5: { count: 0, percentage: 0 }
        },
        lowRatingsLast7Days: 0
      }
    });
  }
  
  // Calculate average
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = sum / totalRatings;
  
  // Calculate distribution
  const distribution = {
    1: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    5: { count: 0, percentage: 0 }
  };
  
  ratings.forEach(r => {
    distribution[r.rating].count++;
  });
  
  // Calculate percentages
  Object.keys(distribution).forEach(key => {
    distribution[key].percentage = (distribution[key].count / totalRatings) * 100;
  });
  
  // Calculate low ratings in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const lowRatingsLast7Days = await MilkQualityRating.countDocuments({
    rating: { $lte: 3 },
    createdAt: { $gte: sevenDaysAgo }
  });
  
  res.status(200).json({
    success: true,
    data: {
      averageRating: parseFloat(averageRating.toFixed(2)),
      totalRatings,
      distribution,
      lowRatingsLast7Days
    }
  });
});

/**
 * Get rating trends over time
 * GET /api/admin/ratings/trends
 */
export const getRatingTrends = asyncHandler(async (req, res) => {
  const {
    granularity = "daily",
    startDate,
    endDate
  } = req.query;
  
  // Set default date range (90 days)
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  // Get all ratings in the date range
  const ratings = await MilkQualityRating.find({
    createdAt: { $gte: start, $lte: end }
  }).select("rating createdAt").sort({ createdAt: 1 });
  
  if (ratings.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        trends: [],
        trendDirection: "stable",
        trendPercentage: 0
      }
    });
  }
  
  // Group ratings by time period
  const trendsMap = new Map();
  
  ratings.forEach(r => {
    let key;
    const date = new Date(r.createdAt);
    
    if (granularity === "daily") {
      key = date.toISOString().split("T")[0];
    } else if (granularity === "weekly") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else if (granularity === "monthly") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    
    if (!trendsMap.has(key)) {
      trendsMap.set(key, { sum: 0, count: 0 });
    }
    
    const data = trendsMap.get(key);
    data.sum += r.rating;
    data.count++;
  });
  
  // Calculate averages
  const trends = Array.from(trendsMap.entries()).map(([date, data]) => ({
    date,
    averageRating: parseFloat((data.sum / data.count).toFixed(2)),
    count: data.count
  }));
  
  // Calculate trend direction
  let trendDirection = "stable";
  let trendPercentage = 0;
  
  if (trends.length >= 2) {
    const firstAvg = trends[0].averageRating;
    const lastAvg = trends[trends.length - 1].averageRating;
    const diff = lastAvg - firstAvg;
    
    if (Math.abs(diff) > 0.1) {
      trendDirection = diff > 0 ? "improving" : "declining";
      trendPercentage = parseFloat(((diff / firstAvg) * 100).toFixed(2));
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      trends,
      trendDirection,
      trendPercentage
    }
  });
});

/**
 * Export ratings as CSV
 * GET /api/admin/ratings/export
 */
export const exportRatings = asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    rating: ratingFilter,
    buyerName,
    lowRatingsOnly
  } = req.query;
  
  // Build query (same as getRatings)
  const query = {};
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }
  
  if (ratingFilter) {
    const ratings = ratingFilter.split(",").map(r => parseInt(r)).filter(r => r >= 1 && r <= 5);
    if (ratings.length > 0) {
      query.rating = { $in: ratings };
    }
  }
  
  if (lowRatingsOnly === "true") {
    query.rating = { $lte: 3 };
  }
  
  // Fetch all ratings
  const ratings = await MilkQualityRating.find(query)
    .populate("buyerId", "username")
    .populate("orderId", "_id")
    .sort({ createdAt: -1 });
  
  // Filter by buyer name if provided
  let filteredRatings = ratings;
  if (buyerName) {
    const searchTerm = buyerName.toLowerCase();
    filteredRatings = ratings.filter(r => 
      r.buyerId && r.buyerId.username && r.buyerId.username.toLowerCase().includes(searchTerm)
    );
  }
  
  if (filteredRatings.length === 0) {
    return res.status(404).json({
      success: false,
      error: {
        code: "NO_DATA_TO_EXPORT",
        message: "No ratings match the current filters"
      }
    });
  }
  
  // Generate CSV
  const csvHeader = "Order ID,Buyer Name,Rating,Comments,Submission Date\n";
  const csvRows = filteredRatings.map(r => {
    const orderId = r.orderId ? r.orderId._id : "N/A";
    const buyerName = r.buyerId ? r.buyerId.username : "Unknown";
    const rating = r.rating;
    const comments = r.comments ? `"${r.comments.replace(/"/g, '""')}"` : "";
    const date = new Date(r.createdAt).toLocaleString();
    
    return `${orderId},${buyerName},${rating},${comments},${date}`;
  }).join("\n");
  
  const csv = csvHeader + csvRows;
  
  // Set headers for CSV download
  const filename = `milk-quality-ratings-${new Date().toISOString().split("T")[0]}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  
  res.status(200).send(csv);
});
