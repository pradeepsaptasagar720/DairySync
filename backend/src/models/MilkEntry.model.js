import mongoose from "mongoose";

const milkEntrySchema = new mongoose.Schema(
  {
    // Basic Entry Information
    date: {
      type: String, // YYYY-MM-DD format
      required: true,
    },

    session: {
      type: String,
      enum: ["Morning", "Evening"],
      required: true,
    },

    time: {
      type: String, // HH:MM:SS format
      required: true,
    },

    // Farmer Information
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    farmerUniqueId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^F\d{6}$/,
      index: true
    },

    farmerName: {
      type: String,
      required: true,
      trim: true,
    },

    // Employee Information
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Employee
      required: true,
    },

    collectedByUniqueId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^E\d{6}$/
    },

    collectedByName: {
      type: String,
      required: true,
      trim: true,
    },

    collectedByRole: {
      type: String,
      enum: ["milk_collector", "admin"],
      required: true,
    },

    // Cow Milk Data
    cow: {
      quantity: {
        type: Number,
        min: 0,
        default: 0,
      },
      fat: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      rate: {
        type: Number,
        min: 0,
        default: 0,
      },
      amount: {
        type: Number,
        min: 0,
        default: 0,
      }
    },

    // Buffalo Milk Data
    buffalo: {
      quantity: {
        type: Number,
        min: 0,
        default: 0,
      },
      fat: {
        type: Number,
        min: 0,
        max: 10,
        default: 0,
      },
      rate: {
        type: Number,
        min: 0,
        default: 0,
      },
      amount: {
        type: Number,
        min: 0,
        default: 0,
      }
    },

    // Total Amount
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Receipt Information
    receiptGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient searching
milkEntrySchema.index({ farmerUniqueId: 1 });
milkEntrySchema.index({ collectedByUniqueId: 1 });
milkEntrySchema.index({ date: 1, session: 1 });
milkEntrySchema.index({ date: 1 });

// Virtual for total milk quantity
milkEntrySchema.virtual('totalQuantity').get(function() {
  return (this.cow?.quantity || 0) + (this.buffalo?.quantity || 0);
});

// Virtual for weighted average fat percentage
milkEntrySchema.virtual('averageFat').get(function() {
  const cowQuantity = this.cow?.quantity || 0;
  const buffaloQuantity = this.buffalo?.quantity || 0;
  const totalQuantity = cowQuantity + buffaloQuantity;
  
  if (totalQuantity === 0) return 0;
  
  const cowFat = cowQuantity * (this.cow?.fat || 0);
  const buffaloFat = buffaloQuantity * (this.buffalo?.fat || 0);
  
  return ((cowFat + buffaloFat) / totalQuantity).toFixed(2);
});

export default mongoose.model("MilkEntry", milkEntrySchema);
