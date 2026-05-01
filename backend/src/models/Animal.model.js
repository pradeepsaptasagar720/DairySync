import mongoose from "mongoose";

const animalSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    animalType: {
      type: String,
      enum: ["cow", "buffalo"],
      required: true,
    },
    breed: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    milkCapacity: {
      type: Number,
      required: true,
      min: 0,
    },
    healthStatus: {
      type: String,
      enum: ["healthy", "sick", "pregnant", "dry"],
      default: "healthy",
    },
    lastVaccination: {
      type: Date,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    tagNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
animalSchema.index({ farmer: 1, animalType: 1 });
animalSchema.index({ tagNumber: 1 });

export default mongoose.model("Animal", animalSchema);