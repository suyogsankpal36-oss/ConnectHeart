
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const uploadDir = path.join(__dirname, "..", "uploads", "profiles");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeExtension = /^\.(jpg|jpeg|png|webp|gif)$/.test(extension)
      ? extension
      : ".jpg";

    callback(
      null,
      `${req.userId}-${crypto.randomBytes(8).toString("hex")}${safeExtension}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPG, PNG, WEBP, or GIF images are allowed."));
    }

    callback(null, true);
  },
});

module.exports = upload;
