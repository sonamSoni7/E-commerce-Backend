const express = require("express");
const {
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
} = require("../controller/faqCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/", getAllFAQs);
router.get("/popular", getPopularFAQs);
router.get("/search", searchFAQs);
router.get("/:id", getFAQ);
router.post("/:id/helpful", markFAQHelpful);

// Admin Routes
router.post("/", authMiddleware, isAdmin, createFAQ);
router.put("/:id", authMiddleware, isAdmin, updateFAQ);
router.delete("/:id", authMiddleware, isAdmin, deleteFAQ);
router.get("/admin/all", authMiddleware, isAdmin, adminGetAllFAQs);
router.post("/reorder", authMiddleware, isAdmin, reorderFAQs);

module.exports = router;
