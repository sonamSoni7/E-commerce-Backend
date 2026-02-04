const mongoose = require("mongoose");

// Delivery Slot model for scheduled deliveries
var deliverySlotSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // Format: "09:00"
      required: true,
    },
    endTime: {
      type: String, // Format: "11:00"
      required: true,
    },
    maxOrders: {
      type: Number,
      default: 50, // Maximum orders per slot
    },
    currentOrders: {
      type: Number,
      default: 0,
    },
    area: {
      type: String,
      required: true, // Delivery area/zone
    },
    pincode: [String], // Supported pincodes for this slot
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    expressDelivery: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: Number,
      default: 1, // For sorting slots
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
deliverySlotSchema.index({ date: 1, area: 1 });
deliverySlotSchema.index({ date: 1, pincode: 1 });

// Virtual for availability
deliverySlotSchema.virtual("isAvailable").get(function () {
  return this.isActive && this.currentOrders < this.maxOrders;
});

deliverySlotSchema.set("toJSON", { virtuals: true });
deliverySlotSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("DeliverySlot", deliverySlotSchema);
