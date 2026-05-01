import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["buyer", "delivery_boy"],
      required: true,
    },

    senderName: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 1000,
      trim: true,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

// Compound indexes for efficient queries
chatMessageSchema.index({ orderId: 1, createdAt: 1 });
chatMessageSchema.index({ orderId: 1, isRead: 1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
