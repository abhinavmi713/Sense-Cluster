import { useEffect, useState } from "react";

import Button from "../components/Button";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";

import {
  getContributorRequests,
  getUsers,
  reviewContributorRequest,
  updateUserRole,
} from "../api";

import { useAuth } from "../context/AuthContext";


export default function AdminDashboard() {
  const { token, user } = useAuth();

  const [users, setUsers] =
    useState([]);

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedRequest, setSelectedRequest] =
    useState(null);

  const [reviewLoading, setReviewLoading] =
    useState(false);

  const [roleLoading, setRoleLoading] =
    useState(null);


  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const [
        usersResult,
        requestsResult,
      ] = await Promise.all([
        getUsers(token),
        getContributorRequests(token),
      ]);

      setUsers(usersResult || []);
      setRequests(requestsResult || []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load admin data."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadAdminData();
  }, [token]);


  async function handleReview(status) {
    if (!selectedRequest) {
      return;
    }

    setReviewLoading(true);
    setError("");
    setSuccess("");

    try {
      const updated =
        await reviewContributorRequest(
          token,
          selectedRequest.id,
          status
        );

      setRequests((current) =>
        current.map((request) =>
          request.id === updated.id
            ? updated
            : request
        )
      );

      if (status === "approved") {
        setUsers((current) =>
          current.map((existingUser) =>
            existingUser.id ===
            selectedRequest.user_id
              ? {
                  ...existingUser,
                  role: "contributor",
                }
              : existingUser
          )
        );
      }

      setSelectedRequest(null);

      setSuccess(
        status === "approved"
          ? "Contributor request approved."
          : "Contributor request rejected."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to review this request."
      );
    } finally {
      setReviewLoading(false);
    }
  }


  async function handleRoleChange(
    userId,
    role
  ) {
    setRoleLoading(userId);
    setError("");
    setSuccess("");

    try {
      const updated =
        await updateUserRole(
          token,
          userId,
          role
        );

      setUsers((current) =>
        current.map((existingUser) =>
          existingUser.id === updated.id
            ? updated
            : existingUser
        )
      );

      setSuccess(
        "User role updated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update user role."
      );
    } finally {
      setRoleLoading(null);
    }
  }


  const pendingRequests =
    requests.filter(
      (request) =>
        request.status === "pending"
    );

  const memberCount =
    users.filter(
      (existingUser) =>
        existingUser.role === "member"
    ).length;

  const contributorCount =
    users.filter(
      (existingUser) =>
        existingUser.role === "contributor"
    ).length;

  const adminCount =
    users.filter(
      (existingUser) =>
        existingUser.role === "admin"
    ).length;


  return (
    <main className="dashboard-page admin-page">
      <section className="admin-header">
        <div>
          <span className="eyebrow">
            Administration
          </span>

          <h1>
            Community control center
          </h1>

          <p>
            Manage members, review Contributor
            requests, and maintain the community.
          </p>
        </div>

        <div className="admin-identity">
          <span>
            Signed in as
          </span>

          <strong>
            {user?.email}
          </strong>
        </div>
      </section>


      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}


      <section className="stats-grid admin-stats">
        <div className="stat-card">
          <div className="stat-icon">
            👥
          </div>

          <div>
            <span>
              Total users
            </span>

            <strong>
              {users.length}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            •
          </div>

          <div>
            <span>
              Members
            </span>

            <strong>
              {memberCount}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>
              Contributors
            </span>

            <strong>
              {contributorCount}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            ★
          </div>

          <div>
            <span>
              Admins
            </span>

            <strong>
              {adminCount}
            </strong>
          </div>
        </div>
      </section>


      <section className="admin-section">
        <div className="section-heading">
          <div>
            <span className="section-label">
              Access management
            </span>

            <h2>
              Contributor requests
            </h2>
          </div>

          <span className="request-count">
            {pendingRequests.length} pending
          </span>
        </div>


        {loading ? (
          <div className="admin-loading">
            Loading requests...
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="empty-state empty-state-compact">
            <div className="empty-icon">
              ✓
            </div>

            <h3>
              No pending requests
            </h3>

            <p>
              All Contributor requests have
              been reviewed.
            </p>
          </div>
        ) : (
          <div className="request-list">
            {pendingRequests.map(
              (request) => (
                <div
                  className="request-card"
                  key={request.id}
                >
                  <div className="request-user">
                    <div className="avatar">
                      {request.user_email
                        ?.charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {request.user_email}
                      </strong>

                      <span>
                        Requested Contributor
                        access
                      </span>
                    </div>
                  </div>


                  <div className="request-reason">
                    {request.reason ? (
                      <>
                        <span>
                          Reason
                        </span>

                        <p>
                          {request.reason}
                        </p>
                      </>
                    ) : (
                      <p className="muted">
                        No reason provided.
                      </p>
                    )}
                  </div>


                  <div className="request-actions">
                    <Button
                      size="small"
                      onClick={() =>
                        setSelectedRequest(
                          request
                        )
                      }
                    >
                      Review
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>


      <section className="admin-section">
        <div className="section-heading">
          <div>
            <span className="section-label">
              User management
            </span>

            <h2>
              Community members
            </h2>
          </div>
        </div>


        {loading ? (
          <div className="admin-loading">
            Loading users...
          </div>
        ) : (
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>
                    User
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Joined
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map(
                  (existingUser) => (
                    <tr
                      key={
                        existingUser.id
                      }
                    >
                      <td>
                        <div className="table-user">
                          <div className="avatar small">
                            {existingUser.email
                              ?.charAt(0)
                              .toUpperCase()}
                          </div>

                          <span>
                            {
                              existingUser.email
                            }
                          </span>
                        </div>
                      </td>


                      <td>
                        <StatusBadge
                          status={
                            existingUser.role
                          }
                        />
                      </td>


                      <td>
                        {new Date(
                          existingUser.created_at
                        ).toLocaleDateString(
                          undefined,
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </td>


                      <td>
                        {existingUser.id ===
                        user?.id ? (
                          <span className="current-user-label">
                            You
                          </span>
                        ) : (
                          <select
                            className="role-select"
                            value={
                              existingUser.role
                            }
                            disabled={
                              roleLoading ===
                              existingUser.id
                            }
                            onChange={(
                              event
                            ) =>
                              handleRoleChange(
                                existingUser.id,
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="member">
                              Member
                            </option>

                            <option value="contributor">
                              Contributor
                            </option>

                            <option value="admin">
                              Admin
                            </option>
                          </select>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>


      <Modal
        open={Boolean(selectedRequest)}
        onClose={() => {
          if (!reviewLoading) {
            setSelectedRequest(null);
          }
        }}
        title="Review Contributor Request"
        size="medium"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                setSelectedRequest(null)
              }
              disabled={reviewLoading}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={() =>
                handleReview("rejected")
              }
              loading={
                reviewLoading
              }
            >
              Reject
            </Button>

            <Button
              onClick={() =>
                handleReview("approved")
              }
              loading={
                reviewLoading
              }
            >
              Approve
            </Button>
          </>
        }
      >
        {selectedRequest && (
          <div className="review-content">
            <div className="review-user">
              <div className="avatar">
                {selectedRequest.user_email
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>
                  {
                    selectedRequest.user_email
                  }
                </strong>

                <span>
                  Requesting Contributor
                  access
                </span>
              </div>
            </div>


            <div className="review-reason">
              <span>
                Why they want to contribute
              </span>

              <div>
                {selectedRequest.reason ||
                  "No reason was provided."}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}