import mongoose from "mongoose";
import MilkEntry from "../models/MilkEntry.model.js";
import Billing from "../models/Billing.model.js";
import User from "../models/User.model.js";
import { env } from "../config/env.js";

await mongoose.connect(env.MONGO_URI);

// Create sample farmers and buyers if they don't exist
const sampleFarmer = await User.findOne({ role: "farmer" }) || await User.create({
  username: "farmer1",
  mobile: "1234567890",
  password: "$2a$10$dummy", // dummy password
  role: "farmer",
  isVerified: true,
  approved: true
});

const sampleBuyer = await User.findOne({ role: "buyer" }) || await User.create({
  username: "buyer1", 
  mobile: "1234567891",
  password: "$2a$10$dummy", // dummy password
  role: "buyer",
  isVerified: true,
  approved: true
});

// Create sample milk entries for today
const today = new Date();
await MilkEntry.create([
  {
    farmer: sampleFarmer._id,
    liters: 50,
    rate: 45,
    totalAmount: 50 * 45,
    createdAt: today
  },
  {
    farmer: sampleFarmer._id,
    liters: 30,
    rate: 45,
    totalAmount: 30 * 45,
    createdAt: today
  }
]);

// Create sample buyer billing for today
const billingEntries = await Billing.create([
  {
    buyer: sampleBuyer._id,
    totalAmount: 900,
    createdAt: today
  },
  {
    buyer: sampleBuyer._id,
    totalAmount: 675,
    createdAt: today
  }
]);

console.log("✅ Sample data created for transport testing");
console.log("- Total milk collected: 80L (₹3600)");
console.log("- Total milk sold to buyers: ~35L (₹1575)");
console.log("- Transport milk available: ~45L (₹2025)");
console.log("- Billing records created:", billingEntries.length);

process.exit();