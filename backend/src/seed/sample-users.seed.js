import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import RateChart from "../models/RateChart.model.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { env } from "../config/env.js";

await mongoose.connect(env.MONGO_URI);

console.log("🌱 Seeding sample users...");

// Set default milk rate
await RateChart.findOneAndUpdate({}, { rate: 45 }, { upsert: true });
console.log("✅ Default milk rate set to ₹45");

// Sample users data
const sampleUsers = [
  // Farmers
  { username: "farmer1", mobile: "9876543210", role: "farmer", approved: true },
  { username: "farmer2", mobile: "9876543211", role: "farmer", approved: true },
  { username: "farmer3", mobile: "9876543212", role: "farmer", approved: false }, // Pending approval
  { username: "farmer4", mobile: "9876543213", role: "farmer", approved: true },
  { username: "farmer5", mobile: "9876543214", role: "farmer", approved: false }, // Pending approval
  
  // Buyers
  { username: "buyer1", mobile: "9876543220", role: "buyer", approved: true },
  { username: "buyer2", mobile: "9876543221", role: "buyer", approved: true },
  { username: "buyer3", mobile: "9876543222", role: "buyer", approved: false }, // Pending approval
  { username: "buyer4", mobile: "9876543223", role: "buyer", approved: true },
  
  // Employees
  { username: "employee1", mobile: "9876543230", role: "employee", approved: true, employeeRole: "general" },
  { username: "employee2", mobile: "9876543231", role: "employee", approved: true, employeeRole: "milk_collection" },
  { username: "employee3", mobile: "9876543232", role: "employee", approved: false, employeeRole: "milk_delivery" }, // Pending approval
];

const password = "Test123!";
const hashedPassword = await bcrypt.hash(password, 10);

let created = 0;
let skipped = 0;

for (const userData of sampleUsers) {
  const existingUser = await User.findOne({ 
    $or: [{ username: userData.username }, { mobile: userData.mobile }] 
  });
  
  if (!existingUser) {
    // Generate unique ID for approved users
    let uniqueId = null;
    if (userData.approved) {
      try {
        uniqueId = await generateUniqueId(userData.role);
      } catch (error) {
        console.error(`Failed to generate unique ID for ${userData.username}:`, error.message);
      }
    }

    await User.create({
      ...userData,
      password: hashedPassword,
      isVerified: true,
      uniqueId: uniqueId,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    });
    
    console.log(`✅ Created ${userData.role} ${userData.username}${uniqueId ? ` with ID ${uniqueId}` : ' (pending approval)'}`);
    created++;
  } else {
    // If user exists but doesn't have unique ID and is approved, assign one
    if (existingUser.approved && !existingUser.uniqueId) {
      try {
        const uniqueId = await generateUniqueId(existingUser.role);
        await User.updateOne({ _id: existingUser._id }, { uniqueId });
        console.log(`✅ Assigned ID ${uniqueId} to existing user ${existingUser.username}`);
      } catch (error) {
        console.error(`Failed to assign ID to existing user ${existingUser.username}:`, error.message);
      }
    }
    skipped++;
  }
}

console.log(`✅ Created ${created} sample users`);
console.log(`ℹ️ Skipped ${skipped} existing users`);
console.log(`📝 Default password for all users: ${password}`);

// Display summary of created users with their IDs
console.log("\n📋 User Summary:");
const allUsers = await User.find({ 
  role: { $in: ["farmer", "buyer", "employee"] } 
}).select('username role uniqueId approved');

const summary = allUsers.reduce((acc, user) => {
  if (!acc[user.role]) acc[user.role] = { approved: 0, pending: 0, withIds: 0 };
  if (user.approved) {
    acc[user.role].approved++;
    if (user.uniqueId) acc[user.role].withIds++;
  } else {
    acc[user.role].pending++;
  }
  return acc;
}, {});

Object.entries(summary).forEach(([role, stats]) => {
  console.log(`  ${role}s: ${stats.approved} approved (${stats.withIds} with IDs), ${stats.pending} pending`);
});

process.exit();