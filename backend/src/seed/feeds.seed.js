import Feed from "../models/Feed.model.js";
import User from "../models/User.model.js";
import mongoose from "mongoose";

const seedFeeds = async () => {
  try {
    console.log("🌱 Starting feed seeding...");

    // Clear existing feeds
    await Feed.deleteMany({});
    console.log("🗑️ Cleared existing feeds");

    // Get farmers and employees
    const farmers = await User.find({ role: "farmer" }).limit(5);
    const employees = await User.find({ role: "employee", employeeRole: "loan_feed_manager" }).limit(2);

    if (farmers.length === 0) {
      console.log("❌ No farmers found. Please seed users first.");
      return;
    }

    if (employees.length === 0) {
      console.log("❌ No loan/feed managers found. Please seed employees first.");
      return;
    }

    const feedTypes = ["cattle_feed", "buffalo_feed", "mixed_feed", "organic_feed", "concentrate", "roughage"];
    const statuses = ["approved", "delivered", "approved", "delivered", "approved"]; // More approved/delivered for testing

    const sampleFeeds = [];

    // Create 20 sample feed entries
    for (let i = 0; i < 20; i++) {
      const farmer = farmers[Math.floor(Math.random() * farmers.length)];
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const feedType = feedTypes[Math.floor(Math.random() * feedTypes.length)];
      const quantity = Math.floor(Math.random() * 500) + 50; // 50-550 kg
      const pricePerUnit = Math.floor(Math.random() * 20) + 30; // 30-50 per kg
      const totalAmount = quantity * pricePerUnit;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      const feed = {
        farmer: farmer._id,
        feedType,
        quantity,
        unit: "kg",
        pricePerUnit,
        totalAmount,
        status,
        requestDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        managedBy: employee._id,
        notes: `Sample ${feedType.replace('_', ' ')} request for ${farmer.username}`,
        paymentStatus: Math.random() > 0.5 ? "completed" : "partial",
        paidAmount: Math.random() > 0.3 ? totalAmount : Math.floor(totalAmount * 0.7),
        supplier: `Supplier ${Math.floor(Math.random() * 3) + 1}`,
        batchNumber: `BATCH${Date.now()}${i}`,
        expiryDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000) // Random expiry within 6 months
      };

      if (status === "approved") {
        feed.approvedDate = new Date(feed.requestDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
      }

      if (status === "delivered") {
        feed.approvedDate = new Date(feed.requestDate.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
        feed.deliveredDate = new Date(feed.approvedDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);
      }

      sampleFeeds.push(feed);
    }

    // Insert feeds
    const createdFeeds = await Feed.insertMany(sampleFeeds);
    console.log(`✅ Created ${createdFeeds.length} sample feeds`);

    // Log summary
    const statusCounts = await Feed.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    console.log("📊 Feed Summary:");
    statusCounts.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} feeds, ${stat.totalQuantity} kg, ₹${stat.totalAmount}`);
    });

    // Calculate unique farmers
    const uniqueFarmers = await Feed.distinct("farmer");
    console.log(`👥 Unique farmers with feed requests: ${uniqueFarmers.length}`);

    console.log("🎉 Feed seeding completed successfully!");

  } catch (error) {
    console.error("❌ Feed seeding failed:", error);
  }
};

export default seedFeeds;