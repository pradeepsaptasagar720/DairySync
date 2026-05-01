import { useState } from "react";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full"
      >
        Chat
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-64 bg-white shadow rounded p-3">
          <p className="text-sm text-gray-700">
            Hi! How can I help you today?
          </p>
        </div>
      )}
    </>
  );
}
