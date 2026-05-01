import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { env } from "../config/env.js";
import { generateUniqueId } from "../utils/idGenerator.js";

await mongoose.connect(env.MONGO_URI);

const employees = [
  {
    username: "milk_collector_1",
    mobile: "9999999991",
    password: "employee@123",
    role: "employee",
    employeeRole: "milk_collector",
    isVerified: true,
    approved: true,
    isActive: true,
    passwordResetRequired: false
  },
  {
    username: "delivery_staff_1",
    mobile: "9999999992",
    password: "employee@123",
    role: "employee",
    employeeRole: "delivery_boy",
    isVerified: true,
    approved: true,
    isActive: true,
    passwordResetRequired: false
  },
  {
    username: "loan_feed_manager_1",
    mobile: "9999999993",
    password: "employee@123",
    role: "employee",
    employeeRole: "loan_feed_manager",
    isVerified: true,
    approved: true,
    isActive: true,
    passwordResetRequired: false
  }
];

for (const employeeData of employees) {
  const existing = await User.findOne({ mobile: employeeData.mobile });
  
  if (!existing) {
    const hashedPassword = await bcrypt.hash(employeeData.password, 10);
    const uniqueId = await generateUniqueId("employee");
    
    await User.create({
      ...employeeData,
      password: hashedPassword,
      uniqueId
    });
    
    console.log(`✅ Created ${employeeData.employeeRole}: ${employeeData.username} (${employeeData.mobile})`);
  } else {
    console.log(`ℹ️ Employee ${employeeData.username} already exists — skipping`);
  }
}

console.log("\n🎉 Employee seeding completed!");
console.log("\nTest Credentials:");
console.log("Milk Collector: 9999999991 / employee@123");
console.log("Delivery Staff: 9999999992 / employee@123");
console.log("Loan & Feed Manager: 9999999993 / employee@123");

process.exit();