const mongoose = require("mongoose");

// Notification model for push notifications
var notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "order",
        "delivery",
        "offer",
        "promotion",
        "payment",
        "account",
        "general",
      ],
      default: "general",
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data (order ID, product ID, etc.)
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    actionUrl: String, // Deep link or URL to navigate
    imageUrl: String,
    icon: String,
    sentVia: [
      {
        type: String,
        enum: ["push", "email", "sms"],
      },
    ],
    scheduledFor: Date, // For scheduled notifications
    sentAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
