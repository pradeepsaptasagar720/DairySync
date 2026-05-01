import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV || "development",
};

export function validateEnv() {
  if (!env.MONGO_URI) {
    throw new Error("❌ MONGO_URI missing in environment");
  }
  if (!env.JWT_SECRET) {
    throw new Error("❌ JWT_SECRET missing in environment");
  }
}
