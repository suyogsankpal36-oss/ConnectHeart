import { NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function MobileNav() {
  const { stats, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="mobile-bottom-nav">
      <NavLink
        to="/discover"
        className={({ isActive }) =>
          isActive ? "mob-nav-item active" : "mob-nav-item"
        }
      >
        <span className="mob-nav-icon">✨</span>
        <span className="mob-nav-label">Discover</span>
      </NavLink>

      <NavLink
        to="/matches"
        className={({ isActive }) =>
          isActive ? "mob-nav-item active" : "mob-nav-item"
        }
      >
        <span className="mob-nav-icon">
          💬
          {stats.matchesCount > 0 && (
            <span className="mob-badge">{stats.matchesCount}</span>
          )}
        </span>
        <span className="mob-nav-label">Matches</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          isActive ? "mob-nav-item active" : "mob-nav-item"
        }
      >
        <span className="mob-nav-icon">👤</span>
        <span className="mob-nav-label">Profile</span>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          isActive ? "mob-nav-item active" : "mob-nav-item"
        }
      >
        <span className="mob-nav-icon">⚙️</span>
        <span className="mob-nav-label">Settings</span>
      </NavLink>
    </nav>
  );
}
