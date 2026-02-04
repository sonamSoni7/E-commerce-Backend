const DeliverySlot = require("../models/deliverySlotModel");
const asyncHandler = require("express-async-handler");

// Get Available Delivery Slots
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { pincode, date } = req.query;

  if (!pincode || !date) {
    throw new Error("Pincode and date are required");
  }

  const queryDate = new Date(date);
  queryDate.setHours(0, 0, 0, 0);

  const nextDay = new Date(queryDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const slots = await DeliverySlot.find({
    pincode: pincode,
    date: {
      $gte: queryDate,
      $lt: nextDay,
    },
    isActive: true,
  }).sort({ priority: 1, startTime: 1 });

  // Filter available slots
  const availableSlots = slots.filter(
    (slot) => slot.currentOrders < slot.maxOrders
  );

  res.json({
    success: true,
    slots: availableSlots,
  });
});

// Get Slots for Next 7 Days
const getWeeklySlots = asyncHandler(async (req, res) => {
  const { pincode } = req.query;

  if (!pincode) {
    throw new Error("Pincode is required");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const slots = await DeliverySlot.find({
    pincode: pincode,
    date: {
      $gte: today,
      $lt: nextWeek,
    },
    isActive: true,
  }).sort({ date: 1, startTime: 1 });

  // Group slots by date
  const slotsByDate = {};

  slots.forEach((slot) => {
    const dateKey = slot.date.toISOString().split("T")[0];
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = [];
    }
    if (slot.currentOrders < slot.maxOrders) {
      slotsByDate[dateKey].push(slot);
    }
  });

  res.json({
    success: true,
    slotsByDate,
  });
});

// Admin: Create Delivery Slot
const createDeliverySlot = asyncHandler(async (req, res) => {
  const slot = await DeliverySlot.create(req.body);

  res.json({
    success: true,
    slot,
  });
});

// Admin: Create Bulk Delivery Slots
const createBulkSlots = asyncHandler(async (req, res) => {
  const { dates, timeSlots, area, pincode, maxOrders } = req.body;

  const slots = [];

  for (const date of dates) {
    for (const timeSlot of timeSlots) {
      slots.push({
        date: new Date(date),
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        area,
        pincode,
        maxOrders: maxOrders || 50,
        isActive: true,
      });
    }
  }

  const createdSlots = await DeliverySlot.insertMany(slots);

  res.json({
    success: true,
    count: createdSlots.length,
    slots: createdSlots,
  });
});

// Admin: Update Delivery Slot
const updateDeliverySlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const slot = await DeliverySlot.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  res.json({
    success: true,
    slot,
  });
});

// Admin: Delete Delivery Slot
const deleteDeliverySlot = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await DeliverySlot.findByIdAndDelete(id);

  res.json({
    success: true,
    message: "Delivery slot deleted successfully",
  });
});

// Admin: Get All Slots
const getAllSlots = asyncHandler(async (req, res) => {
  const { date, area } = req.query;

  let query = {};

  if (date) {
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    query.date = {
      $gte: queryDate,
      $lt: nextDay,
    };
  }

  if (area) {
    query.area = area;
  }

  const slots = await DeliverySlot.find(query).sort({ date: 1, startTime: 1 });

  res.json({
    success: true,
    slots,
  });
});

module.exports = {
  getAvailableSlots,
  getWeeklySlots,
  createDeliverySlot,
  createBulkSlots,
  updateDeliverySlot,
  deleteDeliverySlot,
  getAllSlots,
};
