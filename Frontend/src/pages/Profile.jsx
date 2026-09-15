import { useState } from "react";

import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";

import { useAuth } from "../context/AuthContext";


function getRoleDescription(role) {
  if (role === "admin") {
    return "You have full administrative access to SenseCluster.";
  }

  if (role === "contributor") {
    return "You can answer community questions and edit your own answers.";
  }

  return "You can ask questions, explore the community, and request Contributor access.";
}


export default function Profile() {
  const {
    user,
    logout,
  } = useAuth();

  const [copied, setCopied] =
    useState(false);


  async function copyUserId() {
    if (!user?.id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        user.id
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        2000
      );
    } catch {
      // Clipboard access may not be available
      // in every browser environment.
    }
  }


  return (
    <main className="dashboard-page">
      <section className="page-header">
        <div>
          <span className="eyebrow">
            Account
          </span>

          <h1>
            Your Profile
          </h1>

          <p>
            View your account information and
            current SenseCluster permissions.
          </p>
        </div>
      </section>


      <section className="profile-layout">
        <div className="profile-card profile-main">
          <div className="profile-avatar">
            {user?.email
              ?.charAt(0)
              .toUpperCase()}
          </div>

          <div className="profile-card-info">
            <span className="profile-label">
              Email address
            </span>

            <h2>
              {user?.email}
            </h2>

            <StatusBadge
              status={user?.role}
            />

            <p>
              {getRoleDescription(
                user?.role
              )}
            </p>
          </div>
        </div>


        <div className="profile-card">
          <div className="profile-card-header">
            <div>
              <span className="section-label">
                Account details
              </span>

              <h3>
                Account information
              </h3>
            </div>
          </div>


          <div className="profile-details">
            <div className="profile-detail">
              <span>
                User ID
              </span>

              <div className="id-value">
                <code>
                  {user?.id}
                </code>

                <Button
                  size="small"
                  variant="secondary"
                  onClick={copyUserId}
                >
                  {copied
                    ? "Copied"
                    : "Copy"}
                </Button>
              </div>
            </div>


            <div className="profile-detail">
              <span>
                Role
              </span>

              <StatusBadge
                status={user?.role}
              />
            </div>


            <div className="profile-detail">
              <span>
                Permissions
              </span>

              <p>
                {getRoleDescription(
                  user?.role
                )}
              </p>
            </div>
          </div>
        </div>


        <div className="profile-card danger-card">
          <div>
            <span className="section-label">
              Session
            </span>

            <h3>
              Sign out
            </h3>

            <p>
              Sign out of your current
              SenseCluster session on this device.
            </p>
          </div>

          <Button
            variant="danger"
            onClick={logout}
          >
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}