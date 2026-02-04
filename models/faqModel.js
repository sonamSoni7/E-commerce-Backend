const mongoose = require("mongoose");

// FAQ model
var faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "orders",
        "delivery",
        "payment",
        "returns",
        "account",
        "products",
        "general",
      ],
      default: "general",
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0, // For sorting FAQs
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    helpful: {
      type: Number,
      default: 0,
    },
    notHelpful: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ tags: 1 });

module.exports = mongoose.model("FAQ", faqSchema);
