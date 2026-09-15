export default function Button({
  children,
  variant = "primary",
  type = "button",
  size = "medium",
  loading = false,
  disabled = false,
  onClick,
  className = "",
  style,
  form,
}) {
  const classes = [
    "app-button",
    `app-button-${variant}`,
    `app-button-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      form={form}
      className={classes}
      style={style}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <span className="button-spinner" />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}