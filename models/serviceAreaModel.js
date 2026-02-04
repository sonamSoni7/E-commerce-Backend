const mongoose = require("mongoose");

// Service Area model for delivery location management
var serviceAreaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincodes: [
      {
        type: String,
        required: true,
      },
    ],
    coordinates: {
      // Polygon for area boundary
      type: {
        type: String,
        enum: ["Polygon"],
        default: "Polygon",
      },
      coordinates: {
        type: [[[Number]]], // Array of linear rings
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    freeDeliveryAbove: {
      type: Number,
      default: 500,
    },
    minimumOrderValue: {
      type: Number,
      default: 0,
    },
    averageDeliveryTime: {
      type: Number, // In minutes
      default: 60,
    },
    expressDeliveryAvailable: {
      type: Boolean,
      default: false,
    },
    expressDeliveryCharge: {
      type: Number,
      default: 50,
    },
    codAvailable: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
serviceAreaSchema.index({ coordinates: "2dsphere" });
serviceAreaSchema.index({ pincodes: 1 });
serviceAreaSchema.index({ city: 1, state: 1 });

module.exports = mongoose.model("ServiceArea", serviceAreaSchema);
