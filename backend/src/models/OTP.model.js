import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    unique: true,
    index: true
  },
  
  otpHash: {
    type: String,
    required: true
    // Stored as bcrypt hash for security
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
    // 10 minutes from generation
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  verificationAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  resendCount: {
    type: Number,
    default: 0,
    max: 3
  },
  
  lastResendAt: {
    type: Date,
    default: null
  },
  
  smsStatus: {
    sent: { type: Boolean, default: false },
    messageId: { type: String },
    sentAt: { type: Date },
    error: { type: String }
  },
  
  locked: {
    type: Boolean,
    default: false
    // Locked after max attempts exceeded
  }
}, {
  timestamps: true
});

// TTL index to auto-delete expired OTPs after 30 days
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("OTP", otpSchema);
