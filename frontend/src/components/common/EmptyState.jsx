export default function EmptyState({ message = "No data available" }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p className="text-sm">{message}</p>
    </div>
  );
}
