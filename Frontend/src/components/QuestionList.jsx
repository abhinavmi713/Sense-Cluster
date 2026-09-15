import QuestionCard from "./QuestionCard";
import Loading from "./Loading";


export default function QuestionList({
  questions = [],
  loading = false,
  onQuestionUpdated,
  emptyTitle = "No questions yet",
  emptyMessage =
    "Be the first person to ask a question.",
}) {
  if (loading) {
    return (
      <Loading text="Loading questions..." />
    );
  }


  if (!questions.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          ?
        </div>

        <h3>{emptyTitle}</h3>

        <p>{emptyMessage}</p>
      </div>
    );
  }


  return (
    <div className="question-list">
      {questions.map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          onUpdated={onQuestionUpdated}
        />
      ))}
    </div>
  );
}