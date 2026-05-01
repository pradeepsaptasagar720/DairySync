import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { Send, X } from "lucide-react";
import api from "../../services/api";

/**
 * ChatInterface Component
 * Real-time chat interface with message history and polling
 * 
 * @param {string} orderId - The order ID
 * @param {string} currentUserId - Current user's ID
 * @param {string} currentUserRole - Current user's role ('buyer' or 'delivery_boy')
 * @param {string} orderStatus - Current order status
 * @param {Date} completedAt - Order completion date
 * @param {function} onClose - Close handler
 */
export default function ChatInterface({
  orderId,
  currentUserId,
  currentUserRole,
  orderStatus,
  completedAt,
  onClose
}) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  // Check if chat is expired (completed >24 hours ago)
  const isChatExpired = () => {
    if (orderStatus === "Completed" && completedAt) {
      const hoursSinceCompletion = (Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60);
      return hoursSinceCompletion > 24;
    }
    return false;
  };
  
  const canSendMessages = !isChatExpired();
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Fetch messages
  const fetchMessages = async (isPolling = false) => {
    try {
      const lastMessageId = messages.length > 0 ? messages[messages.length - 1]._id : null;
      const params = lastMessageId ? { lastMessageId } : {};
      
      const response = await api.get(`/api/chat/messages/${orderId}`, { params });
      
      if (response.data.success) {
        if (isPolling && response.data.data.messages.length > 0) {
          // Append new messages
          setMessages(prev => [...prev, ...response.data.data.messages]);
          scrollToBottom();
        } else if (!isPolling) {
          // Initial load
          setMessages(response.data.data.messages);
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (!isPolling) {
        setError("Failed to load messages");
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };
  
  // Mark messages as read
  const markAsRead = async () => {
    try {
      await api.put(`/api/chat/messages/${orderId}/read`);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };
  
  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || sending || !canSendMessages) {
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      const response = await api.post("/api/chat/messages", {
        orderId,
        message: inputMessage.trim()
      });
      
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data]);
        setInputMessage("");
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.response?.data?.error?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };
  
  // Initial load and mark as read
  useEffect(() => {
    fetchMessages();
    markAsRead();
  }, [orderId]);
  
  // Set up polling
  useEffect(() => {
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 3000); // Poll every 3 seconds
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [messages]);
  
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  
  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.senderId === currentUserId;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <h3 className="text-lg font-semibold">Order Chat</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-blue-700 rounded transition-colors"
          aria-label="Close chat"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${isOwnMessage(message) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwnMessage(message)
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${
                    isOwnMessage(message) ? "text-blue-100" : "text-gray-600"
                  }`}>
                    {message.senderName}
                  </span>
                  <span className={`text-xs ${
                    isOwnMessage(message) ? "text-blue-200" : "text-gray-400"
                  }`}>
                    {formatTime(message.createdAt)}
                  </span>
                </div>
                <p className={`text-sm ${
                  isOwnMessage(message) ? "text-white" : "text-gray-800"
                }`}>
                  {message.message}
                </p>
                {!message.isRead && !isOwnMessage(message) && (
                  <div className="mt-1">
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        {!canSendMessages && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            Chat is no longer available for this order
          </div>
        )}
        
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={canSendMessages ? "Type a message..." : "Chat disabled"}
            disabled={!canSendMessages || sending}
            maxLength={1000}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!canSendMessages || sending || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Send message"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-500 text-right">
          {inputMessage.length}/1000 characters
        </div>
      </div>
    </div>
  );
}

ChatInterface.propTypes = {
  orderId: PropTypes.string.isRequired,
  currentUserId: PropTypes.string.isRequired,
  currentUserRole: PropTypes.oneOf(["buyer", "delivery_boy"]).isRequired,
  orderStatus: PropTypes.string.isRequired,
  completedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onClose: PropTypes.func.isRequired
};
