import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { getPhotoUrl } from "../utils/photoUrl";
import NotificationsModal from "./NotificationsModal";
import toast from "react-hot-toast";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, stats } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  function handleLogout() {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  }

  const avatarSrc = user?.profilePhoto ? getPhotoUrl(user.profilePhoto) : "";
  const isAuth = Boolean(user && (user.id || user._id));

  return (
    <>
      <header className="main-navbar" role="banner">
        <div className="navbar-container">
          <Link to={isAuth ? "/discover" : "/"} className="brand" aria-label="ConnectHearts Home">
            <span className="heart animated-heart">♥</span>
            <span className="brand-text">ConnectHearts</span>
          </Link>

          {isAuth ? (
            <>
              <nav className="nav-links" aria-label="Main Navigation">
                <NavLink
                  to="/discover"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <span className="nav-icon">✨</span>
                  <span className="nav-text">Discover</span>
                </NavLink>

                <NavLink
                  to="/matches"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <span className="nav-icon">💬</span>
                  <span className="nav-text">Matches</span>
                  {stats?.matchesCount > 0 && (
                    <span className="badge-pill">{stats.matchesCount}</span>
                  )}
                </NavLink>

                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <span className="nav-icon">👤</span>
                  <span className="nav-text">Profile</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    isActive ? "nav-link active" : "nav-link"
                  }
                >
                  <span className="nav-icon">⚙️</span>
                  <span className="nav-text">Settings</span>
                </NavLink>
              </nav>

              <div className="navbar-actions">
                {/* Notification Bell */}
                <button
                  type="button"
                  className="notif-bell-btn"
                  onClick={() => setShowNotifications(true)}
                  title="Notifications"
                  aria-label="View notifications"
                >
                  <span>🔔</span>
                  {stats?.unreadNotificationsCount > 0 && (
                    <span className="notif-badge-pill">
                      {stats.unreadNotificationsCount}
                    </span>
                  )}
                </button>

                <Link to="/profile" className="user-profile-badge" aria-label="Your Profile">
                  <div className="avatar-mini">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user?.name || "User"} />
                    ) : (
                      <span>{user?.name ? user.name[0].toUpperCase() : "♥"}</span>
                    )}
                  </div>
                  <span className="user-first-name">{user?.name ? user.name.split(" ")[0] : "Profile"}</span>
                </Link>

                <button
                  type="button"
                  className="logout-nav-btn"
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                >
                  Log out
                </button>
              </div>
            </>
          ) : (
            <div className="landing-auth-links">
              <Link to="/login" className="login-link">
                Sign In
              </Link>
              <Link to="/register" className="primary-btn landing-cta-small">
                Join Free →
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Notifications Modal */}
      {showNotifications && (
        <NotificationsModal
          onClose={() => setShowNotifications(false)}
          onNotificationCountChange={refreshUser}
        />
      )}
    </>
  );
}
