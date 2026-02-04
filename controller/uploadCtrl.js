const fs = require("fs");
const asyncHandler = require("express-async-handler");


const uploadImages = asyncHandler(async (req, res) => {
  try {
    const urls = [];
    const files = req.files;
    for (const file of files) {
      const { filename } = file;
      // Construct the URL path relative to the public directory
      // Note: uploadImage middleware saves to public/images/products/
      const url = `/images/products/${filename}`;
      urls.push({
        url: url,
        public_id: filename, // Using filename as public_id for simplicity
        asset_id: filename // redundant but keeping structure
      });
    }
    const images = urls;
    res.json(images);
  } catch (error) {
    console.error("Upload Control Error:", error);
    throw new Error(error);
  }
});

const deleteImages = asyncHandler(async (req, res) => {
  const { id } = req.params; // id here is the filename
  try {
    const filePath = `public/images/products/${id}`;
    // Check if file exists before deleting preventing crash
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "Deleted" });
    } else {
      // Also check checking without 'products' subfolder just in case or return success
      res.json({ message: "File not found or already deleted" });
    }

  } catch (error) {
    throw new Error(error);
  }
});

module.exports = {
  uploadImages,
  deleteImages,
};
