const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb({ message: "Unsupported file format" }, false);
  }
};

const uploadPhoto = multer({
  storage: storage,
  fileFilter: multerFilter,
  limits: { fileSize: 10000000 },
});

const productImgResize = async (req, res, next) => {
  if (!req.files) return next();
  // Resizing logic moved to controller/cloud upload to handle buffers directly
  next();
};

module.exports = { uploadPhoto, productImgResize };
