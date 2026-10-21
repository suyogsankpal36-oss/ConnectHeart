const mongoose = require("mongoose");
const Match = require("../models/Match");
const Message = require("../models/Message");
const User = require("../models/User");
const Block = require("../models/Block");
const Notification = require("../models/Notification");

function generatePersonaReply(receiver, text) {
  const lower = (text || "").toLowerCase().trim();
  const name = receiver?.name?.split(" ")[0] || "there";
  const city = receiver?.city || "nearby";
  const interests = receiver?.interests || ["travel", "music", "coffee"];
  const interestOne = interests[0] || "coffee dates";
  const interestTwo = interests[1] || "indie music";

  // Greetings
  if (
    lower.includes("hi") ||
    lower.includes("hello") ||
    lower.includes("hey") ||
    lower.includes("sup") ||
    lower.includes("what's up") ||
    lower.includes("yo")
  ) {
    const greetingReplies = [
      `Hey! So good to hear from you 😊 How has your day been treating you?`,
      `Hi there! I was just taking a quick coffee break ☕ What have you been up to today?`,
      `Hey! Really glad we connected ❤️ Tell me, what's been the highlight of your week so far?`,
      `Hey ${name}! Loved your profile. How is your afternoon going? ✨`,
    ];
    return greetingReplies[Math.floor(Math.random() * greetingReplies.length)];
  }

  // Location / City
  if (
    lower.includes("where") ||
    lower.includes("city") ||
    lower.includes("live") ||
    lower.includes("from") ||
    lower.includes("place")
  ) {
    return `I'm based in ${city}! I love finding cute neighborhood spots and scenic views around here. Are you from around here too or somewhere else?`;
  }

  // Coffee / drinks / date meetup
  if (
    lower.includes("coffee") ||
    lower.includes("tea") ||
    lower.includes("drink") ||
    lower.includes("date") ||
    lower.includes("meet") ||
    lower.includes("hang out") ||
    lower.includes("grab")
  ) {
    return `A little ${interestOne} date sounds lovely! I know a cozy spot with amazing ambiance and great energy. When are you usually free during the week? ☕`;
  }

  // Music
  if (
    lower.includes("music") ||
    lower.includes("song") ||
    lower.includes("playlist") ||
    lower.includes("band") ||
    lower.includes("listen") ||
    lower.includes("track")
  ) {
    return `Music is such a huge part of my life! I've had ${interestTwo} on repeat all week. Send me your current favorite song, I want to add it to my playlist! 🎵`;
  }

  // Food / Cooking
  if (
    lower.includes("food") ||
    lower.includes("cook") ||
    lower.includes("eat") ||
    lower.includes("dinner") ||
    lower.includes("pasta") ||
    lower.includes("pizza") ||
    lower.includes("sushi") ||
    lower.includes("bake")
  ) {
    return `Now you're speaking my language! Good food is 100% the way to my heart. Are you more of a home-cooked chef or a restaurant foodie explorer? 🍝`;
  }

  // Travel / Vacations
  if (
    lower.includes("travel") ||
    lower.includes("trip") ||
    lower.includes("vacation") ||
    lower.includes("beach") ||
    lower.includes("mountain") ||
    lower.includes("flight") ||
    lower.includes("holiday")
  ) {
    return `Spontaneous travel is the best feeling in the world ✈️ If we could teleport anywhere this weekend with no alarms, where would we go first?`;
  }

  // Compliments / Flirting
  if (
    lower.includes("cute") ||
    lower.includes("beautiful") ||
    lower.includes("pretty") ||
    lower.includes("handsome") ||
    lower.includes("hot") ||
    lower.includes("smile") ||
    lower.includes("eyes") ||
    lower.includes("gorgeous")
  ) {
    return `Aww you just made my day! 🥰 Thank you so much, you definitely know how to charm someone! You have great energy too.`;
  }

  // Hobbies & Passions
  if (
    lower.includes("do you") ||
    lower.includes("what do you") ||
    lower.includes("hobbies") ||
    lower.includes("free time") ||
    lower.includes("passion")
  ) {
    return `When I'm not busy with work, you'll usually catch me into ${interestOne} and exploring ${interestTwo}! What about you? What's your absolute favorite passion project?`;
  }

  // Humor / Jokes
  if (
    lower.includes("haha") ||
    lower.includes("lol") ||
    lower.includes("lmao") ||
    lower.includes("funny") ||
    lower.includes("joke")
  ) {
    return `Haha I love your energy! A great sense of humor is honestly the most attractive thing. Tell me your best cheesy pickup line, let's see how good it is 😂`;
  }

  // Weekend plans
  if (lower.includes("weekend") || lower.includes("saturday") || lower.includes("sunday")) {
    return `Weekends are sacred! Usually it's sleeping in, catching some good coffee, and spontaneous plans. Got anything exciting lined up for this weekend?`;
  }

  // Default dynamic charming fallbacks
  const dynamicFallbacks = [
    `I love how easy it is to talk to you! What's something you're looking forward to this week?`,
    `Haha totally agree! So tell me, are you more of an early morning sunrise person or a late-night stargazing owl? ✨`,
    `That sounds exciting! I feel like genuine chemistry always starts with fun conversations like this ❤️`,
    `I was actually thinking about that earlier today! If you had to describe your ideal Sunday in three words, what would they be?`,
    `You have such a genuine vibe! Tell me something about you that isn't on your dating profile 😊`,
  ];

  return dynamicFallbacks[Math.floor(Math.random() * dynamicFallbacks.length)];
}

exports.getMessages = async (req, res) => {
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
      return res.status(404).json({ message: "Match not found or access denied." });
    }

    // Mark messages addressed to this user as read
    await Message.updateMany(
      { match: matchId, receiver: req.userId, read: false },
      { read: true }
    );

    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const skip = (pageNum - 1) * limitNum;

    const messages = await Message.find({ match: matchId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return res.json({
      page: pageNum,
      limit: limitNum,
      messages: messages.map((m) => ({
        id: m._id,
        _id: m._id,
        matchId,
        sender: m.sender,
        receiver: m.receiver,
        text: m.text,
        read: m.read,
        reactions: m.reactions || [],
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get messages error:", error.message);
    return res.status(500).json({ message: "Could not retrieve messages." });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { matchId } = req.params;
    const rawText = req.body.text || req.body.content;
    const text = typeof rawText === "string" ? rawText.trim() : "";

    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    if (text.length > 2000) {
      return res
        .status(400)
        .json({ message: "Message cannot exceed 2000 characters." });
    }

    if (!matchId || !mongoose.Types.ObjectId.isValid(matchId)) {
      return res.status(400).json({ message: "Invalid match ID format." });
    }

    const match = await Match.findOne({
      _id: matchId,
      users: req.userId,
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found or access denied." });
    }

    const receiverId = match.users.find(
      (uId) => uId.toString() !== req.userId.toString()
    );

    if (!receiverId) {
      return res.status(400).json({ message: "Invalid match participants." });
    }

    // Check if either user has blocked the other
    const isBlocked = await Block.findOne({
      $or: [
        { blocker: req.userId, blockedUser: receiverId },
        { blocker: receiverId, blockedUser: req.userId },
      ],
    });

    if (isBlocked) {
      return res.status(403).json({ message: "Cannot send messages to a blocked user." });
    }

    const newMessage = await Message.create({
      match: matchId,
      sender: req.userId,
      receiver: receiverId,
      text: text.trim(),
      read: false,
      reactions: [],
    });

    match.lastMessage = newMessage._id;
    match.updatedAt = new Date();
    await match.save();

    const senderUser = await User.findById(req.userId).select("name");

    await Notification.create({
      recipient: receiverId,
      sender: req.userId,
      type: "message",
      title: "New Message 💬",
      message: `${senderUser?.name || "Match"}: ${text.trim().slice(0, 50)}`,
      matchId,
    }).catch((e) => console.warn("Message notification error:", e.message));

    const messagePayload = {
      id: newMessage._id,
      _id: newMessage._id,
      matchId,
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      text: newMessage.text,
      read: newMessage.read,
      reactions: [],
      createdAt: newMessage.createdAt,
    };

    // 1. Emit live Socket.IO events to all connected clients in this match
    const io = req.app.get("io");
    if (io) {
      io.to(`match_${matchId}`).emit("new_message", messagePayload);
      io.to(`user_${receiverId}`).emit("new_notification", {
        type: "message",
        matchId,
        senderId: req.userId,
        senderName: senderUser?.name || "Match",
        text: text.trim().slice(0, 60),
      });
    }

    // 2. Check if the recipient is a demo profile. If so, simulate a lifelike real-time conversation.
    const receiver = await User.findById(receiverId);
    if (receiver && receiver.email && receiver.email.includes("@connecthearts.demo")) {
      // Step A: Mark user's message as read ("Seen ✓✓") after 400ms
      setTimeout(() => {
        if (io) {
          io.to(`match_${matchId}`).emit("messages_read", { matchId, readBy: receiverId });
        }
      }, 400);

      // Step B: Match starts typing ("... typing") after 800ms
      setTimeout(() => {
        if (io) {
          io.to(`match_${matchId}`).emit("user_typing", { matchId, userId: receiverId });
        }
      }, 800);

      // Step C: Match sends smart contextual response after 2200ms
      setTimeout(async () => {
        try {
          const smartReply = generatePersonaReply(receiver, text);

          const autoMsg = await Message.create({
            match: matchId,
            sender: receiverId,
            receiver: req.userId,
            text: smartReply,
            read: false,
            reactions: [],
          });

          await Match.findByIdAndUpdate(matchId, {
            lastMessage: autoMsg._id,
            updatedAt: new Date(),
          });

          const autoPayload = {
            id: autoMsg._id,
            _id: autoMsg._id,
            matchId,
            sender: autoMsg.sender,
            receiver: autoMsg.receiver,
            text: autoMsg.text,
            read: autoMsg.read,
            reactions: [],
            createdAt: autoMsg.createdAt,
          };

          if (io) {
            io.to(`match_${matchId}`).emit("user_stop_typing", { matchId, userId: receiverId });
            io.to(`match_${matchId}`).emit("new_message", autoPayload);
            io.to(`user_${req.userId}`).emit("new_notification", {
              type: "message",
              matchId,
              senderId: receiverId,
              senderName: receiver.name,
              text: smartReply.slice(0, 60),
            });
          }
        } catch (err) {
          console.error("Demo smart auto-reply error:", err.message);
        }
      }, 2400);
    }

    return res.status(201).json({
      message: messagePayload,
    });
  } catch (error) {
    console.error("Send message error:", error.message);
    return res.status(500).json({ message: "Failed to send message." });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message ID format." });
    }

    if (!emoji || typeof emoji !== "string" || emoji.trim().length > 10) {
      return res.status(400).json({ message: "Valid emoji string (max 10 chars) is required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Verify user is in this match
    const match = await Match.findOne({
      _id: message.match,
      users: req.userId,
    });

    if (!match) {
      return res.status(403).json({ message: "Access denied." });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === req.userId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off if same emoji clicked again
        message.reactions.splice(existingIndex, 1);
      } else {
        // Update emoji
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      message.reactions.push({ user: req.userId, emoji });
    }

    await message.save();

    // Broadcast reaction update live over Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`match_${message.match}`).emit("message_reaction_updated", {
        matchId: message.match.toString(),
        messageId: message._id.toString(),
        reactions: message.reactions,
      });
    }

    return res.json({
      success: true,
      reactions: message.reactions,
      messageId: message._id,
    });
  } catch (error) {
    console.error("Toggle reaction error:", error.message);
    return res.status(500).json({ message: "Failed to update reaction." });
  }
};
