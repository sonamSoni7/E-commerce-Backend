const fs = require("fs");
const asyncHandler = require("express-async-handler");


const uploadImages = asyncHandler(async (req, res) => {
  try {
    const { cloudinaryUploadStream, cloudinaryDeleteImg } = require("../utils/cloudinary");
    const urls = [];
    const files = req.files;
    for (const file of files) {
      // file.buffer contains the binary data since we used memoryStorage
      const result = await cloudinaryUploadStream(file.buffer);
      urls.push({
        url: result.url,
        public_id: result.public_id,
        asset_id: result.asset_id
      });
    }
    const images = urls;
    res.json(images);
  } catch (error) {
    throw new Error(error);
  }
});

const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const { cloudinaryDeleteImg } = require("../utils/cloudinary");
    const deleted = await cloudinaryDeleteImg(id);
    res.json({ message: "Deleted" });
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};
