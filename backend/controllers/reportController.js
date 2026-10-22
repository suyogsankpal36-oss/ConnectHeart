const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");

const VALID_REASONS = [
  "inappropriate_photos",
  "inappropriate_content",
  "harassment",
  "fake_profile",
  "spam",
  "spam_or_scam",
  "underage",
  "other",
];

exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, details, description } = req.body;

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

    const reportText = typeof details === "string" ? details : (typeof description === "string" ? description : "");

    const report = await Report.create({
      reporter: req.userId,
      reportedUser: reportedUserId,
      reason: normalizedReason,
      details: reportText.slice(0, 500).trim(),
      description: reportText.slice(0, 500).trim(),
      status: "open",
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

exports.getAdminReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = req.query.status;

    const query = {};
    if (status) {
      query.status = status;
    }

    const [reports, total] = await Promise.all([
      Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("reporter", "name email age gender")
        .populate("reportedUser", "name email age gender isActive isVerified"),
      Report.countDocuments(query),
    ]);

    return res.json({
      success: true,
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin reports error:", error.message);
    return res.status(500).json({ message: "Could not retrieve moderation reports." });
  }
};

exports.updateAdminReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, actionOnUser } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid report ID format." });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found." });
    }

    if (status) {
      const validStatuses = ["open", "pending", "under_review", "reviewed", "resolved", "dismissed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid moderation status value." });
      }
      report.status = status;
    }

    // Administrative action: suspend or reactivate reported user (FR-11)
    if (actionOnUser === "suspend") {
      await User.findByIdAndUpdate(report.reportedUser, { isActive: false });
    } else if (actionOnUser === "reactivate") {
      await User.findByIdAndUpdate(report.reportedUser, { isActive: true });
    }

    await report.save();

    return res.json({
      success: true,
      message: "Moderation report updated successfully.",
      report,
    });
  } catch (error) {
    console.error("Update admin report error:", error.message);
    return res.status(500).json({ message: "Could not update moderation report." });
  }
};
