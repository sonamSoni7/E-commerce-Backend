const express = require("express");
const {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getBestSellers,
  getNewArrivals,
  getTrendingProducts,
  getDealsAndOffers,
} = require("../controller/recommendationCtrl");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/best-sellers", getBestSellers);
router.get("/new-arrivals", getNewArrivals);
router.get("/trending", getTrendingProducts);
router.get("/deals", getDealsAndOffers);
router.get("/similar/:productId", getSimilarProducts);
router.get("/frequently-bought/:productId", getFrequentlyBoughtTogether);

// Protected Routes
router.get("/personalized", authMiddleware, getPersonalizedRecommendations);

module.exports = router;
