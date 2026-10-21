const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        "inappropriate_photos",
        "harassment",
        "fake_profile",
        "spam_or_scam",
        "underage",
        "other",
      ],
    },
    details: {
      type: String,
      maxlength: 500,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
