import { useState } from "react";

import Button from "../components/Button";
import { useAuth } from "../context/AuthContext";


export default function Register({
  onSwitchToLogin,
}) {
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const trimmedEmail = email.trim();


    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }


    if (password.length < 12) {
      setError(
        "Password must be at least 12 characters long."
      );
      return;
    }


    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }


    setLoading(true);

    try {
      await register(
        trimmedEmail,
        password
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to create your account. Please try again."
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
            Ask.
            <span> Learn. </span>
            Contribute.
          </h1>

          <p>
            Join a community where questions
            become conversations and knowledge
            becomes something everyone can build on.
          </p>
        </div>


        <div className="auth-features">

          <div className="auth-feature">
            <span className="auth-feature-icon">
              ?
            </span>

            <span>
              Ask questions and discover answers
            </span>
          </div>


          <div className="auth-feature">
            <span className="auth-feature-icon">
              ◉
            </span>

            <span>
              Explore connected community knowledge
            </span>
          </div>


          <div className="auth-feature">
            <span className="auth-feature-icon">
              ✦
            </span>

            <span>
              Become a Contributor and share what you know
            </span>
          </div>

        </div>

      </section>


      {/* Registration form */}
      <section className="auth-form-side">

        <div className="auth-card">

          {/* Mobile brand */}
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
              Create your account
            </h2>

            <p>
              Join SenseCluster and start
              exploring the community.
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


          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="form-group">

              <label
                className="form-label"
                htmlFor="register-email"
              >
                Email address
              </label>

              <input
                className="form-input"
                id="register-email"
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

              <label
                className="form-label"
                htmlFor="register-password"
              >
                Password
              </label>

              <input
                className="form-input"
                id="register-password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={12}
                required
              />

              <div className="form-hint">
                Use at least 12 characters.
              </div>

            </div>


            {/* Confirm password */}
            <div className="form-group">

              <label
                className="form-label"
                htmlFor="register-confirm-password"
              >
                Confirm password
              </label>

              <input
                className="form-input"
                id="register-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password again"
                autoComplete="new-password"
                minLength={12}
                required
              />

            </div>


            {/* Role information */}
            <div className="alert alert-info mb-3">
              <span>i</span>

              <span>
                New accounts start as <strong>Member</strong>.
                You can request Contributor access later
                from your dashboard.
              </span>
            </div>


            <Button
              type="submit"
              loading={loading}
              size="large"
              className="app-button-full"
            >
              Create account
            </Button>

          </form>


          {/* Login switch */}
          <div
            className="flex items-center justify-center gap-2"
            style={{
              marginTop: "24px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >

            <span>
              Already have an account?
            </span>

            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={onSwitchToLogin}
              style={{
                color: "var(--primary)",
                fontWeight: 700,
              }}
            >
              Sign in
            </Button>

          </div>


          <p
            className="text-center"
            style={{
              marginTop: "26px",
              color: "var(--text-muted)",
              fontSize: "11.5px",
              lineHeight: 1.5,
            }}
          >
            Your account will be created with
            Member access by default.
          </p>

        </div>

      </section>

    </div>
  );
}