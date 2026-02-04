const express = require("express");
const {
  createReview,
  getProductReviews,
  markReviewHelpful,
  updateReview,
  deleteReview,
  moderateReview,
  getAllReviews,
} = require("../controller/reviewCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/product/:productId", getProductReviews);

// User Routes
router.post("/", authMiddleware, createReview);
router.put("/:reviewId/helpful", authMiddleware, markReviewHelpful);
router.put("/:reviewId", authMiddleware, updateReview);
router.delete("/:reviewId", authMiddleware, deleteReview);

// Admin Routes
router.get("/all", authMiddleware, isAdmin, getAllReviews);
router.put("/:reviewId/moderate", authMiddleware, isAdmin, moderateReview);

module.exports = router;
