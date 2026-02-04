const Order = require("../models/orderModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

// Update Delivery Person Location (Real-time tracking)
const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { latitude, longitude } = req.body;
  const { _id } = req.user; // Delivery person ID

  const order = await Order.findOne({
    _id: orderId,
    "deliveryPerson.id": _id,
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  // Update current location
  order.deliveryPerson.currentLocation = {
    latitude,
    longitude,
    updatedAt: Date.now(),
  };

  // Add to location history
  order.tracking.locationHistory.push({
    latitude,
    longitude,
    timestamp: Date.now(),
  });

  // Keep only last 100 locations
  if (order.tracking.locationHistory.length > 100) {
    order.tracking.locationHistory = order.tracking.locationHistory.slice(-100);
  }

  await order.save();

  // TODO: Emit socket event for real-time tracking
  // io.to(`order_${orderId}`).emit('location_update', {
  //   latitude,
  //   longitude,
  //   timestamp: Date.now()
  // });

  res.json({
    success: true,
    message: "Location updated successfully",
  });
});

// Get Order Tracking Details (Customer)
const getOrderTracking = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { _id } = req.user;

  const order = await Order.findOne({
    _id: orderId,
    user: _id,
  })
    .populate("deliveryPerson.id", "firstname lastname")
    .select(
      "orderStatus statusHistory deliveryPerson tracking scheduledDeliveryDate scheduledTimeSlot"
    );

  if (!order) {
    throw new Error("Order not found");
  }

  res.json({
    success: true,
    tracking: {
      status: order.orderStatus,
      statusHistory: order.statusHistory,
      deliveryPerson: order.deliveryPerson,
      estimatedDeliveryTime: order.tracking?.estimatedDeliveryTime,
      scheduledDeliveryDate: order.scheduledDeliveryDate,
      scheduledTimeSlot: order.scheduledTimeSlot,
      currentLocation: order.deliveryPerson?.currentLocation,
    },
  });
});

// Get Live Delivery Person Location
const getLiveLocation = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { _id } = req.user;

  const order = await Order.findOne({
    _id: orderId,
    user: _id,
    orderStatus: "Out for Delivery",
  }).select("deliveryPerson.currentLocation deliveryPerson.name deliveryPerson.phone tracking.estimatedDeliveryTime");

  if (!order) {
    throw new Error("Order not found or not out for delivery");
  }

  res.json({
    success: true,
    deliveryPerson: {
      name: order.deliveryPerson.name,
      phone: order.deliveryPerson.phone,
      location: order.deliveryPerson.currentLocation,
    },
    estimatedDeliveryTime: order.tracking.estimatedDeliveryTime,
  });
});

// Assign Delivery Person (Admin/Warehouse)
const assignDeliveryPerson = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { deliveryPersonId, vehicleNumber } = req.body;

  const deliveryPerson = await User.findById(deliveryPersonId);

  if (!deliveryPerson) {
    throw new Error("Delivery person not found");
  }

  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      deliveryPerson: {
        id: deliveryPersonId,
        name: `${deliveryPerson.firstname} ${deliveryPerson.lastname}`,
        phone: deliveryPerson.mobile,
        vehicleNumber: vehicleNumber || "",
      },
      orderStatus: "Out for Delivery",
      $push: {
        statusHistory: {
          status: "Out for Delivery",
          timestamp: Date.now(),
          updatedBy: req.user._id,
          note: `Assigned to ${deliveryPerson.firstname}`,
        },
      },
    },
    { new: true }
  );

  // Generate OTP for delivery
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  order.tracking.otpForDelivery = otp;

  // Calculate estimated delivery time (e.g., 30 minutes from now)
  order.tracking.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000);

  await order.save();

  // TODO: Send OTP to customer via SMS
  // TODO: Notify delivery person via push notification

  res.json({
    success: true,
    order,
    deliveryOTP: otp, // Send to customer separately
  });
});

// Update Order Status
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status, note } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found");
  }

  order.orderStatus = status;
  order.statusHistory.push({
    status,
    timestamp: Date.now(),
    updatedBy: req.user._id,
    note: note || "",
  });

  if (status === "Delivered") {
    order.tracking.actualDeliveryTime = Date.now();
  }

  await order.save();

  // TODO: Send notification to customer
  // TODO: Emit socket event for real-time update

  res.json({
    success: true,
    order,
  });
});

// Verify Delivery OTP and Complete Order
const verifyDeliveryOTP = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { otp, proofImages, signature } = req.body;
  const { _id } = req.user; // Delivery person

  const order = await Order.findOne({
    _id: orderId,
    "deliveryPerson.id": _id,
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  if (order.tracking.otpForDelivery !== otp) {
    throw new Error("Invalid OTP");
  }

  // Mark as delivered
  order.orderStatus = "Delivered";
  order.tracking.actualDeliveryTime = Date.now();
  order.tracking.deliveryProof = {
    images: proofImages || [],
    signature: signature || "",
  };

  order.statusHistory.push({
    status: "Delivered",
    timestamp: Date.now(),
    updatedBy: _id,
    note: "Order delivered and verified with OTP",
  });

  await order.save();

  // TODO: Send delivery confirmation to customer
  // TODO: Send notification

  res.json({
    success: true,
    message: "Order delivered successfully",
    order,
  });
});

// Get Delivery Person's Assigned Orders
const getDeliveryPersonOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const orders = await Order.find({
    "deliveryPerson.id": _id,
    orderStatus: { $in: ["Out for Delivery", "Packed"] },
  })
    .populate("user", "firstname lastname mobile")
    .sort({ "tracking.estimatedDeliveryTime": 1 });

  res.json({
    success: true,
    orders,
  });
});

// Cancel Order
const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const { _id } = req.user;

  const order = await Order.findOne({
    _id: orderId,
    user: _id,
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.orderStatus === "Delivered") {
    throw new Error("Cannot cancel delivered order");
  }

  if (order.orderStatus === "Out for Delivery") {
    throw new Error(
      "Cannot cancel order that is out for delivery. Please contact support."
    );
  }

  order.orderStatus = "Cancelled";
  order.cancellationReason = reason;
  order.statusHistory.push({
    status: "Cancelled",
    timestamp: Date.now(),
    updatedBy: _id,
    note: reason,
  });

  await order.save();

  // TODO: Process refund
  // TODO: Send notification

  res.json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

// Request Return
const requestReturn = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const { _id } = req.user;

  const order = await Order.findOne({
    _id: orderId,
    user: _id,
    orderStatus: "Delivered",
  });

  if (!order) {
    throw new Error("Order not found or not eligible for return");
  }

  // Check if within return window (e.g., 7 days)
  const deliveryDate = order.tracking.actualDeliveryTime;
  const daysSinceDelivery = (Date.now() - deliveryDate) / (1000 * 60 * 60 * 24);

  if (daysSinceDelivery > 7) {
    throw new Error("Return window has expired");
  }

  order.orderStatus = "Returned";
  order.returnReason = reason;
  order.refundStatus = "pending";
  order.statusHistory.push({
    status: "Returned",
    timestamp: Date.now(),
    updatedBy: _id,
    note: reason,
  });

  await order.save();

  // TODO: Notify admin for return processing
  // TODO: Send notification to customer

  res.json({
    success: true,
    message: "Return request submitted successfully",
    order,
  });
});

module.exports = {
  updateDeliveryLocation,
  getOrderTracking,
  getLiveLocation,
  assignDeliveryPerson,
  updateOrderStatus,
  verifyDeliveryOTP,
  getDeliveryPersonOrders,
  cancelOrder,
  requestReturn,
};
