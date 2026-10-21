import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MobileNav from "../components/MobileNav";
import { useAuth } from "../context/useAuth";
import api from "../services/api";
import { getPhotoUrl } from "../utils/photoUrl";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();


  // Discovery preferences state
  const [discoveryPrefs, setDiscoveryPrefs] = useState({
    genderPreference: "all",
    minAge: 18,
    maxAge: 50,
    distance: 50,
  });
  const [savingDiscovery, setSavingDiscovery] = useState(false);

  // Notification preferences state
  const [notificationSettings, setNotificationSettings] = useState({
    newMatches: true,
    messages: true,
    likes: true,
    sounds: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Blocked users state
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);

  // Logout modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const [profileRes, blocksRes] = await Promise.all([
          api.get("/profile"),
          api.get("/blocks"),
        ]);

        const u = profileRes.data?.user;
        if (u) {
          if (u.discoveryPreferences) {
            setDiscoveryPrefs({
              genderPreference: u.discoveryPreferences.genderPreference || "all",
              minAge: u.discoveryPreferences.minAge || 18,
              maxAge: u.discoveryPreferences.maxAge || 50,
              distance: u.discoveryPreferences.distance || 50,
            });
          }
          if (u.notificationSettings) {
            setNotificationSettings({
              newMatches: u.notificationSettings.newMatches ?? true,
              messages: u.notificationSettings.messages ?? true,
              likes: u.notificationSettings.likes ?? true,
              sounds: u.notificationSettings.sounds ?? true,
            });
          }
        }
        setBlockedUsers(blocksRes.data?.blockedUsers || []);
      } catch {
        toast.error("Could not load some settings.");
      } finally {
        setLoadingBlocks(false);
      }
    }
    loadSettingsData();
  }, []);

  // Handlers for discovery preferences
  function handleDiscoveryChange(e) {
    const { name, value } = e.target;
    setDiscoveryPrefs((prev) => ({
      ...prev,
      [name]: name === "genderPreference" ? value : Number(value),
    }));
  }

  async function handleSaveDiscovery(e) {
    e.preventDefault();
    if (Number(discoveryPrefs.minAge) > Number(discoveryPrefs.maxAge)) {
      toast.error("Minimum age cannot exceed maximum age.");
      return;
    }

    setSavingDiscovery(true);
    try {
      const res = await api.put("/profile", {
        discoveryPreferences: discoveryPrefs,
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success("Discovery preferences updated! ✨");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update discovery preferences."
      );
    } finally {
      setSavingDiscovery(false);
    }
  }

  // Handlers for notification preferences
  function handleNotifToggle(key) {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleSaveNotifications(e) {
    e.preventDefault();
    setSavingNotifs(true);
    try {
      const res = await api.put("/profile", {
        notificationSettings,
      });
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      toast.success("Notification preferences saved! 🔔");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update notifications."
      );
    } finally {
      setSavingNotifs(false);
    }
  }

  // Handlers for password change
  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success("Password changed successfully! ✨");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  // Handler for unblocking
  async function handleUnblock(userId, userName) {
    try {
      await api.delete(`/blocks/${userId}`);
      toast.success(`Unblocked ${userName}.`);
      setBlockedUsers((prev) => prev.filter((b) => b.id !== userId));
    } catch {
      toast.error("Could not unblock user.");
    }
  }

  // Handler for logout
  async function handleConfirmLogout() {
    setLogoutLoading(true);
    try {
      logout();
      toast.success("Logged out safely. See you soon! ❤️");
      navigate("/login");
    } catch {
      toast.error("Failed to log out.");
    } finally {
      setLogoutLoading(false);
      setShowLogoutModal(false);
    }
  }

  // Handler for account deletion
  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (!deletePassword) {
      toast.error("Please enter your password to confirm account deletion.");
      return;
    }
    setDeleting(true);

    try {
      await api.delete("/auth/delete-account", {
        data: { confirmationPassword: deletePassword, password: deletePassword },
      });

      toast.success("Account deleted. We hope to see you again.");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Account deletion failed. Please verify your password.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="settings-page-wrapper">
      <Navbar />

      <main className="settings-container">
        <div className="settings-header">
          <span className="eyebrow">ACCOUNT & PREFERENCES</span>
          <h1>Settings & Safety</h1>
          <p className="muted">
            Customize your dating preferences, privacy controls, alerts, and security settings.
          </p>
        </div>

        <div className="settings-cards-stack">
          {/* 1. Edit Profile Overview Card */}
          <section className="settings-card settings-profile-banner">
            <div className="settings-profile-row">
              <div className="settings-profile-avatar">
                {user?.profilePhoto ? (
                  <img
                    src={getPhotoUrl(user.profilePhoto)}
                    alt={user.name || "User"}
                  />
                ) : (
                  <span>♥</span>
                )}
              </div>
              <div className="settings-profile-info">
                <div className="settings-profile-name-row">
                  <h2>
                    {user?.name || "Your Name"}
                    {user?.age ? `, ${user.age}` : ""}
                  </h2>
                  {user?.isVerified && (
                    <span className="verified-badge-mini" title="Verified Profile">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="muted">
                  {user?.city ? `📍 ${user.city}` : "Location not set"} •{" "}
                  {user?.lookingFor
                    ? user.lookingFor.charAt(0).toUpperCase() + user.lookingFor.slice(1)
                    : "Looking for love"}
                </p>
              </div>
              <Link to="/profile" className="primary-btn edit-profile-cta-btn">
                <span>✏️</span> Edit Profile Studio
              </Link>
            </div>
          </section>

          {/* 2. Discovery Preferences Card */}
          <section className="settings-card">
            <div className="card-heading-row">
              <span className="card-icon">🎯</span>
              <div>
                <h2>Discovery Preferences</h2>
                <p className="muted">
                  Control who appears in your Discover deck based on gender, age, and location.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveDiscovery} className="discovery-prefs-form">
              <div className="form-group-block">
                <label htmlFor="genderPreference">Show Me</label>
                <select
                  id="genderPreference"
                  name="genderPreference"
                  value={discoveryPrefs.genderPreference}
                  onChange={handleDiscoveryChange}
                >
                  <option value="all">Everyone</option>
                  <option value="female">Women</option>
                  <option value="male">Men</option>
                  <option value="non-binary">Non-binary</option>
                </select>
              </div>

              <div className="form-row-duo">
                <div className="form-group-block">
                  <label htmlFor="minAge">
                    Minimum Age: <strong>{discoveryPrefs.minAge}</strong>
                  </label>
                  <input
                    id="minAge"
                    name="minAge"
                    type="range"
                    min="18"
                    max="100"
                    value={discoveryPrefs.minAge}
                    onChange={handleDiscoveryChange}
                    className="romantic-range-input"
                  />
                </div>

                <div className="form-group-block">
                  <label htmlFor="maxAge">
                    Maximum Age: <strong>{discoveryPrefs.maxAge}</strong>
                  </label>
                  <input
                    id="maxAge"
                    name="maxAge"
                    type="range"
                    min="18"
                    max="100"
                    value={discoveryPrefs.maxAge}
                    onChange={handleDiscoveryChange}
                    className="romantic-range-input"
                  />
                </div>
              </div>

              <div className="form-group-block">
                <label htmlFor="distance">
                  Maximum Distance: <strong>{discoveryPrefs.distance} km</strong>
                </label>
                <input
                  id="distance"
                  name="distance"
                  type="range"
                  min="5"
                  max="250"
                  step="5"
                  value={discoveryPrefs.distance}
                  onChange={handleDiscoveryChange}
                  className="romantic-range-input"
                />
              </div>

              <button
                type="submit"
                className="primary-btn save-prefs-btn"
                disabled={savingDiscovery}
              >
                {savingDiscovery ? "Saving Preferences..." : "Save Discovery Preferences ✨"}
              </button>
            </form>
          </section>

          {/* 3. Notification Preferences Card */}
          <section className="settings-card">
            <div className="card-heading-row">
              <span className="card-icon">🔔</span>
              <div>
                <h2>Notification Preferences</h2>
                <p className="muted">
                  Choose how and when ConnectHearts updates you on activity.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveNotifications} className="notif-prefs-form">
              <div className="settings-toggles-list">
                <label className="settings-toggle-row">
                  <div className="toggle-label-content">
                    <strong>New Mutual Matches 💖</strong>
                    <p className="muted">Receive an instant alert when someone you liked likes you back.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="romantic-checkbox-toggle"
                    checked={notificationSettings.newMatches}
                    onChange={() => handleNotifToggle("newMatches")}
                  />
                </label>

                <label className="settings-toggle-row">
                  <div className="toggle-label-content">
                    <strong>Direct Messages 💬</strong>
                    <p className="muted">Get notified whenever your matches send you real-time messages.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="romantic-checkbox-toggle"
                    checked={notificationSettings.messages}
                    onChange={() => handleNotifToggle("messages")}
                  />
                </label>

                <label className="settings-toggle-row">
                  <div className="toggle-label-content">
                    <strong>Likes & Admirers ⭐</strong>
                    <p className="muted">Notifications when other members like or super-like your profile.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="romantic-checkbox-toggle"
                    checked={notificationSettings.likes}
                    onChange={() => handleNotifToggle("likes")}
                  />
                </label>

                <label className="settings-toggle-row">
                  <div className="toggle-label-content">
                    <strong>In-App Sound Chimes 🎶</strong>
                    <p className="muted">Play subtle romantic sound effects on chat messages and matches.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="romantic-checkbox-toggle"
                    checked={notificationSettings.sounds}
                    onChange={() => handleNotifToggle("sounds")}
                  />
                </label>
              </div>

              <button
                type="submit"
                className="primary-btn save-prefs-btn"
                disabled={savingNotifs}
              >
                {savingNotifs ? "Saving Notifications..." : "Save Notification Settings 🔔"}
              </button>
            </form>
          </section>

          {/* 4. Change Password Card */}
          <section className="settings-card">
            <div className="card-heading-row">
              <span className="card-icon">🔒</span>
              <div>
                <h2>Change Password</h2>
                <p className="muted">Keep your account secure with a strong password.</p>
              </div>
            </div>

            <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
              💡 If you signed up using Google Sign-In, password settings are managed through your Google Account.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />

              <div className="form-row-duo">
                <div>
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="At least 8 characters"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repeat new password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="primary-btn password-save-btn"
                disabled={changingPassword}
              >
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </section>

          {/* 5. Safety & Blocked Users Card */}
          <section className="settings-card">
            <div className="card-heading-row">
              <span className="card-icon">🛡️</span>
              <div>
                <h2>Blocked Users</h2>
                <p className="muted">
                  Blocked users cannot see your profile, swipe on you, or send you messages.
                </p>
              </div>
            </div>

            {loadingBlocks ? (
              <p className="muted">Loading blocked users...</p>
            ) : blockedUsers.length === 0 ? (
              <div className="empty-blocks-state">
                <span>✨</span>
                <p>You have not blocked anyone.</p>
              </div>
            ) : (
              <div className="blocked-list">
                {blockedUsers.map((b) => (
                  <div key={b.id} className="blocked-item">
                    <div className="blocked-avatar">
                      {b.profilePhoto ? (
                        <img src={getPhotoUrl(b.profilePhoto)} alt={b.name} />
                      ) : (
                        <span>♥</span>
                      )}
                    </div>
                    <div className="blocked-info">
                      <strong>
                        {b.name}, {b.age}
                      </strong>
                      <small className="muted">{b.city || "Nearby"}</small>
                    </div>
                    <button
                      type="button"
                      className="unblock-action-btn"
                      onClick={() => handleUnblock(b.id, b.name)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 6. Account Session & Logout Card */}
          <section className="settings-card session-card">
            <div className="card-heading-row">
              <span className="card-icon">🚪</span>
              <div>
                <h2>Account Session</h2>
                <p className="muted">
                  Currently signed in as <strong>{user?.email || "Signed in"}</strong>.
                </p>
              </div>
            </div>

            <div className="session-action-row">
              <p className="session-status-text">
                Active Session: Socket connected & verified. Ready to step away?
              </p>
              <button
                type="button"
                className="logout-action-btn"
                onClick={() => setShowLogoutModal(true)}
              >
                Log Out of ConnectHearts
              </button>
            </div>
          </section>

          {/* 7. Danger Zone (Account Deletion) */}
          <section className="settings-card danger-zone-card">
            <div className="card-heading-row">
              <span className="card-icon">⚠️</span>
              <div>
                <h2 className="danger-heading">Danger Zone</h2>
                <p className="muted">
                  Permanently delete your ConnectHearts account, photos, matches,
                  and message history. This action cannot be reversed.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="delete-account-trigger-btn"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete My Account
            </button>
          </section>
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="camera-overlay" role="dialog" aria-modal="true">
          <div className="camera-dialog logout-dialog">
            <div className="camera-header">
              <h2>Confirm Log Out</h2>
              <button
                type="button"
                className="camera-close"
                onClick={() => setShowLogoutModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="logout-confirm-text">
              Are you sure you want to log out, <strong>{user?.name}</strong>? You
              can always log back in anytime with your email and password.
            </p>

            <div className="camera-actions">
              <button
                type="button"
                className="camera-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-btn logout-confirm-submit-btn"
                disabled={logoutLoading}
                onClick={handleConfirmLogout}
              >
                {logoutLoading ? "Logging out..." : "Yes, Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="camera-overlay" role="dialog" aria-modal="true">
          <div className="camera-dialog delete-confirm-dialog">
            <div className="camera-header">
              <h2>Confirm Account Deletion</h2>
              <button
                type="button"
                className="camera-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="danger-warning-text">
              Are you sure, <strong>{user?.name}</strong>? All your matches, chats,
              photos, and profile data will be permanently wiped from the
              database immediately.
            </p>

            <form onSubmit={handleDeleteAccount}>
              <label htmlFor="deletePassword">
                Enter your password to confirm:
              </label>
              <input
                id="deletePassword"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                required
              />

              <div className="camera-actions">
                <button
                  type="button"
                  className="camera-cancel-btn"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="confirm-delete-btn"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}
