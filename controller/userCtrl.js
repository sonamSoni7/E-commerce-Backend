const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const uniqid = require("uniqid");

const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongoDbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");
const { createPasswordResetToken } = require("../models/userModel");

// Create a User ----------------------------------------------

const createUser = asyncHandler(async (req, res) => {
  /**
   * TODO:Get the email from req.body
   */
  const email = req.body.email;
  /**
   * TODO:With the help of email find the user exists or not
   */
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    /**
     * TODO:if user not found user create a new user
     */
    const newUser = await User.create(req.body);
    res.json(newUser);
  } else {
    /**
     * TODO:if user found then thow an error: User already exists
     */
    throw new Error("User Already Exists");
  }
});

// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// admin login

const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        refreshToken: refreshToken,
      },
      { new: true }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token

const handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});

// logout functionality

const logout = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
  const refreshToken = cookie.refreshToken;
  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(refreshToken, {
    refreshToken: "",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Update a user

const updatedUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// save user Address

const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users

const getallUser = asyncHandler(async (req, res) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json(getUsers);
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const getaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get a single user

const deleteaUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const deleteaUser = await User.findByIdAndDelete(id);
    res.json({
      deleteaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockusr = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json(blockusr);
  } catch (error) {
    throw new Error(error);
  }
});

const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "User UnBlocked",
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json(updatedPassword);
  } else {
    res.json(user);
  }
});

const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();

    await user.save();
    const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='${process.env.FRONTEND_URL}/reset-password/${token}'>Click Here</a>`;

    const data = {
      to: email,
      text: "Hey User",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json(user);
});

const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

const userCart = asyncHandler(async (req, res) => {
  const { productId, color, quantity, price } = req.body;

  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let newCart = await new Cart({
      userId: _id,
      productId,
      color,
      price,
      quantity,
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.find({ userId: _id })
      .populate("productId")
      .populate("color");
    res.json(cart);
  } catch (error) {
    console.error("Get User Cart Error:", error);
    throw new Error(error);
  }
});

const removeProductFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId } = req.params;
  validateMongoDbId(_id);
  try {
    const deleteProductFromcart = await Cart.deleteOne({
      userId: _id,
      _id: cartItemId,
    });

    res.json(deleteProductFromcart);
  } catch (error) {
    throw new Error(error);
  }
});

const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const deleteCart = await Cart.deleteMany({
      userId: _id,
    });

    res.json(deleteCart);
  } catch (error) {
    throw new Error(error);
  }
});

const updateProductQuantityFromCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { cartItemId, newQuantity } = req.params;
  validateMongoDbId(_id);
  try {
    const cartItem = await Cart.findOne({
      userId: _id,
      _id: cartItemId,
    });
    cartItem.quantity = newQuantity;
    cartItem.save();
    res.json(cartItem);
  } catch (error) {
    throw new Error(error);
  }
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);

  // Validate coupon exists
  const validCoupon = await Coupon.findOne({ name: coupon });
  if (!validCoupon) {
    throw new Error("Invalid Coupon");
  }

  // Fail-fast: check expiry before any DB writes
  if (new Date(validCoupon.expiry) < new Date()) {
    throw new Error("Coupon Expired");
  }

  // Sum the cart items (items subtotal only — discount does NOT apply to shipping)
  const cartItems = await Cart.find({ userId: _id });
  let itemsSubtotal = 0;
  for (let i = 0; i < cartItems.length; i++) {
    itemsSubtotal += cartItems[i].price * cartItems[i].quantity;
  }

  if (itemsSubtotal === 0) {
    throw new Error("Cart is empty");
  }

  // Discount applied to items only
  const totalAfterDiscount = (
    itemsSubtotal - (itemsSubtotal * validCoupon.discount) / 100
  ).toFixed(2);

  await User.findOneAndUpdate(
    { _id },
    {
      cartTotal: itemsSubtotal,
      totalAfterDiscount: Number(totalAfterDiscount),
      couponApplied: validCoupon._id,
    },
    { new: true }
  );

  res.json(totalAfterDiscount);
});

// Remove an applied coupon from the user session
const removeCoupon = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  await User.findOneAndUpdate(
    { _id },
    { couponApplied: null, totalAfterDiscount: 0, cartTotal: 0 },
    { new: true }
  );
  res.json({ message: "Coupon removed" });
});

// Return the currently applied coupon status for the logged-in user
const getCouponStatus = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  const user = await User.findById(_id).populate("couponApplied");
  if (!user.couponApplied) {
    return res.json({ applied: false });
  }

  const coupon = user.couponApplied;
  const isExpired = new Date(coupon.expiry) < new Date();

  if (isExpired) {
    // Auto-clear the expired coupon server-side
    await User.findOneAndUpdate(
      { _id },
      { couponApplied: null, totalAfterDiscount: 0, cartTotal: 0 }
    );
    return res.json({ applied: false, expired: true, name: coupon.name });
  }

  return res.json({
    applied: true,
    name: coupon.name,
    discount: coupon.discount,
    expiry: coupon.expiry,
    totalAfterDiscount: user.totalAfterDiscount,
  });
});

const createOrder = async (req, res) => {
  try {
    const { shippingInfo, paymentInfo } = req.body;
    const { _id } = req.user;
    validateMongoDbId(_id);

    const DELIVERY_CHARGE = 100;
    // 1. Validate inputs
    if (!shippingInfo) {
      return res.status(400).json({ message: "Shipping info is required" });
    }
    if (!paymentInfo) {
      return res.status(400).json({ message: "Payment info is required" });
    }

    // 2. Fetch cart BEFORE doing anything else — use .lean() for plain JS objects
    const userCart = await Cart.find({ userId: _id }).lean();
    console.log("[createOrder] cart items:", userCart.length);
    // Dump first cart item to see exact field names
    if (userCart.length > 0) {
      console.log("[createOrder] cart[0] raw:", JSON.stringify(userCart[0]));
    }

    if (!userCart || userCart.length === 0) {
      return res.status(400).json({ message: "Cart is empty, cannot create order" });
    }

    // 3. Calculate items subtotal
    let itemsSubtotal = 0;
    for (let i = 0; i < userCart.length; i++) {
      itemsSubtotal += userCart[i].price * userCart[i].quantity;
    }
    const totalPrice = itemsSubtotal + DELIVERY_CHARGE;

    // 4. Razorpay-charged amount is the ground truth for what the user paid
    const razorpayChargedAmount = paymentInfo?.amount
      ? Number(paymentInfo.amount) / 100
      : totalPrice;


    // 5. Map cart items → Order schema shape
    const orderItemsMapped = userCart.map((item) => {
      // productId is the field name in Cart schema
      const productRef = item.productId;
      console.log("[createOrder] item productId:", productRef, "color:", item.color);
      const mapped = {
        product: productRef,
        quantity: item.quantity,
        price: item.price,
      };
      if (item.color) mapped.color = item.color;
      return mapped;
    });

    // 6. Sanitize paymentInfo — only include fields that exist in Order schema
    const sanitizedPaymentInfo = {
      razorpayOrderId: paymentInfo.razorpayOrderId || "",
      razorpayPaymentId: paymentInfo.razorpayPaymentId || "",
    };

    // 7. Sanitize shippingInfo — coerce pincode to Number
    const sanitizedShippingInfo = {
      firstname: shippingInfo.firstname,
      lastname: shippingInfo.lastname,
      address: shippingInfo.address,
      deliveryCharge:DELIVERY_CHARGE,
      city: shippingInfo.city,
      state: shippingInfo.state,
      pincode: Number(shippingInfo.pincode),
      other: shippingInfo.other || "",
    };

    console.log("[createOrder] sanitizedPaymentInfo:", JSON.stringify(sanitizedPaymentInfo));
    console.log("[createOrder] sanitizedShippingInfo:", JSON.stringify(sanitizedShippingInfo));
    console.log("[createOrder] orderItems count:", orderItemsMapped.length);

    // 8. Create the order
    const order = await Order.create({
      shippingInfo: sanitizedShippingInfo,
      orderItems: orderItemsMapped,
      totalPrice,
      totalPriceAfterDiscount: razorpayChargedAmount,
      paymentInfo: sanitizedPaymentInfo,
      user: _id,
    });

    console.log("[createOrder] order created:", order._id);

    // 9. Update product stock and sold count
    for (let item of userCart) {
      await Product.updateOne(
        { _id: item.productId },
        { $inc: { quantity: -item.quantity, sold: +item.quantity } }
      );
    }

    // 10. Clear cart and reset coupon state
    await Cart.deleteMany({ userId: _id });
    await User.findOneAndUpdate(
      { _id },
      { cartTotal: 0, totalAfterDiscount: 0, couponApplied: null }
    );

    console.log("=== [createOrder] SUCCESS ===");
    res.json({ order, success: true });
  } catch (error) {
    console.error("=== [createOrder] ERROR ===");
    console.error("[createOrder] message:", error.message);
    console.error("[createOrder] name:", error.name);
    if (error.errors) {
      // Mongoose validation error — print each failing field
      Object.keys(error.errors).forEach((field) => {
        console.error(`[createOrder] field "${field}":`, error.errors[field].message);
      });
    }
    console.error("[createOrder] stack:", error.stack);
    res.status(500).json({
      status: "fail",
      message: error.message,
      validationErrors: error.errors
        ? Object.keys(error.errors).map((f) => `${f}: ${error.errors[f].message}`)
        : undefined,
    });
  }
};

const getMyOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find({ user: _id })
      .populate("user")
      .populate("orderItems.product")
      .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getAllOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const orders = await Order.find().populate("user");
    // .populate("orderItems.product")
    // .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getsingleOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findOne({ _id: id })
      .populate("user")
      .populate("orderItems.product")
      .populate("orderItems.color");
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const updateOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const orders = await Order.findById(id);
    orders.orderStatus = req.body.status;
    await orders.save();
    res.json({
      orders,
    });
  } catch (error) {
    throw new Error(error);
  }
});

const getMonthWiseOrderIncome = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: {
          month: "$month",
        },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(data);
});

const getYearlyTotalOrder = asyncHandler(async (req, res) => {
  let monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1);
    endDate = monthNames[d.getMonth()] + " " + d.getFullYear();
  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate),
        },
      },
    },
    {
      $group: {
        _id: null,
        amount: { $sum: 1 },
        amount: { $sum: "$totalPriceAfterDiscount" },
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(data);
});

module.exports = {
  createUser,
  loginUserCtrl,
  getallUser,
  getaUser,
  deleteaUser,
  updatedUser,
  blockUser,
  unblockUser,
  handleRefreshToken,
  logout,
  updatePassword,
  forgotPasswordToken,
  resetPassword,
  loginAdmin,
  getWishlist,
  saveAddress,
  userCart,
  getUserCart,
  createOrder,
  getMyOrders,
  emptyCart,
  getMonthWiseOrderIncome,
  getAllOrders,
  getsingleOrder,
  updateOrder,
  getYearlyTotalOrder,
  removeProductFromCart,
  updateProductQuantityFromCart,
  applyCoupon,
  removeCoupon,
  getCouponStatus,
};
