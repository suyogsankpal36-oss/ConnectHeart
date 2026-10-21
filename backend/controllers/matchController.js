const mongoose = require("mongoose");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Like = require("../models/Like");
const Block = require("../models/Block");

exports.getMatches = async (req, res) => {
  try {
    const [matches, blocks] = await Promise.all([
      Match.find({ users: req.userId })
        .populate("users", "name age gender bio city interests lookingFor profilePhoto photos prompts lifestyle isVerified")
        .populate("lastMessage")
        .sort({ updatedAt: -1 }),
      Block.find({
        $or: [{ blocker: req.userId }, { blockedUser: req.userId }],
      }),
    ]);

    const blockedUserIds = new Set(
      blocks.map((b) =>
        b.blocker.toString() === req.userId.toString()
          ? b.blockedUser.toString()
          : b.blocker.toString()
      )
    );

    const formattedMatches = matches
      .map((match) => {
        const otherUser = match.users.find(
          (u) => u && u._id.toString() !== req.userId.toString()
        );

        if (!otherUser || blockedUserIds.has(otherUser._id.toString())) {
          return null;
        }

        const photos =
          Array.isArray(otherUser.photos) && otherUser.photos.length > 0
            ? otherUser.photos
            : [otherUser.profilePhoto].filter(Boolean);

        return {
          matchId: match._id,
          matchedUser: otherUser
            ? {
                id: otherUser._id,
                _id: otherUser._id,
                name: otherUser.name,
                age: otherUser.age,
                gender: otherUser.gender,
                bio: otherUser.bio,
                city: otherUser.city,
                interests: otherUser.interests,
                lookingFor: otherUser.lookingFor,
                profilePhoto: otherUser.profilePhoto || (photos[0] || ""),
                photos,
                prompts: otherUser.prompts || [],
                lifestyle: otherUser.lifestyle || {},
                isVerified: !!otherUser.isVerified,
              }
            : null,
        lastMessage: match.lastMessage
          ? {
              id: match.lastMessage._id,
              text: match.lastMessage.text,
              sender: match.lastMessage.sender,
              read: match.lastMessage.read,
              createdAt: match.lastMessage.createdAt,
            }
          : null,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      };
    });

    return res.json({ matches: formattedMatches.filter((m) => m.matchedUser !== null) });
  } catch (error) {
    console.error("Get matches error:", error.message);
    return res.status(500).json({ message: "Could not load matches." });
  }
};

exports.unmatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID format." });
    }

    const match = await Match.findOne({
      _id: matchId,
      users: req.userId,
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    const otherUserId = match.users.find(
      (uId) => uId.toString() !== req.userId.toString()
    );

    // Remove match and related messages
    await Promise.all([
      Match.findByIdAndDelete(matchId),
      Message.deleteMany({ match: matchId }),
      otherUserId
        ? Like.deleteMany({
            $or: [
              { fromUser: req.userId, toUser: otherUserId },
              { fromUser: otherUserId, toUser: req.userId },
            ],
          })
        : Promise.resolve(),
    ]);

    return res.json({ success: true, message: "Unmatched successfully." });
  } catch (error) {
    console.error("Unmatch error:", error.message);
    return res.status(500).json({ message: "Failed to unmatch." });
  }
};
