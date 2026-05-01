import mongoose from "mongoose";

const rateRowSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  fat: {
    type: Number,
    default: 0
  },
  rate: {
    type: Number,
    default: 0
  }
}, { _id: false });

const rangeSettingsSchema = new mongoose.Schema({
  startFat: {
    type: Number,
    default: 0
  },
  endFat: {
    type: Number,
    default: 0
  },
  baseRate: {
    type: Number,
    default: 0
  },
  difference: {
    type: Number,
    default: 0
  }
}, { _id: false });

const rateChartSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    // Dynamic cow milk rates
    cowRates: [rateRowSchema],

    // Dynamic buffalo milk rates
    buffaloRates: [rateRowSchema],

    // Range calculation settings
    rangeSettings: rangeSettingsSchema,

    // Legacy fields for backward compatibility
    rate: {
      type: Number,
      default: 0
    },

    // Cow Milk Rates (legacy)
    cowMilk: {
      fat: {
        type: Number,
        default: 0
      },
      snf: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },

    // Buffalo Milk Rates (legacy)
    buffaloMilk: {
      fat: {
        type: Number,
        default: 0
      },
      snf: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      }
    },

    // Fat Analysis Data (legacy)
    fatAnalysis: {
      startFat: {
        type: Number,
        default: 0
      },
      endFat: {
        type: Number,
        default: 0
      },
      rate: {
        type: Number,
        default: 0
      },
      difference: {
        type: Number,
        default: 0
      },
      snf: {
        type: Number,
        default: 0
      }
    },

    effectiveFrom: {
      type: Date,
      default: Date.now,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
rateChartSchema.index({ date: -1, createdBy: 1 });
rateChartSchema.index({ name: 1, createdBy: 1 });
rateChartSchema.index({ effectiveFrom: -1 });

export default mongoose.model("RateChart", rateChartSchema);
