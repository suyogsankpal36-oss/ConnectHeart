const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
  googleLogin,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Authenticated auth routes
router.get("/me", authMiddleware, getMe);
router.post("/change-password", authMiddleware, changePassword);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.post("/delete-account", authMiddleware, deleteAccount);

module.exports = router;
