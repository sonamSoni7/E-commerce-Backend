const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

// Get User Notifications
const getUserNotifications = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { page = 1, limit = 20, type, isRead } = req.query;

  let query = { user: _id };

  if (type) {
    query.type = type;
  }

  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    user: _id,
    isRead: false,
  });

  res.json({
    success: true,
    notifications,
    unreadCount,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Mark Notification as Read
const markAsRead = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: _id },
    { isRead: true, readAt: Date.now() },
    { new: true }
  );

  if (!notification) {
    throw new Error("Notification not found");
  }

  res.json({
    success: true,
    notification,
  });
});

// Mark All Notifications as Read
const markAllAsRead = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  await Notification.updateMany(
    { user: _id, isRead: false },
    { isRead: true, readAt: Date.now() }
  );

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

// Delete Notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { notificationId } = req.params;

  await Notification.findOneAndDelete({
    _id: notificationId,
    user: _id,
  });

  res.json({
    success: true,
    message: "Notification deleted successfully",
  });
});

// Delete All Read Notifications
const deleteAllRead = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  await Notification.deleteMany({
    user: _id,
    isRead: true,
  });

  res.json({
    success: true,
    message: "All read notifications deleted",
  });
});

// Admin: Create Notification (Single User)
const createNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type, data, actionUrl, imageUrl, priority } =
    req.body;

  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type: type || "general",
    data,
    actionUrl,
    imageUrl,
    priority: priority || "medium",
    sentAt: Date.now(),
  });

  // TODO: Send push notification using FCM
  await sendPushNotification(userId, notification);

  res.json({
    success: true,
    notification,
  });
});

// Admin: Send Bulk Notifications
const sendBulkNotifications = asyncHandler(async (req, res) => {
  const { userIds, title, message, type, data, actionUrl, imageUrl } =
    req.body;

  const notifications = [];

  for (const userId of userIds) {
    notifications.push({
      user: userId,
      title,
      message,
      type: type || "general",
      data,
      actionUrl,
      imageUrl,
      sentAt: Date.now(),
    });
  }

  const createdNotifications = await Notification.insertMany(notifications);

  // TODO: Send push notifications in bulk
  for (const userId of userIds) {
    await sendPushNotification(userId, { title, message, data });
  }

  res.json({
    success: true,
    count: createdNotifications.length,
  });
});

// Admin: Send to All Users
const sendToAllUsers = asyncHandler(async (req, res) => {
  const { title, message, type, data, actionUrl, imageUrl } = req.body;

  const users = await User.find({ isBlocked: false }).select("_id");

  const notifications = users.map((user) => ({
    user: user._id,
    title,
    message,
    type: type || "general",
    data,
    actionUrl,
    imageUrl,
    sentAt: Date.now(),
  }));

  const createdNotifications = await Notification.insertMany(notifications);

  // TODO: Send push notifications to all users

  res.json({
    success: true,
    count: createdNotifications.length,
    message: "Notifications sent to all users",
  });
});

// Schedule Notification
const scheduleNotification = asyncHandler(async (req, res) => {
  const {
    userId,
    title,
    message,
    type,
    data,
    actionUrl,
    scheduledFor,
    expiresAt,
  } = req.body;

  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type: type || "general",
    data,
    actionUrl,
    scheduledFor: new Date(scheduledFor),
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  res.json({
    success: true,
    notification,
    message: "Notification scheduled successfully",
  });
});

// Helper function to send push notification (implement with FCM)
async function sendPushNotification(userId, notificationData) {
  try {
    const user = await User.findById(userId).select("deviceTokens preferences");

    if (!user || !user.preferences?.notifications?.push) {
      return; // User has disabled push notifications
    }

    const tokens = user.deviceTokens.map((dt) => dt.token);

    if (tokens.length === 0) {
      return;
    }

    // TODO: Implement FCM push notification
    console.log("Sending push to:", tokens);
    console.log("Notification:", notificationData);

    // Example FCM implementation:
    // const message = {
    //   notification: {
    //     title: notificationData.title,
    //     body: notificationData.message,
    //   },
    //   data: notificationData.data,
    //   tokens: tokens,
    // };
    // await admin.messaging().sendMulticast(message);
  } catch (error) {
    console.error("Push notification error:", error);
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createNotification,
  sendBulkNotifications,
  sendToAllUsers,
  scheduleNotification,
};
