const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getMatches, unmatch } = require("../controllers/matchController");

router.use(authMiddleware);

router.get("/", getMatches);
router.delete("/:matchId", unmatch);

module.exports = router;
