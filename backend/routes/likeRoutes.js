const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { swipeLike, swipePass } = require("../controllers/discoverController");

router.use(authMiddleware);

router.post("/:userId", swipeLike);
router.post("/:userId/pass", swipePass);

module.exports = router;
