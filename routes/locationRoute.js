const express = require("express");
const {
  checkServiceability,
  checkServiceabilityByLocation,
  getAllServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  getDeliveryEstimate,
} = require("../controller/locationCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/check/:pincode", checkServiceability);
router.post("/check-location", checkServiceabilityByLocation);
router.get("/areas", getAllServiceAreas);
router.post("/delivery-estimate", getDeliveryEstimate);

// Admin Routes
router.post("/area", authMiddleware, isAdmin, createServiceArea);
router.put("/area/:id", authMiddleware, isAdmin, updateServiceArea);
router.delete("/area/:id", authMiddleware, isAdmin, deleteServiceArea);

module.exports = router;
