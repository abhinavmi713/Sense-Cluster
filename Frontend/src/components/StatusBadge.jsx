function getStatusClass(status) {
  switch (status) {
    case "answered":
    case "open":
    case "pending":
    case "approved":
    case "rejected":
    case "member":
    case "contributor":
    case "admin":
      return `status-badge status-badge-${status}`;

    default:
      return "status-badge";
  }
}


function getStatusLabel(status) {
  switch (status) {
    case "answered":
      return "Answered";

    case "open":
      return "Open";

    case "pending":
      return "Pending";

    case "approved":
      return "Approved";

    case "rejected":
      return "Rejected";

    case "member":
      return "Member";

    case "contributor":
      return "Contributor";

    case "admin":
      return "Admin";

    default:
      return status;
  }
}


export default function StatusBadge({
  status,
}) {
  if (!status) {
    return null;
  }

  return (
    <span className={getStatusClass(status)}>
      <span className="status-badge-dot" />

      {getStatusLabel(status)}
    </span>
  );
}