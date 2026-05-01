import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { env } from "../config/env.js";

await mongoose.connect(env.MONGO_URI);

const admin = await User.findOne({
  $or: [{ username: "admin" }, { mobile: "9999999999" }],
});

if (!admin) {
  const hashed = await bcrypt.hash("admin@123", 10);

  await User.create({
    username: "admin",
    mobile: "9999999999",
    password: hashed,
    role: "admin",
    isVerified: true,
    approved: true,
  });

  console.log("✅ Default admin created");
} else {
  console.log("ℹ️ Admin already exists — skipping seed");
}

process.exit();
