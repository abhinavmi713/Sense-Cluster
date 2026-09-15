import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import QuestionList from "../components/QuestionList";
import Button from "../components/Button";

import { getMyQuestions } from "../api";
import { useAuth } from "../context/AuthContext";


export default function MyQuestions() {
  const navigate = useNavigate();
  const onNavigate = (page) => navigate(`/${page}`);

  const { token, user } = useAuth();

  const [questions, setQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadQuestions() {
    if (!token || !user?.id) {
      return;
    }

    setLoading(true);
    setError("");


    try {
      /*
       * The backend now returns only questions
       * created by the authenticated user.
       *
       * This works for Members, Contributors,
       * and Admins.
       */
      const result =
        await getMyQuestions(
          token,
          0,
          100
        );


      setQuestions(
        result?.items || []
      );

    } catch (err) {
      setError(
        err.message ||
          "Unable to load your questions."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadQuestions();
  }, [
    token,
    user?.id,
  ]);


  function handleQuestionUpdated(
    updatedQuestion
  ) {
    if (!updatedQuestion?.id) {
      return;
    }


    setQuestions((current) =>
      current.map((question) =>
        question.id ===
        updatedQuestion.id
          ? updatedQuestion
          : question
      )
    );
  }


  const answeredCount =
    useMemo(
      () =>
        questions.filter(
          (question) =>
            question.status ===
            "answered"
        ).length,
      [questions]
    );


  const openCount =
    questions.length -
    answeredCount;


  return (
    <main className="dashboard-page">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <section className="page-header">
        <div>
          <span className="eyebrow">
            Your Activity
          </span>

          <h1>
            My Questions
          </h1>

          <p>
            Keep track of the questions
            you've asked and the answers
            you've received.
          </p>
        </div>


        <Button
          onClick={() =>
            onNavigate("questions")
          }
        >
          + Ask Question
        </Button>
      </section>


      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}


      {/* =====================================================
          STATS
          ===================================================== */}

      <section className="stats-grid compact-stats">

        <div className="stat-card">
          <div className="stat-icon">
            ?
          </div>

          <div>
            <span>
              Total questions
            </span>

            <strong>
              {questions.length}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            ✓
          </div>

          <div>
            <span>
              Answered
            </span>

            <strong>
              {answeredCount}
            </strong>
          </div>
        </div>


        <div className="stat-card">
          <div className="stat-icon">
            •
          </div>

          <div>
            <span>
              Open
            </span>

            <strong>
              {openCount}
            </strong>
          </div>
        </div>

      </section>


      {/* =====================================================
          QUESTION HISTORY
          ===================================================== */}

      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <span className="section-label">
              Your questions
            </span>

            <h2>
              Question history
            </h2>
          </div>
        </div>


        <QuestionList
          questions={questions}
          loading={loading}
          onQuestionUpdated={
            handleQuestionUpdated
          }
          emptyTitle="You haven't asked anything yet"
          emptyMessage="Ask your first question and start learning from the community."
        />

      </section>

    </main>
  );
}