import mongoose from "mongoose";

const billingSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    milkEntries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MilkEntry",
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    billingPeriod: {
      type: String, // Weekly / Monthly
    },
  },
  { timestamps: true }
);

export default mongoose.model("Billing", billingSchema);
