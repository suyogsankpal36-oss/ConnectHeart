/**
 * socketService.js
 * 
 * Socket.IO Real-Time Service for ConnectHearts.
 * Handles authenticated socket connections, online presence tracking,
 * instant messaging, typing indicators, read receipts, message reactions,
 * and WebRTC video/audio call signaling.
 */

const jwt = require("jsonwebtoken");
const Match = require("../models/Match");
const Message = require("../models/Message");
const Block = require("../models/Block");
const Notification = require("../models/Notification");
const User = require("../models/User");

// Active online sockets map: userId -> Set of socketIds
const onlineUsers = new Map();

/**
 * Check if a user currently has an active socket connection
 * @param {string} userId 
 * @returns {boolean}
 */
function isUserOnline(userId) {
  if (!userId) return false;
  const userSockets = onlineUsers.get(userId.toString());
  return Boolean(userSockets && userSockets.size > 0);
}

/**
 * Get array of all currently online user IDs
 * @returns {string[]}
 */
function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

/**
 * Send an event directly to a user's personal room
 * @param {import("socket.io").Server} io 
 * @param {string} userId 
 * @param {string} event 
 * @param {any} payload 
 */
function notifyUser(io, userId, event, payload) {
  if (io && userId) {
    io.to(`user_${userId}`).emit(event, payload);
  }
}

/**
 * Initialize Socket.IO with authentication middleware and event handlers
 * @param {import("socket.io").Server} io 
 */
function initSocket(io) {
  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication required."));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.userId) {
        return next(new Error("Invalid token."));
      }

      socket.userId = decoded.userId.toString();
      next();
    } catch (err) {
      return next(new Error("Unauthorized socket connection."));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal room for instant notifications and matches
    socket.join(`user_${userId}`);

    // Broadcast user online status
    socket.broadcast.emit("user_online", { userId });

    // Provide initial list of online users to the connected socket
    socket.emit("online_users_list", Array.from(onlineUsers.keys()));

    socket.on("get_online_users", () => {
      socket.emit("online_users_list", Array.from(onlineUsers.keys()));
    });

    // Join a specific match chat room
    socket.on("join_chat", async ({ matchId }) => {
      try {
        if (!matchId) return;

        const match = await Match.findOne({
          _id: matchId,
          users: userId,
        });

        if (!match) {
          return socket.emit("error", { message: "Access denied to match conversation." });
        }

        socket.join(`match_${matchId}`);
      } catch (err) {
        console.error("Socket join_chat error:", err.message);
      }
    });

    // Leave a specific match chat room
    socket.on("leave_chat", ({ matchId }) => {
      if (matchId) {
        socket.leave(`match_${matchId}`);
      }
    });

    // Send a real-time message
    socket.on("send_message", async ({ matchId, text }, callback) => {
      try {
        if (!matchId || !text || !text.trim()) return;

        if (text.trim().length > 2000) {
          if (callback) callback({ error: "Message too long (max 2000 characters)." });
          return;
        }

        const match = await Match.findOne({
          _id: matchId,
          users: userId,
        });

        if (!match) {
          if (callback) callback({ error: "Match not found or access denied." });
          return;
        }

        const receiverId = match.users
          .find((uId) => uId.toString() !== userId.toString())
          ?.toString();

        if (!receiverId) return;

        // Check if blocked
        const isBlocked = await Block.findOne({
          $or: [
            { blocker: userId, blockedUser: receiverId },
            { blocker: receiverId, blockedUser: userId },
          ],
        });

        if (isBlocked) {
          if (callback) callback({ error: "Cannot message a blocked user." });
          return;
        }

        const newMsg = await Message.create({
          match: matchId,
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
          read: false,
        });

        match.lastMessage = newMsg._id;
        match.updatedAt = new Date();
        await match.save();

        const messagePayload = {
          id: newMsg._id,
          matchId,
          sender: newMsg.sender,
          receiver: newMsg.receiver,
          text: newMsg.text,
          read: newMsg.read,
          createdAt: newMsg.createdAt,
        };

        // Deliver instantly to match room
        io.to(`match_${matchId}`).emit("new_message", messagePayload);

        // Create notification
        const senderUser = await User.findById(userId).select("name");
        await Notification.create({
          recipient: receiverId,
          sender: userId,
          type: "message",
          title: "New Message 💬",
          message: `${senderUser?.name || "Match"}: ${text.trim().slice(0, 50)}`,
          matchId,
        }).catch(() => {});

        if (callback) callback({ success: true, message: messagePayload });
      } catch (err) {
        console.error("Socket send_message error:", err.message);
        if (callback) callback({ error: "Could not deliver message." });
      }
    });

    // Typing indicators
    socket.on("typing", ({ matchId }) => {
      if (matchId) {
        socket.to(`match_${matchId}`).emit("user_typing", { matchId, userId });
      }
    });

    socket.on("stop_typing", ({ matchId }) => {
      if (matchId) {
        socket.to(`match_${matchId}`).emit("user_stop_typing", { matchId, userId });
      }
    });

    // Read receipts
    socket.on("mark_read", async ({ matchId }) => {
      try {
        if (!matchId) return;

        await Message.updateMany(
          { match: matchId, receiver: userId, read: false },
          { read: true }
        );

        socket.to(`match_${matchId}`).emit("messages_read", { matchId, readBy: userId });
      } catch (err) {
        console.error("Socket mark_read error:", err.message);
      }
    });

    // Message reaction broadcast
    socket.on("message_reaction", async ({ matchId, messageId, reactions }) => {
      try {
        if (!matchId) return;
        const match = await Match.findOne({ _id: matchId, users: userId });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("message_reaction_updated", {
          matchId,
          messageId,
          reactions,
        });
      } catch (err) {
        console.error("Socket message_reaction error:", err.message);
      }
    });

    // Video Date & Audio Call Signaling
    socket.on("start_call", async ({ matchId, callType }) => {
      try {
        if (!matchId) return;
        const match = await Match.findOne({ _id: matchId, users: userId });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("incoming_call", {
          matchId,
          callType: callType || "video",
          callerId: userId,
        });
      } catch (err) {
        console.error("Socket start_call error:", err.message);
      }
    });

    socket.on("accept_call", async ({ matchId }) => {
      try {
        if (!matchId) return;
        const match = await Match.findOne({ _id: matchId, users: userId });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("call_accepted", { matchId });
      } catch (err) {
        console.error("Socket accept_call error:", err.message);
      }
    });

    socket.on("end_call", async ({ matchId }) => {
      try {
        if (!matchId) return;
        const match = await Match.findOne({ _id: matchId, users: userId });
        if (!match) return;
        socket.to(`match_${matchId}`).emit("call_ended", { matchId });
      } catch (err) {
        console.error("Socket end_call error:", err.message);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          socket.broadcast.emit("user_offline", { userId });
        }
      }
    });
  });
}

module.exports = {
  initSocket,
  isUserOnline,
  getOnlineUserIds,
  notifyUser,
};
