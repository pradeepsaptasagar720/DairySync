import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    milkType: {
      type: String,
      enum: ["cow", "buffalo"],
      required: true,
      default: "cow",
    },

    quantity: {
      type: Number,
      required: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    // Live location coordinates
    liveLocation: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      accuracy: {
        type: Number,
      },
      timestamp: {
        type: Date,
      },
      isLive: {
        type: Boolean,
        default: false,
      }
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    frequency: {
      type: String,
      enum: ["one-time", "daily", "weekly", "custom"],
      default: "one-time",
    },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Out for Delivery", "Completed", "Cancelled"],
      default: "Pending",
    },

    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Employee
    },

    // Payment related fields
    paymentMethod: {
      type: String,
      enum: ["cod", "upi", "card"],
      default: "cod",
    },

    paymentCompleted: {
      type: Boolean,
      default: false,
    },

    paymentDate: {
      type: Date,
    },

    notes: {
      type: String,
    },

    completedAt: {
      type: Date,
    },

    // New optional fields for comprehensive delivery management
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for backward compatibility
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },

    outForDeliveryAt: {
      type: Date,
      default: null,
    },

    deliveryProofPhoto: {
      type: String, // URL to photo
      default: null,
    },

    distanceKm: {
      type: Number, // Distance from dairy to buyer
      default: null,
      min: 0,
    },

    estimatedDeliveryTime: {
      type: Number, // Minutes
      default: null,
      min: 0,
    },

    rejectionReason: {
      type: String,
      default: null,
    },

    rejectedBy: [
      {
        deliveryPersonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        timestamp: Date,
      },
    ],

    // OTP-related fields
    otpRequired: {
      type: Boolean,
      default: true
      // Can be disabled for testing or special cases
    },
    
    otpVerified: {
      type: Boolean,
      default: false
    },
    
    otpVerifiedAt: {
      type: Date,
      default: null
    },
    
    // Rating fields
    rated: {
      type: Boolean,
      default: false
    },
    
    ratingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rating',
      default: null
    },

    // Chat and milk quality rating fields
    chatEnabled: {
      type: Boolean,
      default: true,
    },

    lastChatActivity: {
      type: Date,
      default: null,
    },

    unreadMessagesCount: {
      buyer: { type: Number, default: 0 },
      deliveryBoy: { type: Number, default: 0 },
    },

    milkQualityRated: {
      type: Boolean,
      default: false,
    },

    milkQualityRatingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MilkQualityRating",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Delivery", deliverySchema);
