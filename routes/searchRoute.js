const express = require("express");
const {
  searchProducts,
  getSearchSuggestions,
  getTrendingSearches,
  filterProducts,
} = require("../controller/searchCtrl");

const router = express.Router();

router.get("/", searchProducts);
router.get("/suggestions", getSearchSuggestions);
router.get("/trending", getTrendingSearches);
router.get("/filter", filterProducts);

module.exports = router;
