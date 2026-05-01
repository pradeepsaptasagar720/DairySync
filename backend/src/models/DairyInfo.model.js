import mongoose from "mongoose";

const dairyInfoSchema = new mongoose.Schema(
  {
    dairyName: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    taluka: {
      type: String,
      required: true,
      trim: true,
    },
    post: {
      type: String,
      required: true,
      trim: true,
    },
    pincode: {
      type: String,
      required: true,
      trim: true,
    },
    place: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNo: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    morningOpenTime: {
      type: String,
      default: "06:00",
      trim: true,
    },
    morningCloseTime: {
      type: String,
      default: "10:00",
      trim: true,
    },
    eveningOpenTime: {
      type: String,
      default: "16:00",
      trim: true,
    },
    eveningCloseTime: {
      type: String,
      default: "19:00",
      trim: true,
    },
    // Keep old fields for backward compatibility
    openingTime: {
      type: String,
      default: "06:00",
      trim: true,
    },
    closingTime: {
      type: String,
      default: "18:00",
      trim: true,
    },
    // Selling rates for online buyers
    sellingRates: {
      cowMilk: {
        rate: {
          type: String,
          default: "0.00"
        },
        description: {
          type: String,
          default: "Fresh cow milk with high nutritional value"
        }
      },
      buffaloMilk: {
        rate: {
          type: String,
          default: "0.00"
        },
        description: {
          type: String,
          default: "Rich buffalo milk with higher fat content"
        }
      },
      mixedMilk: {
        rate: {
          type: String,
          default: "0.00"
        },
        description: {
          type: String,
          default: "Premium blend of cow and buffalo milk"
        }
      }
    },
    // Rate history for tracking previous rates with dates
    rateHistory: [{
      cowMilk: {
        rate: String,
        description: String
      },
      buffaloMilk: {
        rate: String,
        description: String
      },
      mixedMilk: {
        rate: String,
        description: String
      },
      savedAt: {
        type: Date,
        default: Date.now
      },
      savedBy: {
        type: String,
        default: "admin"
      }
    }],
  },
  { timestamps: true }
);

export default mongoose.model("DairyInfo", dairyInfoSchema);