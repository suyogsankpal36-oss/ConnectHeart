const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");

const VALID_REASONS = [
  "inappropriate_photos",
  "harassment",
  "fake_profile",
  "spam_or_scam",
  "underage",
  "other",
];

exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, details } = req.body;

    if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
      return res.status(400).json({ message: "Valid reported user ID format is required." });
    }

    if (reportedUserId === req.userId.toString()) {
      return res.status(400).json({ message: "Valid reported user ID is required." });
    }

    let normalizedReason = reason;
    if (normalizedReason === "spam") normalizedReason = "spam_or_scam";
    if (normalizedReason === "inappropriate") normalizedReason = "inappropriate_photos";

    if (!normalizedReason || !VALID_REASONS.includes(normalizedReason)) {
      return res.status(400).json({
        message: "Please choose a valid reason for reporting this user.",
      });
    }

    const targetUser = await User.findById(reportedUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Reported user does not exist." });
    }

    const report = await Report.create({
      reporter: req.userId,
      reportedUser: reportedUserId,
      reason: normalizedReason,
      details: typeof details === "string" ? details.slice(0, 500).trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Report submitted. Our safety team will review this profile.",
      reportId: report._id,
    });
  } catch (error) {
    console.error("Create report error:", error.message);
    return res.status(500).json({ message: "Could not submit safety report." });
  }
};
