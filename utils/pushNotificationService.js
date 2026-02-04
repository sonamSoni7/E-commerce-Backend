// Push Notification Service using Firebase Cloud Messaging (FCM)

// Initialize Firebase Admin (Uncomment after adding firebase-admin package)
// const admin = require('firebase-admin');
// const serviceAccount = require('../config/firebase-service-account.json');

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const sendPushNotification = async (tokens, notification, data = {}) => {
  try {
    if (!tokens || tokens.length === 0) {
      console.log("No device tokens provided");
      return { success: false, message: "No tokens" };
    }

    // Example FCM implementation
    // const message = {
    //   notification: {
    //     title: notification.title,
    //     body: notification.message,
    //     imageUrl: notification.imageUrl,
    //   },
    //   data: data,
    //   tokens: tokens,
    // };

    // const response = await admin.messaging().sendMulticast(message);

    // console.log(`Successfully sent ${response.successCount} messages`);
    // console.log(`Failed to send ${response.failureCount} messages`);

    // For development: Just log
    console.log("Push Notification:", notification);
    console.log("To tokens:", tokens);

    return {
      success: true,
      message: "Push notification sent",
    };
  } catch (error) {
    console.error("Push Notification Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const sendOrderNotification = async (userId, orderId, status) => {
  // Get user's device tokens from database
  const User = require("../models/userModel");
  const user = await User.findById(userId).select("deviceTokens");

  if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
    return { success: false, message: "No device tokens found" };
  }

  const tokens = user.deviceTokens.map((dt) => dt.token);

  const notification = {
    title: `Order ${status}`,
    message: `Your order #${orderId} has been ${status.toLowerCase()}`,
  };

  const data = {
    type: "order_update",
    orderId: orderId,
    status: status,
  };

  return await sendPushNotification(tokens, notification, data);
};

const sendDeliveryNotification = async (userId, orderId, deliveryPersonName) => {
  const User = require("../models/userModel");
  const user = await User.findById(userId).select("deviceTokens");

  if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
    return { success: false, message: "No device tokens found" };
  }

  const tokens = user.deviceTokens.map((dt) => dt.token);

  const notification = {
    title: "Order Out for Delivery",
    message: `${deliveryPersonName} is delivering your order #${orderId}. Track in real-time!`,
  };

  const data = {
    type: "delivery_started",
    orderId: orderId,
  };

  return await sendPushNotification(tokens, notification, data);
};

const sendOfferNotification = async (userIds, offerTitle, offerMessage) => {
  const User = require("../models/userModel");
  const users = await User.find({ _id: { $in: userIds } }).select("deviceTokens");

  const allTokens = [];
  users.forEach((user) => {
    if (user.deviceTokens && user.deviceTokens.length > 0) {
      user.deviceTokens.forEach((dt) => allTokens.push(dt.token));
    }
  });

  if (allTokens.length === 0) {
    return { success: false, message: "No device tokens found" };
  }

  const notification = {
    title: offerTitle,
    message: offerMessage,
  };

  const data = {
    type: "offer",
  };

  return await sendPushNotification(allTokens, notification, data);
};

module.exports = {
  sendPushNotification,
  sendOrderNotification,
  sendDeliveryNotification,
  sendOfferNotification,
};
