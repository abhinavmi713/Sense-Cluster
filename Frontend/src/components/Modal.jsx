export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "default",
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={
          size === "large"
            ? "modal modal-lg"
            : "modal"
        }
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {title}
            </h2>

            {description && (
              <p className="modal-description">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}