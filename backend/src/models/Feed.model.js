import mongoose from "mongoose";

const feedSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    feedType: {
      type: String,
      required: true,
      enum: ["cattle_feed", "buffalo_feed", "mixed_feed", "organic_feed", "concentrate", "roughage"],
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      default: "kg",
    },

    pricePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "delivered", "cancelled"],
      default: "pending",
    },

    requestDate: {
      type: Date,
      default: Date.now,
    },

    approvedDate: {
      type: Date,
    },

    deliveryDate: {
      type: Date,
    },

    deliveredDate: {
      type: Date,
    },

    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "completed"],
      default: "pending",
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    supplier: {
      type: String,
      trim: true,
    },

    batchNumber: {
      type: String,
      trim: true,
    },

    expiryDate: {
      type: Date,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for remaining payment amount
feedSchema.virtual('remainingAmount').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Virtual for checking if feed is expired
feedSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Index for efficient queries
feedSchema.index({ farmer: 1, status: 1 });
feedSchema.index({ managedBy: 1 });
feedSchema.index({ feedType: 1 });
feedSchema.index({ requestDate: -1 });
feedSchema.index({ deliveryDate: 1 });
feedSchema.index({ expiryDate: 1 });

// Pre-save middleware to set dates based on status
feedSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'approved':
        if (!this.approvedDate) {
          this.approvedDate = now;
        }
        break;
      case 'delivered':
        if (!this.deliveredDate) {
          this.deliveredDate = now;
        }
        break;
    }
  }
  
  // Update payment status based on paid amount
  if (this.isModified('paidAmount')) {
    if (this.paidAmount >= this.totalAmount) {
      this.paymentStatus = 'completed';
    } else if (this.paidAmount > 0) {
      this.paymentStatus = 'partial';
    } else {
      this.paymentStatus = 'pending';
    }
  }
  
  next();
});

export default mongoose.model("Feed", feedSchema);