const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getProfile,
  updateProfile,
  getUserProfileById,
  deleteProfilePhoto,
} = require("../controllers/profileController");
const { deleteAccount } = require("../controllers/authController");

router.get("/", authMiddleware, getProfile);
router.delete("/", authMiddleware, deleteAccount);
router.get("/:id", authMiddleware, getUserProfileById);
router.delete("/photo", authMiddleware, deleteProfilePhoto);

router.put(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("photo")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          message: error.message || "Photo upload failed.",
        });
      }

      next();
    });
  },
  updateProfile
);

module.exports = router;
