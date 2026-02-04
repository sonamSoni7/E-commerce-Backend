const express = require("express");
const {
  createConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  closeConversation,
  getAllConversations,
  assignConversation,
  sendSupportMessage,
  resolveConversation,
} = require("../controller/chatCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// User Routes
router.post("/conversation", authMiddleware, createConversation);
router.get("/conversations", authMiddleware, getUserConversations);
router.get("/conversation/:conversationId", authMiddleware, getConversationMessages);
router.post("/conversation/:conversationId/message", authMiddleware, sendMessage);
router.put("/conversation/:conversationId/close", authMiddleware, closeConversation);

// Admin Routes
router.get("/all", authMiddleware, isAdmin, getAllConversations);
router.put("/conversation/:conversationId/assign", authMiddleware, isAdmin, assignConversation);
router.post("/conversation/:conversationId/support-message", authMiddleware, isAdmin, sendSupportMessage);
router.put("/conversation/:conversationId/resolve", authMiddleware, isAdmin, resolveConversation);

module.exports = router;
