import mongoose from "mongoose";

const gpsTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
    },

    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
        validate: {
          validator: function(coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 &&
              coords[0] <= 180 &&
              coords[1] >= -90 &&
              coords[1] <= 90
            );
          },
          message: "Invalid coordinates. Longitude must be between -180 and 180, latitude between -90 and 90",
        },
      },
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    accuracy: {
      type: Number, // meters
      default: null,
      min: 0,
    },
  },
  { timestamps: true }
);

// Geospatial index for location queries
gpsTrackingSchema.index({ location: "2dsphere" });

// Index for efficient time-based queries
gpsTrackingSchema.index({ orderId: 1, timestamp: -1 });

// TTL index to auto-delete old tracking data after 30 days (2592000 seconds)
gpsTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model("GPSTracking", gpsTrackingSchema);
