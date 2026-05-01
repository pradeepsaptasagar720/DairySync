import mongoose from "mongoose";

const otpLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    enum: ['generate', 'verify_success', 'verify_failure', 'resend', 'expire', 'lock'],
    required: true
  },
  
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    // Flexible field for additional context:
    // - enteredOTP (for verification attempts)
    // - errorMessage
    // - ipAddress
    // - userAgent
    // - resendReason
  },
  
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Delivery boy who performed the action
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// TTL index to auto-delete logs after 90 days
otpLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model("OTPLog", otpLogSchema);
