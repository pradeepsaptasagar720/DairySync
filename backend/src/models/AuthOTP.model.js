import mongoose from "mongoose";

const authOtpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true
  },
  
  otp: {
    type: String,
    required: true
  },
  
  purpose: {
    type: String,
    enum: ["REGISTER", "RESET", "LOGIN"],
    required: true
  },
  
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    index: true
  }
}, {
  timestamps: true
});

// TTL index to auto-delete expired OTPs after 15 minutes
authOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export default mongoose.model("AuthOTP", authOtpSchema);
