const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    read: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        emoji: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ match: 1, createdAt: 1 });
messageSchema.index({ match: 1, receiver: 1, read: 1 });

module.exports = mongoose.model("Message", messageSchema);
