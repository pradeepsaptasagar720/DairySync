import mongoose from "mongoose";

const feedStockSchema = new mongoose.Schema(
  {
    feedType: {
      type: String,
      required: true,
      enum: ["cattle_feed", "buffalo_feed", "mixed_feed", "organic_feed", "concentrate", "roughage"],
      trim: true,
    },

    currentStock: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "ton"],
      default: "kg",
    },

    maxCapacity: {
      type: Number,
      required: true,
      min: 0,
    },

    minThreshold: {
      type: Number,
      required: true,
      min: 0,
    },

    supplier: {
      type: String,
      trim: true,
    },

    lastRestockDate: {
      type: Date,
      default: Date.now,
    },

    nextRestockDate: {
      type: Date,
    },

    costPerUnit: {
      type: Number,
      min: 0,
    },

    location: {
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

    notes: {
      type: String,
      trim: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    stockHistory: [{
      action: {
        type: String,
        enum: ["restock", "consumption", "wastage", "adjustment"],
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      previousStock: {
        type: Number,
        required: true,
      },
      newStock: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      notes: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    }],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for stock percentage
feedStockSchema.virtual('stockPercentage').get(function() {
  return this.maxCapacity > 0 ? (this.currentStock / this.maxCapacity) * 100 : 0;
});

// Virtual for checking if stock is low
feedStockSchema.virtual('isLowStock').get(function() {
  return this.currentStock <= this.minThreshold;
});

// Virtual for checking if stock is critical (less than 50% of minimum threshold)
feedStockSchema.virtual('isCriticalStock').get(function() {
  return this.currentStock <= (this.minThreshold * 0.5);
});

// Virtual for checking if feed is expired
feedStockSchema.virtual('isExpired').get(function() {
  return this.expiryDate && new Date() > this.expiryDate;
});

// Virtual for days until expiry
feedStockSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const diffTime = this.expiryDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index for efficient queries
feedStockSchema.index({ feedType: 1 });
feedStockSchema.index({ currentStock: 1 });
feedStockSchema.index({ minThreshold: 1 });
feedStockSchema.index({ expiryDate: 1 });
feedStockSchema.index({ lastRestockDate: -1 });
feedStockSchema.index({ updatedBy: 1 });

// Ensure unique feed type
feedStockSchema.index({ feedType: 1 }, { unique: true });

// Pre-save middleware to add stock history
feedStockSchema.pre('save', function(next) {
  if (this.isModified('currentStock') && !this.isNew) {
    // Get the previous stock value
    const previousStock = this._original ? this._original.currentStock : 0;
    
    // Determine action based on stock change
    let action = 'adjustment';
    const stockDiff = this.currentStock - previousStock;
    
    if (stockDiff > 0) {
      action = 'restock';
    } else if (stockDiff < 0) {
      action = 'consumption';
    }
    
    // Add to stock history
    this.stockHistory.push({
      action,
      quantity: Math.abs(stockDiff),
      previousStock,
      newStock: this.currentStock,
      updatedBy: this.updatedBy,
      notes: this.notes
    });
  }
  
  next();
});

// Pre-find middleware to store original values
feedStockSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function() {
  this.setOptions({ runValidators: true });
});

export default mongoose.model("FeedStock", feedStockSchema);