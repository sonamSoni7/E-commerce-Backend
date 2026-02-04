const mongoose = require("mongoose");

// Chat Conversation model
var chatConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    supportAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin/Support user
    },
    status: {
      type: String,
      enum: ["open", "assigned", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: [
        "order",
        "payment",
        "delivery",
        "product",
        "account",
        "general",
        "complaint",
      ],
      default: "general",
    },
    subject: String,
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
  },
  {
    timestamps: true,
  }
);

chatConversationSchema.index({ user: 1, status: 1 });
chatConversationSchema.index({ supportAgent: 1, status: 1 });

// Chat Message model
var chatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["user", "support", "bot"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },
    attachments: [
      {
        type: String,
        url: String,
        name: String,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ conversation: 1, createdAt: 1 });

const ChatConversation = mongoose.model(
  "ChatConversation",
  chatConversationSchema
);
const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

module.exports = { ChatConversation, ChatMessage };
