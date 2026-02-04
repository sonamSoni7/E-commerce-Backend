const Product = require("../models/productModel");
const ProductCategory = require("../models/prodcategoryModel");
const asyncHandler = require("express-async-handler");

// Search Products with Auto-suggestions
const searchProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, brand, sort, limit = 20 } = req.query;

  let query = {};

  // Text search
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ];
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Brand filter
  if (brand) {
    query.brand = brand;
  }

  // Sort options
  let sortOption = {};
  switch (sort) {
    case "price_asc":
      sortOption = { price: 1 };
      break;
    case "price_desc":
      sortOption = { price: -1 };
      break;
    case "rating":
      sortOption = { totalrating: -1 };
      break;
    case "popular":
      sortOption = { sold: -1 };
      break;
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const products = await Product.find(query)
    .populate("category", "title")
    .populate("brand", "title")
    .sort(sortOption)
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: products.length,
    products,
  });
});

// Get Search Suggestions (Auto-complete)
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({
      success: true,
      suggestions: [],
    });
  }

  // Get product suggestions
  const productSuggestions = await Product.find({
    $or: [
      { title: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ],
  })
    .select("title slug images")
    .limit(5);

  // Get category suggestions
  const categorySuggestions = await ProductCategory.find({
    title: { $regex: q, $options: "i" },
  })
    .select("title")
    .limit(3);

  // Get popular search terms (you can implement this based on search history)
  const popularTerms = [];

  res.json({
    success: true,
    suggestions: {
      products: productSuggestions.map((p) => ({
        type: "product",
        title: p.title,
        slug: p.slug,
        image: p.images?.[0]?.url,
      })),
      categories: categorySuggestions.map((c) => ({
        type: "category",
        title: c.title,
      })),
      popular: popularTerms,
    },
  });
});

// Get Trending/Popular Searches
const getTrendingSearches = asyncHandler(async (req, res) => {
  // This can be implemented using a SearchHistory model
  // For now, returning top-selling products
  const trending = await Product.find()
    .sort({ sold: -1 })
    .limit(10)
    .select("title slug");

  res.json({
    success: true,
    trending: trending.map((p) => p.title),
  });
});

// Filter Products (Advanced)
const filterProducts = asyncHandler(async (req, res) => {
  const {
    categories,
    brands,
    colors,
    minPrice,
    maxPrice,
    rating,
    inStock,
    tags,
    sort,
    page = 1,
    limit = 20,
  } = req.query;

  let query = {};

  // Multiple categories
  if (categories) {
    const categoryArray = categories.split(",");
    query.category = { $in: categoryArray };
  }

  // Multiple brands
  if (brands) {
    const brandArray = brands.split(",");
    query.brand = { $in: brandArray };
  }

  // Multiple colors
  if (colors) {
    const colorArray = colors.split(",");
    query.color = { $in: colorArray };
  }

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Rating filter
  if (rating) {
    query.totalrating = { $gte: parseFloat(rating) };
  }

  // Stock availability
  if (inStock === "true") {
    query.quantity = { $gt: 0 };
  }

  // Tags
  if (tags) {
    const tagArray = tags.split(",");
    query.tags = { $in: tagArray };
  }

  // Sort
  let sortOption = {};
  switch (sort) {
    case "price_asc":
      sortOption = { price: 1 };
      break;
    case "price_desc":
      sortOption = { price: -1 };
      break;
    case "rating":
      sortOption = { totalrating: -1 };
      break;
    case "popular":
      sortOption = { sold: -1 };
      break;
    case "newest":
      sortOption = { createdAt: -1 };
      break;
    default:
      sortOption = { createdAt: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const products = await Product.find(query)
    .populate("category", "title")
    .populate("brand", "title")
    .populate("color", "title")
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      limit: parseInt(limit),
    },
  });
});

module.exports = {
  searchProducts,
  getSearchSuggestions,
  getTrendingSearches,
  filterProducts,
};
