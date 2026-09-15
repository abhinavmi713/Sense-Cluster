import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button";
import QuestionList from "../components/QuestionList";

import { getQuestions } from "../api";
import { useAuth } from "../context/AuthContext";


export default function MyContributions() {
  const navigate = useNavigate();
  const onNavigate = (page) => navigate(`/${page}`);

  const { token, user } = useAuth();

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadContributions() {
    setLoading(true);
    setError("");

    try {
      const result =
        await getQuestions(
          token,
          0,
          100
        );

      const allQuestions =
        result?.items || [];

      const myContributions =
        allQuestions.filter(
          (question) =>
            question.answer?.author_id ===
            user?.id
        );

      setQuestions(
        myContributions
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load your contributions."
      );
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (user?.id) {
      loadContributions();
    }
  }, [token, user?.id]);


  function handleQuestionUpdated(
    updatedQuestion
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === updatedQuestion.id
          ? updatedQuestion
          : question
      )
    );
  }


  const contributionCount =
    questions.length;


  const recentCount = useMemo(
    () =>
      questions.filter((question) => {
        const created =
          new Date(
            question.answer?.updated_at
          );

        const thirtyDaysAgo =
          Date.now() -
          30 * 24 * 60 * 60 * 1000;

        return (
          created.getTime() >
          thirtyDaysAgo
        );
      }).length,
    [questions]
  );


  return (
    <main className="dashboard-page">
      <section className="page-header">
        <div>
          <span className="eyebrow">
            Your Impact
          </span>

          <h1>
            My Contributions
          </h1>

          <p>
            Every answer you share helps
            someone in the community move
            forward.
          </p>
        </div>

        <Button
          onClick={() =>
            onNavigate("questions")
          }
        >
          Find Questions to Answer
        </Button>
      </section>


      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      <section className="stats-grid compact-stats">
        <div className="stat-card">
          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>
              Total answers
            </span>

            <strong>
              {contributionCount}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            ↑
          </div>

          <div>
            <span>
              Last 30 days
            </span>

            <strong>
              {recentCount}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            ★
          </div>

          <div>
            <span>
              Role
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
              Your knowledge
            </span>

            <h2>
              Answers you've shared
            </h2>
          </div>
        </div>


        <QuestionList
          questions={questions}
          loading={loading}
          onQuestionUpdated={
            handleQuestionUpdated
          }
          emptyTitle="No contributions yet"
          emptyMessage="Browse open questions and share your knowledge with the community."
        />
      </section>
    </main>
  );
}