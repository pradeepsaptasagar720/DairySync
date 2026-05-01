import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["dairy_opened", "dairy_closing_soon", "dairy_closed", "manual"],
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    recipients: {
      type: [String],
      enum: ["farmers", "buyers", "employees", "all"],
      required: true,
    },

    sentTo: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      mobile: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      sentAt: {
        type: Date,
      },
      error: {
        type: String,
      }
    }],

    scheduledFor: {
      type: Date,
    },

    isScheduled: {
      type: Boolean,
      default: false,
    },

    isProcessed: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    dairyInfo: {
      dairyName: String,
      openingTime: String,
      closingTime: String,
    }
  },
  { timestamps: true }
);

// Add indexes for efficient queries
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);