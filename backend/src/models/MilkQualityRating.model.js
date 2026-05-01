import mongoose from "mongoose";

const milkQualityRatingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true, // Prevent duplicate ratings
      index: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: "Rating must be an integer",
      },
    },

    comments: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Prevent modification
      index: true,
    },
  },
  { timestamps: false }
);

// Indexes for efficient queries
milkQualityRatingSchema.index({ createdAt: -1 });
milkQualityRatingSchema.index({ rating: 1 });
milkQualityRatingSchema.index({ buyerId: 1, createdAt: -1 });

export default mongoose.model("MilkQualityRating", milkQualityRatingSchema);
