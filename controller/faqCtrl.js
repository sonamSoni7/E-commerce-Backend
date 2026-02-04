const FAQ = require("../models/faqModel");
const asyncHandler = require("express-async-handler");

// Get All FAQs (Public)
const getAllFAQs = asyncHandler(async (req, res) => {
  const { category } = req.query;

  let query = { isActive: true };

  if (category) {
    query.category = category;
  }

  const faqs = await FAQ.find(query).sort({ order: 1, createdAt: -1 });

  // Group by category
  const faqsByCategory = {};

  faqs.forEach((faq) => {
    if (!faqsByCategory[faq.category]) {
      faqsByCategory[faq.category] = [];
    }
    faqsByCategory[faq.category].push(faq);
  });

  res.json({
    success: true,
    faqs,
    faqsByCategory,
  });
});

// Get Single FAQ
const getFAQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faq = await FAQ.findById(id);

  if (!faq) {
    throw new Error("FAQ not found");
  }

  // Increment view count
  faq.viewCount += 1;
  await faq.save();

  res.json({
    success: true,
    faq,
  });
});

// Search FAQs
const searchFAQs = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({
      success: true,
      faqs: [],
    });
  }

  const faqs = await FAQ.find({
    $or: [
      { question: { $regex: q, $options: "i" } },
      { answer: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ],
    isActive: true,
  }).sort({ viewCount: -1 });

  res.json({
    success: true,
    faqs,
  });
});

// Mark FAQ as Helpful
const markFAQHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { helpful } = req.body; // true or false

  const faq = await FAQ.findById(id);

  if (!faq) {
    throw new Error("FAQ not found");
  }

  if (helpful) {
    faq.helpful += 1;
  } else {
    faq.notHelpful += 1;
  }

  await faq.save();

  res.json({
    success: true,
    helpful: faq.helpful,
    notHelpful: faq.notHelpful,
  });
});

// Get Popular FAQs
const getPopularFAQs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const faqs = await FAQ.find({ isActive: true })
    .sort({ viewCount: -1, helpful: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    faqs,
  });
});

// ADMIN: Create FAQ
const createFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.create(req.body);

  res.json({
    success: true,
    faq,
  });
});

// ADMIN: Update FAQ
const updateFAQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const faq = await FAQ.findByIdAndUpdate(id, req.body, { new: true });

  if (!faq) {
    throw new Error("FAQ not found");
  }

  res.json({
    success: true,
    faq,
  });
});

// ADMIN: Delete FAQ
const deleteFAQ = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await FAQ.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "FAQ deleted successfully",
  });
});

// ADMIN: Get All FAQs (Including inactive)
const adminGetAllFAQs = asyncHandler(async (req, res) => {
  const faqs = await FAQ.find().sort({ category: 1, order: 1 });

  res.json({
    success: true,
    faqs,
  });
});

// ADMIN: Reorder FAQs
const reorderFAQs = asyncHandler(async (req, res) => {
  const { faqIds } = req.body; // Array of FAQ IDs in desired order

  const updates = faqIds.map((id, index) =>
    FAQ.findByIdAndUpdate(id, { order: index })
  );

  await Promise.all(updates);

  res.json({
    success: true,
    message: "FAQs reordered successfully",
  });
});

module.exports = {
  getAllFAQs,
  getFAQ,
  searchFAQs,
  markFAQHelpful,
  getPopularFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  adminGetAllFAQs,
  reorderFAQs,
};
