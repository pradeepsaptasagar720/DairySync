import Rating from "../models/Rating.model.js";
import Delivery from "../models/Delivery.model.js";
import User from "../models/User.model.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

/**
 * Submit a rating for a completed order
 * POST /api/orders/:orderId/rating
 */
export const submitRating = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { stars, feedback = "" } = req.body;
  const buyerId = req.user.id;

  // Validate star rating
  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_RATING",
        message: "Rating must be between 1 and 5 stars"
      }
    });
  }

  // Check if order exists and belongs to buyer
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

  if (order.buyer.toString() !== buyerId) {
    return res.status(403).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You can only rate your own orders"
      }
    });
  }

  // Check if order is completed
  if (order.status !== "Completed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "ORDER_NOT_COMPLETED",
        message: "You can only rate completed orders"
      }
    });
  }

  // Check if delivery person is assigned
  if (!order.deliveryPersonId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "NO_DELIVERY_PERSON",
        message: "No delivery person assigned to this order"
      }
    });
  }

  // Check for duplicate rating
  const existingRating = await Rating.findOne({ orderId });
  if (existingRating) {
    return res.status(400).json({
      success: false,
      error: {
        code: "DUPLICATE_RATING",
        message: "You have already rated this order"
      }
    });
  }

  // Create rating
  const rating = await Rating.create({
    orderId,
    buyerId,
    deliveryPersonId: order.deliveryPersonId,
    stars,
    feedback
  });

  // Update delivery person's average rating
  await updateDeliveryPersonRating(order.deliveryPersonId);

  res.status(201).json({
    success: true,
    data: rating,
    message: "Rating submitted successfully"
  });
});

/**
 * Get ratings for a delivery person
 * GET /api/delivery-persons/:id/ratings
 */
export const getDeliveryPersonRatings = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const ratings = await Rating.find({ deliveryPersonId: id })
    .populate("buyerId", "username")
    .populate("orderId", "quantity milkType totalAmount deliveryDate")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Rating.countDocuments({ deliveryPersonId: id });

  // Calculate average rating
  const avgResult = await Rating.aggregate([
    { $match: { deliveryPersonId: id } },
    { $group: { _id: null, averageRating: { $avg: "$stars" }, totalRatings: { $sum: 1 } } }
  ]);

  const averageRating = avgResult.length > 0 ? avgResult[0].averageRating : 0;
  const totalRatings = avgResult.length > 0 ? avgResult[0].totalRatings : 0;

  res.json({
    success: true,
    data: {
      ratings,
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    },
    message: "Ratings retrieved successfully"
  });
});

/**
 * Helper function to update delivery person's average rating
 */
const updateDeliveryPersonRating = async (deliveryPersonId) => {
  const result = await Rating.aggregate([
    { $match: { deliveryPersonId } },
    { $group: { _id: null, averageRating: { $avg: "$stars" }, totalRatings: { $sum: 1 } } }
  ]);

  if (result.length > 0) {
    await User.findByIdAndUpdate(deliveryPersonId, {
      "deliveryStats.averageRating": Math.round(result[0].averageRating * 10) / 10,
      "deliveryStats.totalRatings": result[0].totalRatings
    });
  }
};
