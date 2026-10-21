const mongoose = require("mongoose");
const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate("sender", "name profilePhoto")
      .sort({ createdAt: -1 })
      .limit(30);

    const formatted = notifications.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      matchId: n.matchId,
      read: n.read,
      createdAt: n.createdAt,
      sender: n.sender
        ? {
            id: n.sender._id,
            name: n.sender.name,
            profilePhoto: n.sender.profilePhoto,
          }
        : null,
    }));

    return res.json({ notifications: formatted });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    return res.status(500).json({ message: "Could not load notifications." });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification ID format." });
    }

    await Notification.findOneAndUpdate(
      { _id: id, recipient: req.userId },
      { read: true }
    );

    return res.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error.message);
    return res.status(500).json({ message: "Could not mark notification as read." });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { read: true }
    );

    return res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark all notifications error:", error.message);
    return res.status(500).json({ message: "Failed to mark all as read." });
  }
};
