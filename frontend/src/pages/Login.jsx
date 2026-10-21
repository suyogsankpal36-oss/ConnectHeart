
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { signInWithGooglePopup } from "../services/firebase";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/discover", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await api.post("/auth/login", form);
      const data = response.data;

      if (!data.token) {
        toast.error("The backend did not return a login token.");
        return;
      }

      login(data.token, data.user);
      toast.success("Welcome back!");
      navigate("/discover");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const googleRes = await signInWithGooglePopup();
      if (!googleRes.user || !googleRes.user.email) {
        toast.error("Could not retrieve Google account details.");
        return;
      }

      const response = await api.post("/auth/google", {
        email: googleRes.user.email,
        name: googleRes.user.displayName,
        photoURL: googleRes.user.photoURL,
        uid: googleRes.user.uid,
        idToken: googleRes.idToken,
      });

      const data = response.data;
      if (!data.token) {
        toast.error("The backend did not return a login token.");
        return;
      }

      login(data.token, data.user);
      toast.success(`Welcome, ${data.user.name || "back"}! ❤️`);
      navigate("/discover");
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Google sign-in could not be completed."
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="brand">
          <span className="heart">♥</span> ConnectHearts
        </Link>

        <p className="eyebrow">LOVE STARTS WITH A HELLO</p>
        <h1>Welcome back.</h1>
        <p className="muted">
          Sign in and continue your journey to meaningful connections.
        </p>

        {/* 1. One-Click Google Authentication */}
        <button
          type="button"
          className="google-auth-btn"
          onClick={handleGoogleSignIn}
          disabled={loading || googleLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {googleLoading ? "Connecting with Google..." : "Continue with Google"}
        </button>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        {/* 2. Standard Credentials Form */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />

          <div className="label-with-action">
            <label htmlFor="password">Password</label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />

          <button className="primary-btn" disabled={loading || googleLoading}>
            {loading ? "Signing in..." : "Log in →"}
          </button>
        </form>

        <p className="auth-footer">
          New to ConnectHearts? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
