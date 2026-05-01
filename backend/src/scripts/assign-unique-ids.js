import mongoose from "mongoose";
import User from "../models/User.model.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { env } from "../config/env.js";

// Connect to MongoDB
await mongoose.connect(env.MONGO_URI);

console.log("🔄 Starting unique ID assignment for existing users...");

async function assignUniqueIdsToExistingUsers() {
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

    console.log(`📊 Found ${usersWithoutIds.length} users without unique IDs`);

    if (usersWithoutIds.length === 0) {
      console.log("✅ All approved users already have unique IDs");
      return;
    }

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
          mobile: user.mobile,
          uniqueId: uniqueId
        });
        
        assignedCount++;
        console.log(`✅ Assigned ${uniqueId} to ${user.role} ${user.username} (${user.mobile})`);
      } catch (error) {
        console.error(`❌ Failed to assign ID to user ${user.username}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully assigned unique IDs to ${assignedCount}/${usersWithoutIds.length} users`);
    
    // Display summary by role
    const summary = assignments.reduce((acc, assignment) => {
      acc[assignment.role] = (acc[assignment.role] || 0) + 1;
      return acc;
    }, {});

    console.log("\n📋 Summary by role:");
    Object.entries(summary).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    // Also assign IDs to any pending users that might need them later
    const pendingUsers = await User.find({
      role: { $in: ["farmer", "buyer", "employee"] },
      approved: false,
      isVerified: true,
      $or: [
        { uniqueId: { $exists: false } },
        { uniqueId: null },
        { uniqueId: "" }
      ]
    });

    if (pendingUsers.length > 0) {
      console.log(`\n🔄 Found ${pendingUsers.length} pending verified users. Assigning IDs for future approval...`);
      
      let pendingAssigned = 0;
      for (const user of pendingUsers) {
        try {
          const uniqueId = await generateUniqueId(user.role);
          await User.updateOne({ _id: user._id }, { uniqueId });
          pendingAssigned++;
          console.log(`✅ Pre-assigned ${uniqueId} to pending ${user.role} ${user.username}`);
        } catch (error) {
          console.error(`❌ Failed to pre-assign ID to ${user.username}:`, error.message);
        }
      }
      console.log(`✅ Pre-assigned IDs to ${pendingAssigned} pending users`);
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the migration
assignUniqueIdsToExistingUsers();