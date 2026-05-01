import mongoose from "mongoose";

const transportSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // Cow milk data
    cowMilkCollected: {
      type: Number,
      required: true,
      default: 0,
    },
    cowMilkSold: {
      type: Number,
      required: true,
      default: 0,
    },
    cowMilkTransported: {
      type: Number,
      required: true,
      default: 0,
    },
    cowCollectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    cowSaleAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    cowTransportAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    // Buffalo milk data
    buffaloMilkCollected: {
      type: Number,
      required: true,
      default: 0,
    },
    buffaloMilkSold: {
      type: Number,
      required: true,
      default: 0,
    },
    buffaloMilkTransported: {
      type: Number,
      required: true,
      default: 0,
    },
    buffaloCollectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    buffaloSaleAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    buffaloTransportAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    // Legacy fields for backward compatibility
    totalMilkCollected: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMilkSold: {
      type: Number,
      required: true,
      default: 0,
    },
    transportMilk: {
      type: Number,
      required: true,
      default: 0,
    },
    collectionAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    saleAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    transportAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "transported", "completed"],
      default: "pending",
    },
    transportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
    },
    // Completion details (filled when marking as completed)
    completionDetails: {
      cow: {
        quantity: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
      buffalo: {
        quantity: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
      },
      totalAmount: {
        type: Number,
        default: 0,
      },
      completedAt: {
        type: Date,
      },
    },
  },
  { timestamps: true }
);

// Index for efficient date queries
transportSchema.index({ date: -1 });

export default mongoose.model("Transport", transportSchema);