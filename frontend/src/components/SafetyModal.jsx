import { useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const REPORT_REASONS = [
  { value: "harassment", label: "Harassment or offensive behavior" },
  { value: "inappropriate_photos", label: "Inappropriate or nude photos" },
  { value: "fake_profile", label: "Fake profile or impersonation" },
  { value: "spam_or_scam", label: "Spam or scamming" },
  { value: "underage", label: "User appears under 18 years old" },
  { value: "other", label: "Other reason" },
];

export default function SafetyModal({ targetUser, onClose, onBlocked }) {
  const [activeTab, setActiveTab] = useState("report"); // "report" | "block"
  const [reason, setReason] = useState("harassment");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!targetUser) return null;

  async function handleReport(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/reports", {
        reportedUserId: targetUser.id,
        reason,
        details,
      });

      toast.success("Thank you. Safety report submitted.");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBlock() {
    setSubmitting(true);

    try {
      await api.post(`/blocks/${targetUser.id}`);
      toast.success(`${targetUser.name} has been blocked.`);
      if (onBlocked) onBlocked(targetUser.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not block user.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="camera-overlay" role="dialog" aria-modal="true">
      <div className="camera-dialog safety-modal-card">
        <div className="camera-header">
          <h2>Safety & Moderation</h2>
          <button type="button" className="camera-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="safety-tabs">
          <button
            type="button"
            className={`safety-tab ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            🚨 Report User
          </button>
          <button
            type="button"
            className={`safety-tab ${activeTab === "block" ? "active" : ""}`}
            onClick={() => setActiveTab("block")}
          >
            🚫 Block User
          </button>
        </div>

        {activeTab === "report" ? (
          <form onSubmit={handleReport} className="safety-form">
            <p className="muted">
              Reporting <strong>{targetUser.name}</strong> will alert our
              moderation team. Your report remains anonymous to this user.
            </p>

            <label htmlFor="report-reason">Select a reason</label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label htmlFor="report-details">Additional details (optional)</label>
            <textarea
              id="report-details"
              rows={3}
              placeholder="Describe what occurred..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
            />

            <div className="camera-actions">
              <button
                type="button"
                className="camera-cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="camera-capture-btn report-submit-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        ) : (
          <div className="safety-block-view">
            <p className="danger-warning-text">
              Blocking <strong>{targetUser.name}</strong> will remove them from
              your matches and chat, and they will never appear in your Discover
              deck again.
            </p>

            <div className="camera-actions">
              <button
                type="button"
                className="camera-cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={handleBlock}
                disabled={submitting}
              >
                {submitting ? "Blocking..." : `Block ${targetUser.name}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
