const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const { generateToken } = require("../config/jwtToken");
const { generateRefreshToken } = require("../config/refreshtoken");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Send OTP for Phone/Email Registration
const sendOTP = asyncHandler(async (req, res) => {
  const { phone, email, type } = req.body; // type: 'phone' or 'email'

  if (!phone && !email) {
    throw new Error("Phone or email is required");
  }

  let user = null;

  if (type === 'phone' && phone) {
    user = await User.findOne({ mobile: phone });
    if (!user) {
      // Create new user with phone
      user = new User({
        mobile: phone,
        authProvider: 'phone',
        firstname: 'User', // Temporary
        lastname: phone.slice(-4), // Temporary
      });
    }
  } else if (type === 'email' && email) {
    user = await User.findOne({ email });
    if (!user) {
      throw new Error("Please register first");
    }
  }

  const otp = user.generateOTP(type);
  await user.save();

  // TODO: Send OTP via SMS/Email service
  // For now, returning OTP in response (REMOVE IN PRODUCTION)
  console.log(`OTP for ${type}:`, otp);

  res.json({
    success: true,
    message: `OTP sent to your ${type}`,
    // Remove this in production:
    otp: process.env.NODE_ENV === 'development' ? otp : undefined,
  });
});

// Verify OTP and Login/Register
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, email, otp, type, firstname, lastname } = req.body;

  let user = null;

  if (type === 'phone' && phone) {
    user = await User.findOne({ mobile: phone });
  } else if (type === 'email' && email) {
    user = await User.findOne({ email });
  }

  if (!user) {
    throw new Error("User not found");
  }

  const isValidOTP = user.verifyOTP(otp, type);

  if (!isValidOTP) {
    throw new Error("Invalid or expired OTP");
  }

  // Mark as verified
  if (type === 'phone') {
    user.isPhoneVerified = true;
    // Update name if provided during registration
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
  } else {
    user.isEmailVerified = true;
  }

  // Clear OTP
  if (type === 'phone') {
    user.phoneOTP = undefined;
  } else {
    user.emailOTP = undefined;
  }

  const refreshToken = await generateRefreshToken(user?._id);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000,
  });

  res.json({
    _id: user?._id,
    firstname: user?.firstname,
    lastname: user?.lastname,
    email: user?.email,
    mobile: user?.mobile,
    token: generateToken(user?._id),
  });
});

// Google OAuth Login
const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, email, firstname, lastname, avatar } = req.body;

  if (!googleId || !email) {
    throw new Error("Google ID and email are required");
  }

  let user = await User.findOne({ googleId });

  if (!user) {
    // Check if user exists with this email
    user = await User.findOne({ email });

    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.authProvider = 'google';
      user.isEmailVerified = true;
    } else {
      // Create new user
      user = await User.create({
        googleId,
        email,
        firstname: firstname || 'User',
        lastname: lastname || '',
        authProvider: 'google',
        isEmailVerified: true,
        mobile: `GOOGLE_${Date.now()}`, // Placeholder
      });
    }
    await user.save();
  }

  const refreshToken = await generateRefreshToken(user?._id);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000,
  });

  res.json({
    _id: user?._id,
    firstname: user?.firstname,
    lastname: user?.lastname,
    email: user?.email,
    mobile: user?.mobile,
    token: generateToken(user?._id),
  });
});

// Update User Location
const updateLocation = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { latitude, longitude, address } = req.body;

  const user = await User.findByIdAndUpdate(
    _id,
    {
      lastLocation: {
        latitude,
        longitude,
        address,
        updatedAt: Date.now(),
      },
    },
    { new: true }
  );

  res.json(user);
});

// Add/Update Address
const manageAddress = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { action, addressData } = req.body; // action: 'add', 'update', 'delete', 'setDefault'

  const user = await User.findById(_id);

  if (action === 'add') {
    user.addresses.push(addressData);
    if (addressData.isDefault) {
      // Remove default from others
      user.addresses.forEach((addr, idx) => {
        if (idx !== user.addresses.length - 1) {
          addr.isDefault = false;
        }
      });
    }
  } else if (action === 'update') {
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressData.id
    );
    if (addressIndex !== -1) {
      user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...addressData };
    }
  } else if (action === 'delete') {
    user.addresses = user.addresses.filter(
      (addr) => addr._id.toString() !== addressData.id
    );
  } else if (action === 'setDefault') {
    user.addresses.forEach((addr) => {
      addr.isDefault = addr._id.toString() === addressData.id;
    });
  }

  await user.save();

  res.json({
    success: true,
    addresses: user.addresses,
  });
});

// Register Device Token for Push Notifications
const registerDeviceToken = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { token, platform } = req.body;

  const user = await User.findById(_id);

  // Remove existing token if already registered
  user.deviceTokens = user.deviceTokens.filter((dt) => dt.token !== token);

  // Add new token
  user.deviceTokens.push({
    token,
    platform: platform || 'web',
    createdAt: Date.now(),
  });

  // Keep only last 5 devices
  if (user.deviceTokens.length > 5) {
    user.deviceTokens = user.deviceTokens.slice(-5);
  }

  await user.save();

  res.json({
    success: true,
    message: "Device registered for push notifications",
  });
});

// Update User Preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    _id,
    { preferences },
    { new: true }
  );

  res.json({
    success: true,
    preferences: user.preferences,
  });
});

module.exports = {
  sendOTP,
  verifyOTP,
  googleAuth,
  updateLocation,
  manageAddress,
  registerDeviceToken,
  updatePreferences,
};
