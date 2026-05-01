import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connect to MongoDB
 */
export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}
