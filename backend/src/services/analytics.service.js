import MilkEntry from "../models/MilkEntry.model.js";
import Billing from "../models/Billing.model.js";

/**
 * Admin analytics
 */
export async function adminAnalyticsData() {
  const milk = await MilkEntry.aggregate([
    { $group: { _id: null, totalMilk: { $sum: "$liters" } } },
  ]);

  const revenue = await Billing.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
  ]);

  return {
    totalMilk: milk[0]?.totalMilk || 0,
    totalRevenue: revenue[0]?.totalRevenue || 0,
  };
}
