const mongoose = require("mongoose");
const User = require("../models/User");
const Like = require("../models/Like");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Block = require("../models/Block");
const Notification = require("../models/Notification");

function calculateCompatibility(currentUser, targetUser) {
  if (!currentUser || !targetUser) return 75;

  let score = 62; // baseline

  // 1. Mutual Interests (up to +24%)
  const userInterests = currentUser.interests || [];
  const targetInterests = targetUser.interests || [];
  const mutual = targetInterests.filter((item) => userInterests.includes(item));
  score += Math.min(24, mutual.length * 8);

  // 2. Dating Intent / Looking for (+10%)
  if (
    currentUser.lookingFor &&
    targetUser.lookingFor &&
    currentUser.lookingFor === targetUser.lookingFor
  ) {
    score += 10;
  }

  // 3. Lifestyle matches (+8%)
  const curLife = currentUser.lifestyle || {};
  const tarLife = targetUser.lifestyle || {};
  if (curLife.workout && tarLife.workout && curLife.workout === tarLife.workout) score += 4;
  if (curLife.pets && tarLife.pets && curLife.pets === tarLife.pets) score += 4;

  // 4. Deterministic hash variance so score varies organically per user pair
  const hash = (currentUser._id.toString() + targetUser._id.toString())
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variance = (hash % 11) - 3; // -3 to +7
  score += variance;

  return Math.min(99, Math.max(68, score));
}

function formatProfile(user, currentUser = null) {
  const currentUserInterests = currentUser?.interests || [];
  const mutualInterests = Array.isArray(user.interests)
    ? user.interests.filter((item) => currentUserInterests.includes(item))
    : [];

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    user.name || "CH"
  )}&backgroundColor=1c1518,241a20&textColor=c9a96e&fontWeight=600`;

  const rawPhotos =
    Array.isArray(user.photos) && user.photos.length > 0
      ? user.photos
      : [user.profilePhoto].filter(Boolean);

  const photos = rawPhotos.length > 0 ? rawPhotos : [defaultAvatar];
  const profilePhoto = user.profilePhoto || photos[0] || defaultAvatar;

  const compatibilityScore = currentUser
    ? calculateCompatibility(currentUser, user)
    : 80;

  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    bio: user.bio || "",
    city: user.city || "",
    interests: user.interests || [],
    mutualInterests,
    lookingFor: user.lookingFor || "relationship",
    profilePhoto,
    photos,
    prompts: user.prompts || [],
    lifestyle: user.lifestyle || {},
    isVerified: !!user.isVerified,
    compatibilityScore,
    createdAt: user.createdAt,
  };
}

exports.getDiscoveryFeed = async (req, res) => {
  try {
    const {
      gender,
      minAge,
      maxAge,
      lookingFor,
      city,
      interest,
      verifiedOnly,
      limit = 40,
      page = 1,
    } = req.query;

    const currentUser = await User.findById(req.userId);

    // Find all users already liked or passed by the current user
    const [swiped, blocks] = await Promise.all([
      Like.find({ fromUser: req.userId }).select("toUser"),
      Block.find({
        $or: [{ blocker: req.userId }, { blockedUser: req.userId }],
      }),
    ]);

    const blockedIds = blocks.map((b) =>
      b.blocker.toString() === req.userId.toString() ? b.blockedUser : b.blocker
    );

    const excludedIds = [req.userId, ...swiped.map((s) => s.toUser), ...blockedIds];

    const query = {
      _id: { $nin: excludedIds },
      isActive: { $ne: false },
      isIncognito: { $ne: true },
      "discoveryPreferences.hideProfile": { $ne: true },
      email: { $not: /(@connecthearts\.qa|@test\.com|qa_automation|test_)/i },
      name: { $not: /^Test /i },
    };

    const prefs = currentUser?.discoveryPreferences || {};

    const selectedGender = gender !== undefined ? gender : (prefs.genderPreference || "all");
    if (selectedGender && selectedGender !== "all") {
      query.gender = selectedGender;
    }

    if (lookingFor && lookingFor !== "all") {
      query.lookingFor = lookingFor;
    }

    const effectiveMinAge = minAge ? Number(minAge) : (prefs.minAge || 18);
    const effectiveMaxAge = maxAge ? Number(maxAge) : (prefs.maxAge || 120);

    if (minAge || maxAge || (prefs.minAge && prefs.minAge > 18) || (prefs.maxAge && prefs.maxAge < 100)) {
      query.age = {};
      if (effectiveMinAge) query.age.$gte = effectiveMinAge;
      if (effectiveMaxAge) query.age.$lte = effectiveMaxAge;
    }

    if (city && city.trim()) {
      const escapedCity = city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.city = { $regex: new RegExp(escapedCity, "i") };
    }

    if (interest && interest.trim()) {
      query.interests = interest.trim();
    }

    if (verifiedOnly === "true") {
      query.isVerified = true;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 40));
    const skip = (pageNum - 1) * limitNum;

    const [totalCount, potentialMatches] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 }),
    ]);

    const profiles = potentialMatches.map((user) =>
      formatProfile(user, currentUser)
    );

    // Sort profiles with highest compatibility first
    profiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const hasMore = pageNum < totalPages;

    return res.json({
      count: profiles.length,
      totalCount,
      page: pageNum,
      totalPages,
      hasMore,
      profiles,
    });
  } catch (error) {
    console.error("Discovery feed error:", error.message);
    return res.status(500).json({ message: "Could not load discovery feed." });
  }
};

exports.swipeLike = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.body.targetUserId;
    const type = req.body.type || "like";
    const comment =
      typeof req.body.comment === "string" ? req.body.comment.trim().slice(0, 280) : "";

    if (!targetUserId || targetUserId === req.userId.toString()) {
      return res.status(400).json({ message: "Valid target user ID required." });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Check if target user is blocked
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blockedUser: targetUserId },
        { blocker: targetUserId, blockedUser: req.userId },
      ],
    });

    if (isBlocked) {
      return res.status(400).json({ message: "Cannot interact with a blocked user." });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found." });
    }

    // Record like / superlike with optional Hinge-style comment
    await Like.findOneAndUpdate(
      { fromUser: req.userId, toUser: targetUserId },
      { type: type === "superlike" ? "superlike" : "like", comment },
      { upsert: true, returnDocument: "after" }
    );

    // Check if target user has already liked the current user
    const targetLike = await Like.findOne({
      fromUser: targetUserId,
      toUser: req.userId,
      type: { $in: ["like", "superlike"] },
    });

    if (targetLike) {
      // It's a mutual match!
      let match = await Match.findOne({
        users: { $all: [req.userId, targetUserId] },
      });

      if (!match) {
        try {
          match = await Match.create({
            users: [req.userId, targetUserId],
          });
        } catch {
          match = await Match.findOne({
            users: { $all: [req.userId, targetUserId] },
          });
        }
      }

      const currentUser = await User.findById(req.userId);

      // If either user sent a comment on their like, start conversation with it!
      const initialComment = comment || targetLike.comment;
      if (initialComment) {
        const commenterId = comment ? req.userId : targetUserId;
        const recipientId = comment ? targetUserId : req.userId;
        const openingMsg = await Message.create({
          match: match._id,
          sender: commenterId,
          receiver: recipientId,
          text: initialComment,
          read: false,
        });

        match.lastMessage = openingMsg._id;
        match.updatedAt = new Date();
        await match.save();
      }

      // Create notification for target user
      await Notification.create({
        recipient: targetUserId,
        sender: req.userId,
        type: "match",
        title: "New Match! 🎉",
        message: `${currentUser?.name || "Someone"} matched with you!`,
        matchId: match._id,
      }).catch((e) => console.warn("Match notification error:", e.message));

      const io = req.app.get("io");
      if (io) {
        io.to(`user_${targetUserId}`).emit("new_match_event", {
          matchId: match._id,
          matchedUser: formatProfile(currentUser, targetUser),
        });
        io.to(`user_${targetUserId}`).emit("new_notification", {
          type: "match",
          title: "New Match! 🎉",
          message: `${currentUser?.name || "Someone"} matched with you!`,
          matchId: match._id,
        });
      }

      return res.json({
        success: true,
        isMatch: true,
        matchId: match._id,
        matchedUser: formatProfile(targetUser, currentUser),
      });
    }

    return res.json({
      success: true,
      isMatch: false,
    });
  } catch (error) {
    console.error("Swipe like error:", error.message);
    return res.status(500).json({ message: "Failed to record like." });
  }
};

exports.swipePass = async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.body.targetUserId;

    if (!targetUserId || targetUserId === req.userId.toString()) {
      return res.status(400).json({ message: "Valid target user ID required." });
    }
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    await Like.findOneAndUpdate(
      { fromUser: req.userId, toUser: targetUserId },
      { type: "pass" },
      { upsert: true, returnDocument: "after" }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Swipe pass error:", error.message);
    return res.status(500).json({ message: "Failed to record pass." });
  }
};

exports.rewindSwipe = async (req, res) => {
  try {
    // Find the most recent 'pass' like by this user
    const lastPass = await Like.findOne({
      fromUser: req.userId,
      type: "pass",
    }).sort({ updatedAt: -1 });

    if (!lastPass) {
      return res
        .status(404)
        .json({ message: "No recent passed profiles to rewind." });
    }

    const targetUser = await User.findById(lastPass.toUser);
    await Like.findByIdAndDelete(lastPass._id);

    const currentUser = await User.findById(req.userId);

    return res.json({
      success: true,
      message: `Rewound ${targetUser?.name || "profile"}!`,
      profile: targetUser ? formatProfile(targetUser, currentUser) : null,
    });
  } catch (error) {
    console.error("Rewind error:", error.message);
    return res.status(500).json({ message: "Failed to rewind." });
  }
};

exports.resetPasses = async (req, res) => {
  try {
    // 1. Delete all passes
    const passResult = await Like.deleteMany({
      fromUser: req.userId,
      type: "pass",
    });

    // 2. Identify active mutual matches so existing chats remain intact
    const matches = await Match.find({ users: req.userId }).select("users");
    const matchedUserIds = matches
      .flatMap((m) => m.users.map((u) => u.toString()))
      .filter((id) => id !== req.userId.toString());

    // 3. Delete non-mutual likes/superlikes so user can rediscover profiles
    const likeResult = await Like.deleteMany({
      fromUser: req.userId,
      type: { $in: ["like", "superlike"] },
      toUser: { $nin: matchedUserIds },
    });

    const totalReset = (passResult.deletedCount || 0) + (likeResult.deletedCount || 0);

    return res.json({
      success: true,
      resetCount: totalReset,
      message:
        totalReset > 0
          ? `Reset ${totalReset} previous swipe${totalReset === 1 ? "" : "s"}. You can explore them again!`
          : "Deck refreshed! You can explore profiles again.",
    });
  } catch (error) {
    console.error("Reset passes error:", error.message);
    return res.status(500).json({ message: "Failed to reset passed profiles." });
  }
};
