import mongoose from "mongoose";

const deliveryNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "order_confirmed",
        "delivery_person_assigned",
        "out_for_delivery",
        "delivery_completed",
        "order_cancelled",
        "new_order_alert",
        "order_accepted",
        "order_rejected",
        "proximity_alert",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data (orderId, etc.)
      default: {},
    },

    read: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    channels: {
      inApp: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
deliveryNotificationSchema.index({ userId: 1, createdAt: -1 });
deliveryNotificationSchema.index({ userId: 1, read: 1 });

// TTL index to auto-delete old notifications after 30 days (2592000 seconds)
deliveryNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("DeliveryNotification", deliveryNotificationSchema);
