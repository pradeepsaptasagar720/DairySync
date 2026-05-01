import { MessageCircle } from "lucide-react";
import PropTypes from "prop-types";

/**
 * ChatButton Component
 * Displays a chat button with unread message count badge
 * 
 * @param {string} orderId - The order ID
 * @param {number} unreadCount - Number of unread messages
 * @param {function} onClick - Click handler to open chat interface
 */
export default function ChatButton({ orderId, unreadCount = 0, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 min-h-[44px] min-w-[44px] touch-manipulation"
      aria-label={`Open chat${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      <MessageCircle size={18} />
      <span className="font-medium">Chat</span>
      
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

ChatButton.propTypes = {
  orderId: PropTypes.string.isRequired,
  unreadCount: PropTypes.number,
  onClick: PropTypes.func.isRequired
};
