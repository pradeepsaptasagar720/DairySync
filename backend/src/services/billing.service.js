import Billing from "../models/Billing.model.js";
import MilkEntry from "../models/MilkEntry.model.js";

/**
 * Generate bill for a farmer
 */
export async function generateFarmerBill(farmerId, period = "Monthly") {
  const entries = await MilkEntry.find({ farmer: farmerId });

  const total = entries.reduce(
    (sum, e) => sum + e.totalAmount,
    0
  );

  const bill = await Billing.create({
    farmer: farmerId,
    milkEntries: entries.map((e) => e._id),
    totalAmount: total,
    billingPeriod: period,
  });

  return bill;
}
