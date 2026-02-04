const express = require("express");
const {
  updateDeliveryLocation,
  getOrderTracking,
  getLiveLocation,
  assignDeliveryPerson,
  updateOrderStatus,
  verifyDeliveryOTP,
  getDeliveryPersonOrders,
  cancelOrder,
  requestReturn,
} = require("../controller/orderTrackingCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// User Routes
router.get("/:orderId/track", authMiddleware, getOrderTracking);
router.get("/:orderId/live", authMiddleware, getLiveLocation);
router.put("/:orderId/cancel", authMiddleware, cancelOrder);
router.post("/:orderId/return", authMiddleware, requestReturn);

// Delivery Person Routes
router.put("/:orderId/location", authMiddleware, updateDeliveryLocation);
router.post("/:orderId/verify-otp", authMiddleware, verifyDeliveryOTP);
router.get("/delivery/my-orders", authMiddleware, getDeliveryPersonOrders);

// Admin Routes
router.put("/:orderId/assign", authMiddleware, isAdmin, assignDeliveryPerson);
router.put("/:orderId/status", authMiddleware, isAdmin, updateOrderStatus);

module.exports = router;
