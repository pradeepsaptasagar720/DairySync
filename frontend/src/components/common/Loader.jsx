export default function Loader({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-600">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
