import { useState } from "react";

import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";


export default function Login({
  onSwitchToRegister,
}) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(
        email.trim(),
        password
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="auth-page">

      {/* Left visual section */}
      <section className="auth-visual">

        <div className="auth-brand">
          <span className="auth-brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span className="auth-brand-name">
            SenseCluster
          </span>
        </div>


        <div className="auth-hero">
          <h1>
            Knowledge becomes
            <span> more powerful </span>
            when connected.
          </h1>

          <p>
            Ask meaningful questions, discover
            useful answers, and contribute your
            knowledge to a growing community.
          </p>
        </div>


        <div className="auth-features">

          <div className="auth-feature">
            <span className="auth-feature-icon">
              ?
            </span>

            <span>
              Ask questions and find relevant answers
            </span>
          </div>


          <div className="auth-feature">
            <span className="auth-feature-icon">
              ✦
            </span>

            <span>
              Contribute knowledge to the community
            </span>
          </div>


          <div className="auth-feature">
            <span className="auth-feature-icon">
              ◉
            </span>

            <span>
              Connect related knowledge intelligently
            </span>
          </div>

        </div>

      </section>


      {/* Right form section */}
      <section className="auth-form-side">

        <div className="auth-card">

          {/* Mobile-only brand */}
          <div className="auth-mobile-brand">
            <span className="brand-mark">
              <span className="brand-mark-dot" />
              <span className="brand-mark-dot" />
              <span className="brand-mark-dot" />
            </span>

            <span className="brand-text">
              Sense<span>Cluster</span>
            </span>
          </div>


          <div className="auth-heading">

            <h2>
              Welcome back
            </h2>

            <p>
              Sign in to continue to your
              SenseCluster workspace.
            </p>

          </div>


          {error && (
            <div className="alert alert-error mb-3">
              <span>!</span>

              <span>
                {error}
              </span>
            </div>
          )}


          <form
            onSubmit={handleSubmit}
          >

            {/* Email */}
            <div className="form-group">

              <label
                className="form-label"
                htmlFor="login-email"
              >
                Email address
              </label>

              <input
                className="form-input"
                id="login-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

            </div>


            {/* Password */}
            <div className="form-group">

              <div className="flex justify-between items-center">
                <label
                  className="form-label"
                  htmlFor="login-password"
                >
                  Password
                </label>
              </div>

              <input
                className="form-input"
                id="login-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />

            </div>


            {/* Submit */}
            <Button
              type="submit"
              loading={loading}
              size="large"
              className="app-button-full"
            >
              Sign in
            </Button>

          </form>


          {/* Register */}
          <div
            className="flex items-center justify-center gap-2"
            style={{
              marginTop: "24px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >

            <span>
              Don't have an account?
            </span>

            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={onSwitchToRegister}
              style={{
                color: "var(--primary)",
                fontWeight: 700,
              }}
            >
              Create one
            </Button>

          </div>


          <p
            className="text-center"
            style={{
              marginTop: "28px",
              color: "var(--text-muted)",
              fontSize: "11.5px",
              lineHeight: 1.5,
            }}
          >
            By continuing, you agree to use
            SenseCluster responsibly and respectfully.
          </p>

        </div>

      </section>

    </div>
  );
}