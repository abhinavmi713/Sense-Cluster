import { useState } from "react";

import Button from "./Button";
import Modal from "./Modal";
import StatusBadge from "./StatusBadge";

import {
  submitAnswer,
  updateAnswer,
} from "../api";

import { useAuth } from "../context/AuthContext";


function formatDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleDateString(
      undefined,
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  } catch {
    return "";
  }
}


export default function QuestionCard({
  question,
  onUpdated,
}) {
  const {
    user,
    isContributor,
    isAdmin,
  } = useAuth();

  const token = sessionStorage.getItem(
    "sensecluster_token"
  );

  const [
    answerModalOpen,
    setAnswerModalOpen,
  ] = useState(false);

  const [answer, setAnswer] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");


  const existingAnswer = question?.answer;

  const canAnswer =
    (isContributor || isAdmin) &&
    !existingAnswer;

  const canEditAnswer =
    existingAnswer &&
    (
      isAdmin ||
      existingAnswer.author_id === user?.id
    );


  function openAnswerModal() {
    setError("");

    setAnswer(
      existingAnswer?.content || ""
    );

    setAnswerModalOpen(true);
  }


  function closeAnswerModal() {
    if (saving) {
      return;
    }

    setAnswerModalOpen(false);
    setError("");
  }


  async function handleSubmitAnswer(event) {
    event.preventDefault();

    const trimmedAnswer =
      answer.trim();


    if (trimmedAnswer.length < 10) {
      setError(
        "Your answer must be at least 10 characters."
      );

      return;
    }


    if (!token) {
      setError(
        "Your session has expired. Please sign in again."
      );

      return;
    }


    setError("");
    setSaving(true);


    try {
      let updatedQuestion;

      if (existingAnswer) {
        updatedQuestion =
          await updateAnswer(
            token,
            question.id,
            trimmedAnswer
          );
      } else {
        updatedQuestion =
          await submitAnswer(
            token,
            question.id,
            trimmedAnswer
          );
      }


      setAnswerModalOpen(false);
      setAnswer("");


      /*
       * The backend returns the updated question.
       * Pass that question back to the parent so
       * the dashboard can update its local state.
       */
      if (
        onUpdated &&
        updatedQuestion
      ) {
        await onUpdated(
          updatedQuestion
        );
      }

    } catch (err) {
      setError(
        err.message ||
          "Unable to save your answer. Please try again."
      );

    } finally {
      setSaving(false);
    }
  }


  return (
    <>
      <article className="question-card">

        <div className="question-card-header">

          <div className="question-meta">

            <StatusBadge
              status={question.status}
            />

            <span className="question-date">
              {formatDate(
                question.created_at
              )}
            </span>

          </div>

        </div>


        <div className="question-title">
          {question.text}
        </div>


        {!existingAnswer && (
          <div className="question-unanswered">

            <span className="question-unanswered-dot" />

            <span>
              Waiting for an answer
            </span>

          </div>
        )}


        {existingAnswer && (
          <div className="question-answer">

            <div className="answer-label">

              <span className="answer-label-icon">
                ✓
              </span>

              Answer

            </div>


            <div className="answer-content">
              {existingAnswer.content}
            </div>

          </div>
        )}


        {(canAnswer || canEditAnswer) && (
          <div className="question-actions">

            <Button
              type="button"
              size="small"
              onClick={openAnswerModal}
            >
              {existingAnswer
                ? "Edit Answer"
                : "Answer"}
            </Button>

          </div>
        )}

      </article>


      <Modal
        open={answerModalOpen}
        onClose={closeAnswerModal}
        title={
          existingAnswer
            ? "Edit your answer"
            : "Answer this question"
        }
        description={
          existingAnswer
            ? "Update your answer and keep the community knowledge accurate."
            : "Share a clear and helpful answer with the community."
        }
        size="large"
      >

        <form
          className="answer-form"
          onSubmit={handleSubmitAnswer}
        >

          <div className="answer-question-box">

            <div className="answer-form-label">
              Question
            </div>

            <div className="answer-question-text">
              {question.text}
            </div>

          </div>


          <div className="answer-form-group">

            <div className="answer-form-label-row">

              <label
                htmlFor={`answer-${question.id}`}
                className="answer-form-label"
              >
                Your answer
              </label>

              <span className="answer-character-count">
                {answer.length}/5000
              </span>

            </div>


            <textarea
              id={`answer-${question.id}`}
              className="answer-textarea"
              value={answer}
              onChange={(event) =>
                setAnswer(
                  event.target.value.slice(
                    0,
                    5000
                  )
                )
              }
              placeholder="Share a clear and helpful answer..."
              minLength={10}
              maxLength={5000}
              rows={8}
              disabled={saving}
              required
              autoFocus
            />


            <div className="answer-form-hint">
              Minimum 10 characters. Keep your
              answer clear, relevant, and helpful.
            </div>

          </div>


          {error && (
            <div className="alert alert-error">

              <span>!</span>

              <span>
                {error}
              </span>

            </div>
          )}


          <div className="answer-form-actions">

            <Button
              type="button"
              variant="secondary"
              onClick={closeAnswerModal}
              disabled={saving}
            >
              Cancel
            </Button>


            <Button
              type="submit"
              loading={saving}
              disabled={
                answer.trim().length < 10
              }
            >
              {existingAnswer
                ? "Save changes"
                : "Post Answer"}
            </Button>

          </div>

        </form>

      </Modal>
    </>
  );
}