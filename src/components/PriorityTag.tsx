export default function PriorityTag({ priority }: { priority: string }) {
  let color = "bg-gray-200";
  if (priority === "HIGH") {
    color = "bg-red-primary";
  } else if (priority === "MEDIUM") {
    color = "bg-orange-primary";
  } else if (priority === "LOW") {
    color = "bg-green-dark";
  }

  return (
    <span
      className={`inline-block px-2 py-1 rounded-md bg-opacity-20 ${color}`}
    >
      {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
    </span>
  );
}
