import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function NotFound() {
  return (
    <div className="not-found-wrapper">
      <Navbar />
      <main className="auth-page not-found-page">
        <section className="auth-card text-center">
          <span className="not-found-heart">💔</span>
          <h1 className="not-found-title">404</h1>
          <h2>Lost Heart?</h2>
          <p className="muted">
            The page you are looking for has wandered away or no longer exists.
          </p>

          <Link to="/discover" className="primary-btn not-found-btn">
            ✨ Return to Discover
          </Link>
        </section>
      </main>
    </div>
  );
}
