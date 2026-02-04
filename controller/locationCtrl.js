const ServiceArea = require("../models/serviceAreaModel");
const asyncHandler = require("express-async-handler");

// Check Service Availability by Pincode
const checkServiceability = asyncHandler(async (req, res) => {
  const { pincode } = req.params;

  const serviceArea = await ServiceArea.findOne({
    pincodes: pincode,
    isActive: true,
  });

  if (!serviceArea) {
    return res.json({
      serviceable: false,
      message: "Sorry, we don't deliver to this area yet",
    });
  }

  res.json({
    serviceable: true,
    area: serviceArea,
    deliveryCharge: serviceArea.deliveryCharge,
    freeDeliveryAbove: serviceArea.freeDeliveryAbove,
    minimumOrderValue: serviceArea.minimumOrderValue,
    averageDeliveryTime: serviceArea.averageDeliveryTime,
    codAvailable: serviceArea.codAvailable,
  });
});

// Check Service Availability by Coordinates (Auto-detect location)
const checkServiceabilityByLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;

  const serviceArea = await ServiceArea.findOne({
    coordinates: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
    },
    isActive: true,
  });

  if (!serviceArea) {
    return res.json({
      serviceable: false,
      message: "Sorry, we don't deliver to this location yet",
    });
  }

  res.json({
    serviceable: true,
    area: serviceArea,
    deliveryCharge: serviceArea.deliveryCharge,
    freeDeliveryAbove: serviceArea.freeDeliveryAbove,
    minimumOrderValue: serviceArea.minimumOrderValue,
    averageDeliveryTime: serviceArea.averageDeliveryTime,
    codAvailable: serviceArea.codAvailable,
  });
});

// Get All Serviceable Areas
const getAllServiceAreas = asyncHandler(async (req, res) => {
  const areas = await ServiceArea.find({ isActive: true }).select(
    "name city state pincodes deliveryCharge freeDeliveryAbove"
  );

  res.json({
    success: true,
    areas,
  });
});

// Admin: Create Service Area
const createServiceArea = asyncHandler(async (req, res) => {
  const serviceArea = await ServiceArea.create(req.body);

  res.json({
    success: true,
    serviceArea,
  });
});

// Admin: Update Service Area
const updateServiceArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const serviceArea = await ServiceArea.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res.json({
    success: true,
    serviceArea,
  });
});

// Admin: Delete Service Area
const deleteServiceArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await ServiceArea.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Service area deleted successfully",
  });
});

// Get Delivery Estimate
const getDeliveryEstimate = asyncHandler(async (req, res) => {
  const { pincode, orderValue } = req.body;

  const serviceArea = await ServiceArea.findOne({
    pincodes: pincode,
    isActive: true,
  });

  if (!serviceArea) {
    throw new Error("Delivery not available in this area");
  }

  let deliveryCharge = serviceArea.deliveryCharge;

  if (orderValue >= serviceArea.freeDeliveryAbove) {
    deliveryCharge = 0;
  }

  const estimatedTime = new Date(
    Date.now() + serviceArea.averageDeliveryTime * 60 * 1000
  );

  res.json({
    success: true,
    deliveryCharge,
    estimatedDeliveryTime: estimatedTime,
    freeDeliveryAbove: serviceArea.freeDeliveryAbove,
    expressDeliveryAvailable: serviceArea.expressDeliveryAvailable,
    expressDeliveryCharge: serviceArea.expressDeliveryCharge,
  });
});

module.exports = {
  checkServiceability,
  checkServiceabilityByLocation,
  getAllServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  getDeliveryEstimate,
};
