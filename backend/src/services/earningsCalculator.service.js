import Earnings from "../models/Earnings.model.js";
import User from "../models/User.model.js";

// Configuration - can be moved to environment variables
const BASE_DELIVERY_FEE = parseFloat(process.env.BASE_DELIVERY_FEE) || 20; // Base fee in rupees
const DISTANCE_RATE = parseFloat(process.env.DISTANCE_RATE) || 5; // Rupees per kilometer

/**
 * Calculate earnings for a delivery
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {Object} {amount, baseFee, distanceFee}
 */
export const calculateEarnings = (distanceKm) => {
  const baseFee = BASE_DELIVERY_FEE;
  const distanceFee = distanceKm * DISTANCE_RATE;
  const amount = baseFee + distanceFee;

  return {
    amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
    baseFee,
    distanceFee: Math.round(distanceFee * 100) / 100,
  };
};

/**
 * Create earnings record for a completed delivery
 * @param {String} deliveryPersonId - Delivery person user ID
 * @param {String} orderId - Order ID
 * @param {Number} distanceKm - Distance in kilometers
 * @returns {Promise<Object>} Created earnings record
 */
export const createEarningsRecord = async (deliveryPersonId, orderId, distanceKm) => {
  try {
    const { amount, baseFee, distanceFee } = calculateEarnings(distanceKm);

    const earnings = await Earnings.create({
      deliveryPersonId,
      orderId,
      amount,
      baseFee,
      distanceFee,
      distanceKm,
      paymentStatus: "Pending",
    });

    // Update delivery person's total earnings in User model
    await User.findByIdAndUpdate(deliveryPersonId, {
      $inc: { "deliveryStats.totalDeliveries": 1 },
    });

    return earnings;
  } catch (error) {
    console.error("Error creating earnings record:", error);
    throw error;
  }
};

/**
 * Aggregate earnings for a delivery person by period
 * @param {String} deliveryPersonId - Delivery person user ID
 * @param {String} period - Period: 'daily', 'weekly', 'monthly'
 * @returns {Promise<Number>} Total earnings for the period
 */
export const aggregateEarnings = async (deliveryPersonId, period = "monthly") => {
  const now = new Date();
  let startDate;

  switch (period) {
    case "daily":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "weekly":
      const dayOfWeek = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const result = await Earnings.aggregate([
    {
      $match: {
        deliveryPersonId: deliveryPersonId,
        calculatedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: "$amount" },
        totalDeliveries: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalEarnings : 0;
};

/**
 * Get earnings breakdown for a delivery person
 * @param {String} deliveryPersonId - Delivery person user ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Array of earnings records
 */
export const getEarningsBreakdown = async (deliveryPersonId, startDate, endDate) => {
  return await Earnings.find({
    deliveryPersonId,
    calculatedAt: { $gte: startDate, $lte: endDate },
  })
    .populate("orderId", "quantity milkType totalAmount deliveryDate")
    .sort({ calculatedAt: -1 });
};

/**
 * Get payment history for a delivery person
 * @param {String} deliveryPersonId - Delivery person user ID
 * @returns {Promise<Array>} Array of paid earnings records
 */
export const getPaymentHistory = async (deliveryPersonId) => {
  return await Earnings.find({
    deliveryPersonId,
    paymentStatus: "Paid",
  })
    .populate("orderId", "quantity milkType totalAmount deliveryDate")
    .sort({ paidAt: -1 });
};

/**
 * Mark earnings as paid
 * @param {String} earningsId - Earnings record ID
 * @returns {Promise<Object>} Updated earnings record
 */
export const markEarningsAsPaid = async (earningsId) => {
  return await Earnings.findByIdAndUpdate(
    earningsId,
    {
      paymentStatus: "Paid",
      paidAt: new Date(),
    },
    { new: true }
  );
};

/**
 * Get total unpaid earnings for a delivery person
 * @param {String} deliveryPersonId - Delivery person user ID
 * @returns {Promise<Number>} Total unpaid earnings
 */
export const getUnpaidEarnings = async (deliveryPersonId) => {
  const result = await Earnings.aggregate([
    {
      $match: {
        deliveryPersonId: deliveryPersonId,
        paymentStatus: "Pending",
      },
    },
    {
      $group: {
        _id: null,
        totalUnpaid: { $sum: "$amount" },
      },
    },
  ]);

  return result.length > 0 ? result[0].totalUnpaid : 0;
};
