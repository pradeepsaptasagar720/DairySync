import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true, // Prevent duplicate ratings for same order
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    stars: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: function(value) {
          return Number.isInteger(value) && value >= 1 && value <= 5;
        },
        message: "Rating must be an integer between 1 and 5",
      },
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ratingSchema.index({ deliveryPersonId: 1, createdAt: -1 });
ratingSchema.index({ orderId: 1 });
ratingSchema.index({ buyerId: 1 });

export default mongoose.model("Rating", ratingSchema);
