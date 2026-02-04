const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shippingInfo: {
      firstname: {
        type: String,
        required: true,
      },
      lastname: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      other: {
        type: String,
      },
      pincode: {
        type: Number,
        required: true,
      },
    },
    paymentInfo: {
      razorpayOrderId: {
        type: String,
      },
      razorpayPaymentId: {
        type: String,
      },
      method: {
        type: String,
        enum: ['razorpay', 'cod', 'upi', 'card', 'wallet'],
        default: 'razorpay',
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        color: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Color",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    paidAt: {
      type: Date,
      default: Date.now(),
    },
    month: {
      type: Number,
      default: new Date().getMonth(),
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    totalPriceAfterDiscount: {
      type: Number,
      required: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    coupon: {
      code: String,
      discount: Number,
    },
    orderStatus: {
      type: String,
      enum: [
        'Pending',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
      ],
      default: 'Pending',
    },
    statusHistory: [{
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      note: String,
    }],
    deliverySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeliverySlot',
    },
    scheduledDeliveryDate: Date,
    scheduledTimeSlot: {
      startTime: String,
      endTime: String,
    },
    deliveryPerson: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      phone: String,
      currentLocation: {
        latitude: Number,
        longitude: Number,
        updatedAt: Date,
      },
      vehicleNumber: String,
    },
    tracking: {
      estimatedDeliveryTime: Date,
      actualDeliveryTime: Date,
      otpForDelivery: String,
      deliveryProof: {
        images: [String],
        signature: String,
      },
      locationHistory: [{
        latitude: Number,
        longitude: Number,
        timestamp: Date,
      }],
    },
    cancellationReason: String,
    returnReason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'rejected'],
    },
    notes: String,
    customerNotes: String,
  },
  {
    timestamps: true,
  }
);

//Export the model
module.exports = mongoose.model("Order", orderSchema);
