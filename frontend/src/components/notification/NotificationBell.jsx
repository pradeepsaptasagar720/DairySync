import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);

  // Don't show for admin or milk_collector
  if (!user || user.role === "admin" || (user.role === "employee" && user.employeeRole === "milk_collector")) {
    return null;
  }

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("/api/notifications/unread-count");
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/notifications");
      if (res.data.success) {
        setNotifications(res.data.data.notifications);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  // Mark as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch("/api/notifications/mark-all-read");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  // Poll for updates every 5 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full min-w-[20px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}
