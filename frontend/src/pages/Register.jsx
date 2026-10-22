
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/useAuth";
import { signInWithGooglePopup } from "../services/firebase";

export default function Register() {
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
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
  });

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        ...form,
        age: Number(form.age),
      });

      const data = response.data;

      if (data.token) {
        login(data.token, data.user);
        toast.success("Welcome to ConnectHearts! Let's set up your profile ✨");
        navigate("/profile");
      } else {
        toast.success("Account created. Please log in.");
        navigate("/login");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Registration failed. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
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
        toast.error("The backend did not return a session token.");
        return;
      }

      login(data.token, data.user);
      toast.success(`Welcome to ConnectHearts, ${data.user.name || "Explorer"}! ✨`);
      navigate("/profile");
    } catch (error) {
      if (
        error.code !== "auth/popup-closed-by-user" &&
        error.code !== "auth/cancelled-popup-request"
      ) {
        toast.error(
          error.response?.data?.message ||
          error.message ||
          "Google sign-up could not be completed."
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

        <p className="eyebrow">YOUR STORY STARTS HERE</p>
        <h1>Find your connection.</h1>
        <p className="muted">
          Create an account and start meeting people who share your interests.
        </p>

        {/* 1. One-Click Google Registration */}
        <button
          type="button"
          className="google-auth-btn"
          onClick={handleGoogleSignUp}
          disabled={loading || googleLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          {googleLoading ? "Connecting with Google..." : "Sign up with Google"}
        </button>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        {/* 2. Standard Registration Form */}
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            name="name"
            placeholder="Your full name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
          />

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

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            minLength={8}
            required
          />

          
        <label htmlFor="age">Your age</label>
        <input
          id="age"
          name="age"
          type="number"
          min="18"
          max="120"
          placeholder="Enter your age"
          value={form.age}
          onChange={handleChange}
          required
        />

         <label htmlFor="gender">Gender</label>
         <select
          id="gender"
           name="gender"
          value={form.gender}
          onChange={handleChange}
          required
         >
           <option value="">Select your gender</option>
           <option value="male">Male</option>
           <option value="female">Female</option>
           <option value="other">Other</option>
         </select>


          <button className="primary-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account →"}
          </button>

          <p style={{ fontSize: "12px", color: "var(--color-text-muted, #A5A5B5)", textAlign: "center", marginTop: "12px", lineHeight: "1.5" }}>
            By registering, you confirm you are 18+ and agree to our{" "}
            <Link to="/terms" style={{ color: "var(--color-primary, #FF477E)", textDecoration: "underline" }}>Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" style={{ color: "var(--color-primary, #FF477E)", textDecoration: "underline" }}>Privacy Policy</Link>.
          </p>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
