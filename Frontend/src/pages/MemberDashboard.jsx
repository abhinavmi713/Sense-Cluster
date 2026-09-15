import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import Modal from "../components/Modal";
import QuestionList from "../components/QuestionList";
import StatusBadge from "../components/StatusBadge";

import {
  createContributorRequest,
  getMyContributorRequest,
  getQuestions,
} from "../api";

import { useAuth } from "../context/AuthContext";


export default function MemberDashboard() {
  const navigate = useNavigate();
  const onNavigate = (page) => navigate(`/${page}`);

  const { token, user } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [request, setRequest] = useState(null);

  const [loading, setLoading] = useState(true);

  const [
    requestModalOpen,
    setRequestModalOpen,
  ] = useState(false);

  const [reason, setReason] = useState("");

  const [
    requestLoading,
    setRequestLoading,
  ] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  async function loadDashboard() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [
        questionsResult,
        requestResult,
      ] = await Promise.all([
        getQuestions(
          token,
          0,
          100
        ),
        getMyContributorRequest(token),
      ]);


      /*
       * The Member Dashboard should focus on
       * questions that still need an answer.
       *
       * The full community question list,
       * including answered questions, remains
       * available on the Questions page.
       */
      const openQuestions = (
        questionsResult?.items || []
      )
        .filter(
          (question) =>
            question.status === "open"
        )
        .slice(0, 6);


      setQuestions(openQuestions);
      setRequest(requestResult);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadDashboard();
  }, [token]);


  async function handleContributorRequest(
    event
  ) {
    event.preventDefault();

    setRequestLoading(true);
    setError("");
    setSuccess("");

    try {
      const result =
        await createContributorRequest(
          token,
          reason
        );

      setRequest(result);
      setRequestModalOpen(false);
      setReason("");

      setSuccess(
        "Your Contributor request has been submitted."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit your request."
      );
    } finally {
      setRequestLoading(false);
    }
  }


  function handleQuestionUpdated(
    updatedQuestion
  ) {
    if (!updatedQuestion?.id) {
      return;
    }

    /*
     * If an open question becomes answered,
     * remove it from the Member Dashboard.
     */
    if (
      updatedQuestion.status !== "open"
    ) {
      setQuestions((current) =>
        current.filter(
          (question) =>
            question.id !==
            updatedQuestion.id
        )
      );

      return;
    }


    setQuestions((current) =>
      current.map((question) =>
        question.id === updatedQuestion.id
          ? updatedQuestion
          : question
      )
    );
  }


  const hasPendingRequest =
    request?.status === "pending";


  return (
    <main className="dashboard-page">
      {/* HERO */}

      <section className="dashboard-hero member-hero">
        <div className="hero-content">
          <span className="eyebrow">
            Member Dashboard
          </span>

          <h1>
            Welcome back,
            <br />
            <span>
              {user?.email}
            </span>
          </h1>

          <p>
            Ask questions, explore community
            knowledge, and find the answers
            you're looking for.
          </p>

          <div className="hero-actions">
            <Button
              onClick={() =>
                onNavigate("questions")
              }
            >
              Ask a Question
            </Button>

            {!hasPendingRequest &&
              !request && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setRequestModalOpen(true)
                  }
                >
                  Become a Contributor
                </Button>
              )}
          </div>
        </div>


        <div className="hero-visual">
          <div className="hero-orb">
            <span>?</span>
          </div>

          <div className="floating-card floating-card-one">
            <strong>
              Ask
            </strong>

            <span>
              Get your questions answered
            </span>
          </div>

          <div className="floating-card floating-card-two">
            <strong>
              Discover
            </strong>

            <span>
              Learn from the community
            </span>
          </div>
        </div>
      </section>


      {/* ALERTS */}

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


      {/* CONTRIBUTOR REQUEST STATUS */}

      {request && (
        <section className="request-status-card">
          <div>
            <span className="section-label">
              Contributor Access
            </span>

            <h2>
              Your contributor request
            </h2>

            <p>
              {request.status === "pending" &&
                "Your request is waiting for an administrator to review it."}

              {request.status === "approved" &&
                "Your request was approved. You now have Contributor access."}

              {request.status === "rejected" &&
                "Your previous request was rejected. You can submit a new request."}
            </p>
          </div>

          <StatusBadge
            status={request.status}
          />

          {request.status === "rejected" && (
            <Button
              size="small"
              variant="secondary"
              onClick={() =>
                setRequestModalOpen(true)
              }
            >
              Request Again
            </Button>
          )}
        </section>
      )}


      {/* OPEN QUESTIONS */}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-label">
              Community
            </span>

            <h2>
              Questions that need answers
            </h2>
          </div>

          <button
            className="text-button"
            onClick={() =>
              onNavigate("questions")
            }
          >
            View all →
          </button>
        </div>


        <QuestionList
          questions={questions}
          loading={loading}
          onQuestionUpdated={
            handleQuestionUpdated
          }
          emptyTitle="No open questions"
          emptyMessage="There are no unanswered questions right now. Browse the community to explore existing knowledge."
        />
      </section>


      {/* CONTRIBUTOR REQUEST MODAL */}

      <Modal
        open={requestModalOpen}
        onClose={() => {
          if (!requestLoading) {
            setRequestModalOpen(false);
          }
        }}
        title="Become a Contributor"
        description="Share your knowledge and help other members get useful answers."
        size="medium"
        footer={
          <div className="answer-form-actions">
            <Button
              variant="secondary"
              onClick={() =>
                setRequestModalOpen(false)
              }
              disabled={requestLoading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="contributor-request-form"
              loading={requestLoading}
            >
              Submit Request
            </Button>
          </div>
        }
      >
        <form
          id="contributor-request-form"
          className="answer-form"
          onSubmit={
            handleContributorRequest
          }
        >
          <div className="answer-question-box">
            <div className="answer-form-label">
              About Contributor Access
            </div>

            <p className="answer-question-text">
              Contributors can answer community
              questions and share useful knowledge.
              Your request will be reviewed by an
              administrator.
            </p>
          </div>


          <div className="answer-form-group">
            <div className="answer-form-label-row">
              <label
                htmlFor="contributor-reason"
                className="answer-form-label"
              >
                Why would you like to contribute?
              </label>

              <span className="answer-character-count">
                {reason.length}/2000
              </span>
            </div>


            <textarea
              id="contributor-reason"
              className="answer-textarea"
              value={reason}
              onChange={(event) =>
                setReason(
                  event.target.value
                )
              }
              placeholder="Tell us a little about your knowledge, experience, or how you would like to help the community..."
              maxLength={2000}
              disabled={requestLoading}
            />


            <div className="answer-form-hint">
              <span>
                Optional
              </span>

              <span>
                Your request will be reviewed by
                an administrator.
              </span>
            </div>
          </div>
        </form>
      </Modal>
    </main>
  );
}