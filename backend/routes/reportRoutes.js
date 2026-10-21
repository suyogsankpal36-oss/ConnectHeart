const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { createReport } = require("../controllers/reportController");

router.use(authMiddleware);

router.post("/", createReport);

module.exports = router;
