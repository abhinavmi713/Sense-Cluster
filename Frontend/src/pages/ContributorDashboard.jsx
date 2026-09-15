import {
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import QuestionList from "../components/QuestionList";

import {
  getQuestions,
} from "../api";

import { useAuth } from "../context/AuthContext";


export default function ContributorDashboard() {
  const navigate = useNavigate();
  const onNavigate = (page) => navigate(`/${page}`);

  const {
    token,
    user,
  } = useAuth();

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadQuestions() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result =
        await getQuestions(
          token,
          0,
          20
        );

      setQuestions(
        result?.items || []
      );

    } catch (err) {
      setError(
        err.message ||
          "Unable to load questions."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadQuestions();
  }, [token]);


  function handleQuestionUpdated(
    updatedQuestion
  ) {
    /*
     * Defensive check:
     * never try to access .id when the
     * child didn't provide an updated question.
     */
    if (!updatedQuestion?.id) {
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


  const unansweredCount =
    questions.filter(
      (question) =>
        question.status === "open"
    ).length;


  const answeredCount =
    questions.filter(
      (question) =>
        question.status === "answered"
    ).length;


  return (
    <main className="dashboard-page">

      <section className="dashboard-hero contributor-hero">

        <div className="hero-content">

          <span className="eyebrow">
            Contributor Dashboard
          </span>


          <h1>
            Make knowledge
            <br />
            <span>more useful.</span>
          </h1>


          <p>
            Help other members by answering
            questions and sharing what you know.
          </p>


          <div className="hero-actions">

            <Button
              onClick={() =>
                onNavigate("questions")
              }
            >
              Browse Questions
            </Button>


            <Button
              variant="secondary"
              onClick={() =>
                onNavigate("contributions")
              }
            >
              My Contributions
            </Button>

          </div>

        </div>


        <div className="contributor-illustration">

          <div className="contributor-circle">
            <span>✓</span>
          </div>


          <div className="knowledge-chip chip-one">
            Share
          </div>


          <div className="knowledge-chip chip-two">
            Answer
          </div>


          <div className="knowledge-chip chip-three">
            Help
          </div>

        </div>

      </section>


      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      <section className="stats-grid">

        <div className="stat-card">

          <div className="stat-icon">
            ?
          </div>

          <div>
            <span>
              Questions waiting
            </span>

            <strong>
              {unansweredCount}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>
              Answered questions
            </span>

            <strong>
              {answeredCount}
            </strong>
          </div>

        </div>


        <div className="stat-card">

          <div className="stat-icon">
            +
          </div>

          <div>
            <span>
              Your role
            </span>

            <strong>
              Contributor
            </strong>
          </div>

        </div>

      </section>


      <section className="dashboard-section">

        <div className="section-heading">

          <div>

            <span className="section-label">
              Help the community
            </span>

            <h2>
              Questions waiting for answers
            </h2>

          </div>


          <span className="dashboard-user">
            {user?.email}
          </span>

        </div>


        <QuestionList
          questions={questions}
          loading={loading}
          onQuestionUpdated={
            handleQuestionUpdated
          }
          emptyTitle="Everything is answered"
          emptyMessage="There are no questions waiting for an answer right now."
        />

      </section>

    </main>
  );
}