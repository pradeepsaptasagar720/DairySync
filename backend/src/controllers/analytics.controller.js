import MilkEntry from "../models/MilkEntry.model.js";

export async function adminAnalytics(req, res) {
  const data = await MilkEntry.aggregate([
    { $group: { _id: null, totalMilk: { $sum: "$liters" } } },
  ]);

  res.json(data);
}
