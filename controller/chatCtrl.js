const { ChatConversation, ChatMessage } = require("../models/chatModel");
const asyncHandler = require("express-async-handler");

// Create New Chat Conversation
const createConversation = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { subject, category, message } = req.body;

  // Check if user has an open conversation
  const existingConversation = await ChatConversation.findOne({
    user: _id,
    status: { $in: ["open", "assigned"] },
  });

  if (existingConversation) {
    // Add message to existing conversation
    const chatMessage = await ChatMessage.create({
      conversation: existingConversation._id,
      sender: _id,
      senderType: "user",
      message,
    });

    existingConversation.lastMessageAt = Date.now();
    await existingConversation.save();

    return res.json({
      success: true,
      conversation: existingConversation,
      message: chatMessage,
    });
  }

  // Create new conversation
  const conversation = await ChatConversation.create({
    user: _id,
    subject,
    category: category || "general",
    status: "open",
  });

  // Create first message
  const chatMessage = await ChatMessage.create({
    conversation: conversation._id,
    sender: _id,
    senderType: "user",
    message,
  });

  res.json({
    success: true,
    conversation,
    message: chatMessage,
  });
});

// Get User Conversations
const getUserConversations = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const conversations = await ChatConversation.find({ user: _id })
    .populate("supportAgent", "firstname lastname")
    .sort({ lastMessageAt: -1 });

  res.json({
    success: true,
    conversations,
  });
});

// Get Conversation Messages
const getConversationMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { _id } = req.user;

  // Verify user owns this conversation
  const conversation = await ChatConversation.findOne({
    _id: conversationId,
    user: _id,
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const messages = await ChatMessage.find({ conversation: conversationId })
    .populate("sender", "firstname lastname")
    .sort({ createdAt: 1 });

  // Mark messages as read
  await ChatMessage.updateMany(
    {
      conversation: conversationId,
      senderType: "support",
      isRead: false,
    },
    {
      isRead: true,
      readAt: Date.now(),
    }
  );

  res.json({
    success: true,
    conversation,
    messages,
  });
});

// Send Message
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { _id } = req.user;
  const { message, attachments } = req.body;

  // Verify user owns this conversation
  const conversation = await ChatConversation.findOne({
    _id: conversationId,
    user: _id,
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const chatMessage = await ChatMessage.create({
    conversation: conversationId,
    sender: _id,
    senderType: "user",
    message,
    attachments: attachments || [],
  });

  conversation.lastMessageAt = Date.now();
  await conversation.save();

  // TODO: Emit socket event for real-time update
  // io.to(conversationId).emit('new_message', chatMessage);

  res.json({
    success: true,
    message: chatMessage,
  });
});

// Close Conversation
const closeConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { _id } = req.user;
  const { rating, feedback } = req.body;

  const conversation = await ChatConversation.findOneAndUpdate(
    { _id: conversationId, user: _id },
    {
      status: "closed",
      rating,
      feedback,
    },
    { new: true }
  );

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  res.json({
    success: true,
    conversation,
  });
});

// ADMIN: Get All Conversations
const getAllConversations = asyncHandler(async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;

  let query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const conversations = await ChatConversation.find(query)
    .populate("user", "firstname lastname email mobile")
    .populate("supportAgent", "firstname lastname")
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ChatConversation.countDocuments(query);

  res.json({
    success: true,
    conversations,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// ADMIN: Assign Conversation to Support Agent
const assignConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { supportAgentId } = req.body;

  const conversation = await ChatConversation.findByIdAndUpdate(
    conversationId,
    {
      supportAgent: supportAgentId || req.user._id,
      status: "assigned",
    },
    { new: true }
  ).populate("user supportAgent", "firstname lastname");

  // Create system message
  await ChatMessage.create({
    conversation: conversationId,
    sender: req.user._id,
    senderType: "system",
    message: "A support agent has been assigned to your conversation",
    messageType: "system",
  });

  res.json({
    success: true,
    conversation,
  });
});

// ADMIN: Send Support Message
const sendSupportMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { message } = req.body;

  const conversation = await ChatConversation.findById(conversationId);

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const chatMessage = await ChatMessage.create({
    conversation: conversationId,
    sender: req.user._id,
    senderType: "support",
    message,
  });

  conversation.lastMessageAt = Date.now();
  await conversation.save();

  // TODO: Send push notification to user
  // TODO: Emit socket event for real-time update

  res.json({
    success: true,
    message: chatMessage,
  });
});

// ADMIN: Resolve Conversation
const resolveConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  const conversation = await ChatConversation.findByIdAndUpdate(
    conversationId,
    { status: "resolved" },
    { new: true }
  );

  // Create system message
  await ChatMessage.create({
    conversation: conversationId,
    sender: req.user._id,
    senderType: "system",
    message: "This conversation has been marked as resolved",
    messageType: "system",
  });

  res.json({
    success: true,
    conversation,
  });
});

module.exports = {
  createConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  closeConversation,
  getAllConversations,
  assignConversation,
  sendSupportMessage,
  resolveConversation,
};
