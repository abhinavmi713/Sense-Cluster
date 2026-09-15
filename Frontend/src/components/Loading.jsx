export default function Loading({
  text = "Loading...",
  fullPage = false,
}) {
  return (
    <div
      className={
        fullPage
          ? "loading-container loading-full-page"
          : "loading-container"
      }
    >
      <div className="loading-spinner" />

      <span className="loading-text">
        {text}
      </span>
    </div>
  );
}