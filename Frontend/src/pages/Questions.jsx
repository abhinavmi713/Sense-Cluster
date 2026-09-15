import { useEffect, useState } from "react";

import Button from "../components/Button";
import Modal from "../components/Modal";
import QuestionList from "../components/QuestionList";
import StatusBadge from "../components/StatusBadge";

import {
  createQuestion,
  getQuestions,
} from "../api";

import { useAuth } from "../context/AuthContext";


export default function Questions() {
  const { token } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [askOpen, setAskOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [duplicate, setDuplicate] = useState(null);


  async function loadQuestions() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await getQuestions(
        token,
        0,
        100
      );

      setQuestions(result?.items || []);
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


  function openAskModal() {
    setError("");
    setSuccess("");
    setDuplicate(null);
    setAskOpen(true);
  }


  function closeAskModal() {
    if (submitting) {
      return;
    }

    setAskOpen(false);
    setQuestionText("");
  }


  async function handleAskQuestion(event) {
    event.preventDefault();

    const trimmedQuestion =
      questionText.trim();

    if (trimmedQuestion.length < 5) {
      setError(
        "Please enter a question with at least 5 characters."
      );

      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    setDuplicate(null);

    try {
      const result = await createQuestion(
        token,
        trimmedQuestion
      );

      if (
        result?.outcome ===
        "duplicate_answered"
      ) {
        setDuplicate(result.match);
        return;
      }

      if (
        result?.outcome ===
        "duplicate_unanswered"
      ) {
        setDuplicate(result.match);
        return;
      }

      if (
        result?.outcome ===
        "new_question"
      ) {
        if (result.question) {
          setQuestions((current) => [
            result.question,
            ...current,
          ]);
        }

        setQuestionText("");
        setAskOpen(false);

        setSuccess(
          "Your question has been added to the community."
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit your question."
      );
    } finally {
      setSubmitting(false);
    }
  }


  function handleQuestionUpdated(
    updatedQuestion
  ) {
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


  function closeDuplicate() {
    setDuplicate(null);
  }


  return (
    <main className="dashboard-page">
      <section className="questions-header">
        <div>
          <span className="eyebrow">
            Community Knowledge
          </span>

          <h1>
            Questions
          </h1>

          <p>
            Search through questions, discover
            existing answers, or ask something
            new.
          </p>
        </div>

        <Button
          onClick={openAskModal}
        >
          + Ask Question
        </Button>
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


      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="section-label">
              Community
            </span>

            <h2>
              Latest questions
            </h2>
          </div>

          <span className="question-total">
            {questions.length} questions
          </span>
        </div>


        <QuestionList
          questions={questions}
          loading={loading}
          onQuestionUpdated={
            handleQuestionUpdated
          }
          emptyTitle="No questions yet"
          emptyMessage="Ask the first question and start the conversation."
        />
      </section>


      {/* ASK QUESTION MODAL */}

      <Modal
        open={askOpen}
        onClose={closeAskModal}
        title="Ask a Question"
        description="Share your question with the SenseCluster community."
        size="large"
        footer={
          <div className="answer-form-actions">
            <Button
              variant="secondary"
              onClick={closeAskModal}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="ask-question-form"
              loading={submitting}
            >
              Ask Question
            </Button>
          </div>
        }
      >
        <form
          id="ask-question-form"
          className="answer-form"
          onSubmit={handleAskQuestion}
        >
          <div className="answer-question-box">
            <div className="answer-form-label">
              Before you ask
            </div>

            <p className="answer-question-text">
              SenseCluster will check whether a
              similar question already exists.
              If we find one, you will be able to
              view the existing question and answer
              instead of creating a duplicate.
            </p>
          </div>


          <div className="answer-form-group">
            <div className="answer-form-label-row">
              <label
                htmlFor="question-text"
                className="answer-form-label"
              >
                Your question
              </label>

              <span className="answer-character-count">
                {questionText.length}/1000
              </span>
            </div>


            <textarea
              id="question-text"
              className="answer-textarea"
              value={questionText}
              onChange={(event) =>
                setQuestionText(
                  event.target.value
                )
              }
              placeholder="What would you like the community to help you with?"
              minLength={5}
              maxLength={1000}
              disabled={submitting}
              autoFocus
            />


            <div className="answer-form-hint">
              <span>
                Minimum 5 characters
              </span>

              <span>
                Ask clearly so the community can
                provide the most useful answer.
              </span>
            </div>
          </div>
        </form>
      </Modal>


      {/* DUPLICATE QUESTION MODAL */}

      <Modal
        open={Boolean(duplicate)}
        onClose={closeDuplicate}
        title={
          duplicate?.question?.status ===
          "answered"
            ? "We found an existing answer"
            : "A similar question already exists"
        }
        size="large"
        footer={
          <Button
            variant="secondary"
            onClick={closeDuplicate}
          >
            Close
          </Button>
        }
      >
        {duplicate && (
          <div className="duplicate-result">
            <div className="duplicate-match-header">
              <StatusBadge
                status={
                  duplicate.question.status
                }
              />

              <span>
                {Math.round(
                  duplicate.similarity * 100
                )}
                % similar
              </span>
            </div>


            <h3>
              {duplicate.question.text}
            </h3>


            {duplicate.question.answer ? (
              <div className="duplicate-answer">
                <span>
                  Existing answer
                </span>

                <p>
                  {
                    duplicate.question.answer
                      .content
                  }
                </p>
              </div>
            ) : (
              <div className="duplicate-open">
                <span>
                  This question is still open.
                </span>

                <p>
                  Someone may already be working
                  on answering it.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}