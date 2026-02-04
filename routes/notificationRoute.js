const express = require("express");
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
  sendBulkNotifications,
  sendToAllUsers,
  scheduleNotification,
} = require("../controller/notificationCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// User Routes
router.get("/", authMiddleware, getUserNotifications);
router.put("/:notificationId/read", authMiddleware, markAsRead);
router.put("/read-all", authMiddleware, markAllAsRead);
router.delete("/:notificationId", authMiddleware, deleteNotification);
router.delete("/read/all", authMiddleware, deleteAllRead);

// Admin Routes
router.post("/send", authMiddleware, isAdmin, createNotification);
router.post("/send-bulk", authMiddleware, isAdmin, sendBulkNotifications);
router.post("/send-all", authMiddleware, isAdmin, sendToAllUsers);
router.post("/schedule", authMiddleware, isAdmin, scheduleNotification);

module.exports = router;
