import { createRoot } from "react-dom/client";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import "./styles.css";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import Loading from "./components/Loading";
import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberDashboard from "./pages/MemberDashboard";
import ContributorDashboard from "./pages/ContributorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Questions from "./pages/Questions";
import MyQuestions from "./pages/MyQuestions";
import MyContributions from "./pages/MyContributions";
import Profile from "./pages/Profile";


function Dashboard() {
  const { user } = useAuth();

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  if (user.role === "contributor") {
    return <ContributorDashboard />;
  }

  return <MemberDashboard />;
}


function RequireRole({ role, children }) {
  const { user } = useAuth();

  if (role === "admin" && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (role === "contributor" && user.role === "member") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}


function AuthenticatedApp() {
  const { logout } = useAuth();

  return (
    <div className="app-shell">
      <Navbar onLogout={logout} />

      <main className="app-main">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/my-questions" element={<MyQuestions />} />
          <Route
            path="/contributions"
            element={
              <RequireRole role="contributor">
                <MyContributions />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span className="footer-brand">SenseCluster</span>
          <span>Community knowledge, connected.</span>
          <span>© {new Date().getFullYear()} SenseCluster</span>
        </div>
      </footer>
    </div>
  );
}


function UnauthenticatedApp() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route
        path="/register"
        element={
          <Register
            onSwitchToLogin={() => navigate("/login")}
          />
        }
      />
      <Route
        path="*"
        element={
          <Login
            onSwitchToRegister={() => navigate("/register")}
          />
        }
      />
    </Routes>
  );
}


function AuthGate() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Loading fullPage text="Loading SenseCluster..." />
    );
  }

  return isAuthenticated ? (
    <AuthenticatedApp />
  ) : (
    <UnauthenticatedApp />
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </BrowserRouter>
  );
}


createRoot(document.getElementById("root")).render(<App />);
