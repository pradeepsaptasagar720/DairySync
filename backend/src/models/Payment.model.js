import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    billing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
    },

    amount: {
      type: Number,
      required: true,
    },

    mode: {
      type: String,
      enum: ["ONLINE", "COD"],
      required: true,
    },

    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
