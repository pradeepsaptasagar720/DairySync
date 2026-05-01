import mongoose from "mongoose";

const earningsSchema = new mongoose.Schema(
  {
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true, // One earnings record per order
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    baseFee: {
      type: Number,
      required: true,
      min: 0,
    },

    distanceFee: {
      type: Number,
      required: true,
      min: 0,
    },

    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Indexes for efficient aggregation
earningsSchema.index({ deliveryPersonId: 1, calculatedAt: -1 });
earningsSchema.index({ deliveryPersonId: 1, paymentStatus: 1 });
earningsSchema.index({ orderId: 1 });

export default mongoose.model("Earnings", earningsSchema);
