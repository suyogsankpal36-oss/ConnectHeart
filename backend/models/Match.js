const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

matchSchema.index({ users: 1 });
matchSchema.index({ users: 1, updatedAt: -1 });

module.exports = mongoose.model("Match", matchSchema);
