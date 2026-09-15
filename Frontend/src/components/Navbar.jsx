import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function Navbar({ onLogout }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";
  const isContributor = user?.role === "contributor" || isAdmin;

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link className="navbar-brand" to="/dashboard">
          <span className="brand-mark">
            <span className="brand-mark-dot" />
            <span className="brand-mark-dot" />
            <span className="brand-mark-dot" />
          </span>

          <span className="brand-text">
            Sense<span>Cluster</span>
          </span>
        </Link>

        {/* Main Navigation */}
        <nav className="navbar-nav">
          <Link
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
            to="/dashboard"
          >
            <span className="nav-icon">⌂</span>
            Dashboard
          </Link>

          <Link
            className={`nav-link ${isActive("/questions") ? "active" : ""}`}
            to="/questions"
          >
            <span className="nav-icon">?</span>
            Questions
          </Link>

          <Link
            className={`nav-link ${
              isActive("/my-questions") ? "active" : ""
            }`}
            to="/my-questions"
          >
            <span className="nav-icon">▤</span>
            My Questions
          </Link>

          {isContributor && (
            <Link
              className={`nav-link ${
                isActive("/contributions") ? "active" : ""
              }`}
              to="/contributions"
            >
              <span className="nav-icon">✦</span>
              Contributions
            </Link>
          )}

          {isAdmin && (
            <Link
              className={`nav-link ${isActive("/admin") ? "active" : ""}`}
              to="/admin"
            >
              <span className="nav-icon">⚙</span>
              Admin
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="navbar-actions">
          <button
            type="button"
            className={`profile-trigger ${
              isActive("/profile") ? "profile-trigger-active" : ""
            }`}
            onClick={() => navigate("/profile")}
          >
            <span className="avatar">
              {user?.email?.charAt(0)?.toUpperCase() || "U"}
            </span>

            <span className="profile-info">
              <span className="profile-email">{user?.email}</span>
              <span className="profile-role">
                {user?.role || "member"}
              </span>
            </span>

            <span className="profile-chevron">⌄</span>
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
            title="Sign out"
          >
            <span>↪</span>
          </button>
        </div>
      </div>
    </header>
  );
}
