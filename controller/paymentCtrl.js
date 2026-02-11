const Razorpay = require("razorpay");
const crypto = require("crypto");
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const User = require("../models/userModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");

const checkout = async (req, res) => {
  const { _id } = req.user;
  const user = await User.findById(_id);
  const userCart = await Cart.find({ userId: _id });
  let finalAmount = 0;
  for (let i = 0; i < userCart.length; i++) {
    finalAmount += userCart[i].price * userCart[i].quantity;
  }
  finalAmount += 100; //for shipping charges

  if (user.couponApplied) {
    const coupon = await Coupon.findById(user.couponApplied);
    if (coupon) {
      finalAmount = (
        finalAmount - (finalAmount * coupon.discount) / 100
      ).toFixed(2);
    }
  }

  const option = {
    amount: finalAmount * 100,
    currency: "INR",
  };
  const order = await instance.orders.create(option);
  res.json({
    success: true,
    order,
  });
};

const paymentVerification = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpaySignature) {
    res.json({
      success: true,
      razorpayOrderId,
      razorpayPaymentId,
    });
  } else {
    res.status(400).json({ success: false, message: "Payment Verification Failed" });
  }
};

module.exports = {
  checkout,
  paymentVerification,
};
