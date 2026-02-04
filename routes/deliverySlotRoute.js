const express = require("express");
const {
  getAvailableSlots,
  getWeeklySlots,
  createDeliverySlot,
  createBulkSlots,
  updateDeliverySlot,
  deleteDeliverySlot,
  getAllSlots,
} = require("../controller/deliverySlotCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public/User Routes
router.get("/available", getAvailableSlots);
router.get("/weekly", getWeeklySlots);

// Admin Routes
router.post("/", authMiddleware, isAdmin, createDeliverySlot);
router.post("/bulk", authMiddleware, isAdmin, createBulkSlots);
router.put("/:id", authMiddleware, isAdmin, updateDeliverySlot);
router.delete("/:id", authMiddleware, isAdmin, deleteDeliverySlot);
router.get("/all", authMiddleware, isAdmin, getAllSlots);

module.exports = router;
