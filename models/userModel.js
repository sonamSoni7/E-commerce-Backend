const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: function () {
        return !this.mobile || this.authProvider === 'email';
      },
      unique: true,
      sparse: true,
    },
    mobile: {
      type: String,
      required: function () {
        return !this.email || this.authProvider === 'phone';
      },
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: function () {
        return this.authProvider === 'email' || this.authProvider === 'phone';
      },
    },
    authProvider: {
      type: String,
      enum: ['email', 'phone', 'google'],
      default: 'email',
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phoneOTP: {
      code: String,
      expiresAt: Date,
    },
    emailOTP: {
      code: String,
      expiresAt: Date,
    },
    role: {
      type: String,
      default: "user",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    cart: {
      type: Array,
      default: [],
    },
    cartTotal: {
      type: Number,
      default: 0,
    },
    totalAfterDiscount: {
      type: Number,
      default: 0,
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
    address: {
      type: String,
    },
    addresses: [{
      label: String, // Home, Work, Other
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      latitude: Number,
      longitude: Number,
      isDefault: {
        type: Boolean,
        default: false,
      },
    }],
    deviceTokens: [{
      token: String,
      platform: {
        type: String,
        enum: ['web', 'android', 'ios'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    preferences: {
      language: {
        type: String,
        default: 'en',
      },
      notifications: {
        push: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
      categories: [String], // Preferred categories for recommendations
    },
    lastLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      updatedAt: Date,
    },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    refreshToken: {
      type: String,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
userSchema.methods.createPasswordResetToken = async function () {
  const resettoken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resettoken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 10 minutes
  return resettoken;
};

userSchema.methods.generateOTP = function (type = 'phone') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  if (type === 'phone') {
    this.phoneOTP = {
      code: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };
  } else {
    this.emailOTP = {
      code: hashedOTP,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
  }

  return otp; // Return plain OTP for sending
};

userSchema.methods.verifyOTP = function (enteredOTP, type = 'phone') {
  const hashedOTP = crypto.createHash('sha256').update(enteredOTP).digest('hex');
  const otpData = type === 'phone' ? this.phoneOTP : this.emailOTP;

  if (!otpData || !otpData.code) {
    return false;
  }

  if (otpData.expiresAt < Date.now()) {
    return false; // OTP expired
  }

  return otpData.code === hashedOTP;
};

//Export the model
module.exports = mongoose.model("User", userSchema);
