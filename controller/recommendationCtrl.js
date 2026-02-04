const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");

// Get Personalized Recommendations
const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  // Get user's order history
  const orders = await Order.find({ user: _id })
    .populate("orderItems.product")
    .sort({ createdAt: -1 })
    .limit(10);

  // Extract purchased product categories and brands
  const purchasedCategories = new Set();
  const purchasedBrands = new Set();
  const purchasedProducts = new Set();

  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (item.product) {
        purchasedProducts.add(item.product._id.toString());
        if (item.product.category) {
          purchasedCategories.add(item.product.category.toString());
        }
        if (item.product.brand) {
          purchasedBrands.add(item.product.brand.toString());
        }
      }
    });
  });

  // Get user preferences
  const user = await User.findById(_id);
  const preferredCategories = user.preferences?.categories || [];

  // Build recommendation query
  const recommendationQuery = {
    _id: { $nin: Array.from(purchasedProducts) }, // Exclude already purchased
    $or: [
      { category: { $in: Array.from(purchasedCategories) } },
      { brand: { $in: Array.from(purchasedBrands) } },
      { category: { $in: preferredCategories } },
    ],
  };

  const recommendations = await Product.find(recommendationQuery)
    .populate("category", "title")
    .populate("brand", "title")
    .sort({ totalrating: -1, sold: -1 })
    .limit(12);

  res.json({
    success: true,
    recommendations,
  });
});

// Get Similar Products
const getSimilarProducts = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Product not found");
  }

  const similarProducts = await Product.find({
    _id: { $ne: productId },
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags } },
    ],
  })
    .populate("category", "title")
    .populate("brand", "title")
    .sort({ totalrating: -1 })
    .limit(8);

  res.json({
    success: true,
    similarProducts,
  });
});

// Get Frequently Bought Together
const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // Find orders containing this product
  const ordersWithProduct = await Order.find({
    "orderItems.product": productId,
  }).populate("orderItems.product");

  // Count product co-occurrences
  const productCounts = {};

  ordersWithProduct.forEach((order) => {
    order.orderItems.forEach((item) => {
      if (item.product && item.product._id.toString() !== productId) {
        const pid = item.product._id.toString();
        productCounts[pid] = (productCounts[pid] || 0) + 1;
      }
    });
  });

  // Sort by frequency
  const sortedProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map((entry) => entry[0]);

  const frequentlyBought = await Product.find({
    _id: { $in: sortedProducts },
  })
    .populate("category", "title")
    .populate("brand", "title");

  res.json({
    success: true,
    frequentlyBought,
  });
});

// Get Best Sellers
const getBestSellers = asyncHandler(async (req, res) => {
  const { category, limit = 10 } = req.query;

  let query = {};
  if (category) {
    query.category = category;
  }

  const bestSellers = await Product.find(query)
    .populate("category", "title")
    .populate("brand", "title")
    .sort({ sold: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    bestSellers,
  });
});

// Get New Arrivals
const getNewArrivals = asyncHandler(async (req, res) => {
  const { category, limit = 10 } = req.query;

  let query = {};
  if (category) {
    query.category = category;
  }

  const newArrivals = await Product.find(query)
    .populate("category", "title")
    .populate("brand", "title")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    newArrivals,
  });
});

// Get Trending Products
const getTrendingProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get products with high recent sales (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentOrders = await Order.find({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Count product occurrences
  const productCounts = {};

  recentOrders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const pid = item.product.toString();
      productCounts[pid] = (productCounts[pid] || 0) + item.quantity;
    });
  });

  // Sort by frequency
  const trendingProductIds = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, parseInt(limit))
    .map((entry) => entry[0]);

  const trendingProducts = await Product.find({
    _id: { $in: trendingProductIds },
  })
    .populate("category", "title")
    .populate("brand", "title");

  res.json({
    success: true,
    trendingProducts,
  });
});

// Get Deals and Offers
const getDealsAndOffers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Products with tags like "deal", "offer", "sale"
  const deals = await Product.find({
    tags: { $in: ["deal", "offer", "sale", "discount"] },
  })
    .populate("category", "title")
    .populate("brand", "title")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    deals,
  });
});

module.exports = {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getBestSellers,
  getNewArrivals,
  getTrendingProducts,
  getDealsAndOffers,
};
