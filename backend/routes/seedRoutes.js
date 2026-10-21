const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { seedProfiles } = require("../controllers/seedController");

// Seed endpoint requires authentication in all environments
router.post("/", authMiddleware, seedProfiles);

module.exports = router;
