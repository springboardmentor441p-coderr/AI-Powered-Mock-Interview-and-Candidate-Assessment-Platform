function StatusBadge({ status }) {
  let color = "bg-gray-100 text-gray-700";

  switch ((status || "").toLowerCase()) {
    case "connected":
    case "listening":
      color = "bg-green-100 text-green-700";
      break;

    case "speaking":
      color = "bg-blue-100 text-blue-700";
      break;

    case "thinking":
      color = "bg-purple-100 text-purple-700";
      break;

    case "disconnected":
      color = "bg-red-100 text-red-700";
      break;

    default:
      color = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${color}`}>
      ● {status}
    </span>
  );
}

export default StatusBadge;