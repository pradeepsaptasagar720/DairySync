import { Bell, CheckCheck } from "lucide-react";
import DOMPurify from "dompurify";

export default function NotificationDropdown({ notifications, loading, onMarkAsRead, onMarkAllAsRead, onClose }) {
  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell size={48} className="mx-auto text-gray-300 mb-2" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && onMarkAsRead(notif._id)}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notif.isRead ? "bg-indigo-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{notif.title}</h4>
                  <p
                    className="text-sm text-gray-600 mt-1"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(notif.message)
                    }}
                  />
                  <p className="text-xs text-gray-400 mt-2">{formatDate(notif.createdAt)}</p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
