import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getPhotoUrl } from "../utils/photoUrl";
import toast from "react-hot-toast";

export default function NotificationsModal({ onClose, onNotificationCountChange }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications || []);
      } catch {
        toast.error("Could not load notifications.");
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  async function handleMarkRead(id) {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      if (onNotificationCountChange) onNotificationCountChange();
    } catch {
      // silently ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
      if (onNotificationCountChange) onNotificationCountChange();
    } catch {
      toast.error("Failed to mark all as read.");
    }
  }

  function handleItemClick(n) {
    handleMarkRead(n.id);
    onClose();
    if (n.matchId) {
      navigate(`/matches?matchId=${n.matchId}`);
    } else {
      navigate("/matches");
    }
  }

  return (
    <div className="camera-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="camera-dialog notifications-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="camera-header">
          <h2>Notifications</h2>
          <div className="header-actions-group">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                className="mark-all-read-btn"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
            <button type="button" className="camera-close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="notifications-body">
          {loading ? (
            <p className="muted text-center">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="empty-notifications-state">
              <span>💌</span>
              <p>No notifications yet!</p>
              <small className="muted">
                You&apos;ll be alerted when someone matches with you or sends a message.
              </small>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map((n) => {
                const photoSrc = n.sender?.profilePhoto
                  ? getPhotoUrl(n.sender.profilePhoto)
                  : "";

                return (
                  <div
                    key={n.id}
                    className={`notification-item ${!n.read ? "unread" : ""}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="notification-avatar">
                      {photoSrc ? (
                        <img src={photoSrc} alt={n.sender?.name || "User"} />
                      ) : (
                        <span>♥</span>
                      )}
                    </div>

                    <div className="notification-text">
                      <div className="notification-top">
                        <strong>{n.title}</strong>
                        <small>
                          {new Date(n.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </small>
                      </div>
                      <p>{n.message}</p>
                    </div>

                    {!n.read && <span className="unread-dot-badge" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
