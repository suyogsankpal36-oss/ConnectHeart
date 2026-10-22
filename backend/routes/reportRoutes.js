const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createReport,
  getAdminReports,
  updateAdminReport,
} = require("../controllers/reportController");

router.use(authMiddleware);

router.post("/", createReport);
router.get("/", getAdminReports);
router.patch("/:id", updateAdminReport);

module.exports = router;
