const express = require("express");
const {
  sendOTP,
  verifyOTP,
  googleAuth,
  updateLocation,
  manageAddress,
  registerDeviceToken,
  updatePreferences,
} = require("../controller/authEnhancedCtrl");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// OTP Authentication
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Google OAuth
router.post("/google-auth", googleAuth);

// Protected Routes
router.put("/location", authMiddleware, updateLocation);
router.post("/address", authMiddleware, manageAddress);
router.post("/device-token", authMiddleware, registerDeviceToken);
router.put("/preferences", authMiddleware, updatePreferences);

module.exports = router;
