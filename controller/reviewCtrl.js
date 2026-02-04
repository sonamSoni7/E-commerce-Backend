const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const asyncHandler = require("express-async-handler");

// Create Product Review
const createReview = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { productId, orderId, rating, title, comment, images } = req.body;

  // Verify user has purchased this product
  const order = await Order.findOne({
    _id: orderId,
    user: _id,
    "orderItems.product": productId,
  });

  if (!order) {
    throw new Error("You can only review products you have purchased");
  }

  // Check if review already exists
  const existingReview = await Review.findOne({
    product: productId,
    user: _id,
  });

  if (existingReview) {
    throw new Error("You have already reviewed this product");
  }

  const review = await Review.create({
    product: productId,
    user: _id,
    order: orderId,
    rating,
    title,
    comment,
    images: images || [],
    isVerifiedPurchase: true,
  });

  // Update product rating
  await updateProductRating(productId);

  const populatedReview = await Review.findById(review._id)
    .populate("user", "firstname lastname")
    .populate("product", "title");

  res.json({
    success: true,
    review: populatedReview,
  });
});

// Get Product Reviews
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = "recent", rating } = req.query;

  let query = {
    product: productId,
    status: "approved",
  };

  if (rating) {
    query.rating = parseInt(rating);
  }

  let sortOption = {};
  switch (sort) {
    case "recent":
      sortOption = { createdAt: -1 };
      break;
    case "helpful":
      sortOption = { helpful: -1 };
      break;
    case "rating_high":
      sortOption = { rating: -1 };
      break;
    case "rating_low":
      sortOption = { rating: 1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find(query)
    .populate("user", "firstname lastname")
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(query);

  // Get rating distribution
  const ratingDistribution = await Review.aggregate([
    { $match: { product: productId, status: "approved" } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
    ratingDistribution,
  });
});

// Mark Review as Helpful/Not Helpful
const markReviewHelpful = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { reviewId } = req.params;
  const { helpful } = req.body; // true or false

  const review = await Review.findById(reviewId);

  if (!review) {
    throw new Error("Review not found");
  }

  // Remove from opposite array if exists
  if (helpful) {
    review.notHelpful = review.notHelpful.filter(
      (id) => id.toString() !== _id.toString()
    );
    if (!review.helpful.includes(_id)) {
      review.helpful.push(_id);
    }
  } else {
    review.helpful = review.helpful.filter(
      (id) => id.toString() !== _id.toString()
    );
    if (!review.notHelpful.includes(_id)) {
      review.notHelpful.push(_id);
    }
  }

  await review.save();

  res.json({
    success: true,
    helpfulCount: review.helpful.length,
    notHelpfulCount: review.notHelpful.length,
  });
});

// Update Review
const updateReview = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { reviewId } = req.params;
  const { rating, title, comment, images } = req.body;

  const review = await Review.findOne({
    _id: reviewId,
    user: _id,
  });

  if (!review) {
    throw new Error("Review not found or unauthorized");
  }

  review.rating = rating || review.rating;
  review.title = title || review.title;
  review.comment = comment || review.comment;
  review.images = images || review.images;
  review.status = "pending"; // Re-submit for approval

  await review.save();

  // Update product rating
  await updateProductRating(review.product);

  res.json({
    success: true,
    review,
  });
});

// Delete Review
const deleteReview = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { reviewId } = req.params;

  const review = await Review.findOne({
    _id: reviewId,
    user: _id,
  });

  if (!review) {
    throw new Error("Review not found or unauthorized");
  }

  const productId = review.product;

  await Review.findByIdAndDelete(reviewId);

  // Update product rating
  await updateProductRating(productId);

  res.json({
    success: true,
    message: "Review deleted successfully",
  });
});

// Admin: Approve/Reject Review
const moderateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { status, adminResponse } = req.body; // status: 'approved' or 'rejected'

  const review = await Review.findByIdAndUpdate(
    reviewId,
    {
      status,
      adminResponse: adminResponse
        ? {
            comment: adminResponse,
            respondedAt: Date.now(),
            respondedBy: req.user._id,
          }
        : undefined,
    },
    { new: true }
  );

  // Update product rating if approved
  if (status === "approved") {
    await updateProductRating(review.product);
  }

  res.json({
    success: true,
    review,
  });
});

// Admin: Get All Reviews (Pending/Approved/Rejected)
const getAllReviews = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  let query = {};
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const reviews = await Review.find(query)
    .populate("user", "firstname lastname email")
    .populate("product", "title")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Review.countDocuments(query);

  res.json({
    success: true,
    reviews,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Helper function to update product rating
async function updateProductRating(productId) {
  const reviews = await Review.find({
    product: productId,
    status: "approved",
  });

  if (reviews.length === 0) {
    await Product.findByIdAndUpdate(productId, {
      totalrating: 0,
    });
    return;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = totalRating / reviews.length;

  await Product.findByIdAndUpdate(productId, {
    totalrating: avgRating.toFixed(1),
  });
}

module.exports = {
  createReview,
  getProductReviews,
  markReviewHelpful,
  updateReview,
  deleteReview,
  moderateReview,
  getAllReviews,
};
