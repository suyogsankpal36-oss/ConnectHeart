import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") || "";
  const [step, setStep] = useState(initialToken ? 2 : 1); // 1: request token, 2: reset password
  const [email, setEmail] = useState("");
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestToken(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "Reset request submitted. Check your inbox.");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to process request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", { token, newPassword });
      toast.success("Password reset successfully! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="brand">
          <span className="heart animated-heart">♥</span> ConnectHearts
        </Link>

        <p className="eyebrow">RECOVER YOUR ACCOUNT</p>
        <h1>{step === 1 ? "Forgot Password?" : "Set New Password"}</h1>
        <p className="muted">
          {step === 1
            ? "Enter your email address to receive a secure password reset token."
            : "Enter your verification token and your new password."}
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestToken}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button className="primary-btn" disabled={loading}>
              {loading ? "Generating Token..." : "Send Reset Token →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <label htmlFor="token">Reset Token</label>
            <input
              id="token"
              type="text"
              placeholder="Paste your reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />

            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button className="primary-btn" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password ✨"}
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => setStep(1)}
              style={{ width: "100%", marginTop: "0.75rem" }}
            >
              ← Back to request token
            </button>
          </form>
        )}

        <p className="auth-footer">
          Remembered your password? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
