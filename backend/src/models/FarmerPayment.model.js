import mongoose from "mongoose";

const farmerPaymentSchema = new mongoose.Schema(
  {
    // Farmer identification
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    farmerName: {
      type: String,
      required: true,
    },

    farmerMobile: {
      type: String,
      required: true,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Breakdown by milk type
    cowMilkAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    buffaloMilkAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    paymentType: {
      type: String,
      enum: ["cash", "bank_transfer", "upi", "cheque", "other"],
      required: true,
    },

    // Milk type for this payment
    milkType: {
      type: String,
      enum: ["cow", "buffalo", "mixed"],
      default: "mixed",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Bill period this payment covers
    billPeriod: {
      dateFrom: {
        type: Date,
      },
      dateTo: {
        type: Date,
      }
    },

    // Processing details
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },

    // Additional information
    notes: {
      type: String,
      trim: true,
    },

    // Reference number for tracking
    referenceNumber: {
      type: String,
      unique: true,
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Generate reference number before saving
farmerPaymentSchema.pre('save', function(next) {
  if (!this.referenceNumber) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.referenceNumber = `FP${date}${random}`;
  }
  
  // Automatically determine milk type based on amounts
  if (this.cowMilkAmount > 0 && this.buffaloMilkAmount > 0) {
    this.milkType = 'mixed';
  } else if (this.cowMilkAmount > 0) {
    this.milkType = 'cow';
  } else if (this.buffaloMilkAmount > 0) {
    this.milkType = 'buffalo';
  } else {
    this.milkType = 'mixed'; // Default for legacy data
  }
  
  next();
});

// Indexes for efficient queries
farmerPaymentSchema.index({ farmer: 1, paymentDate: -1 });
farmerPaymentSchema.index({ processedBy: 1 });
farmerPaymentSchema.index({ paymentType: 1 });
farmerPaymentSchema.index({ milkType: 1 });
farmerPaymentSchema.index({ paymentDate: -1 });
farmerPaymentSchema.index({ referenceNumber: 1 });
farmerPaymentSchema.index({ status: 1 });

export default mongoose.model("FarmerPayment", farmerPaymentSchema);