import { useState } from "react";
import { Bell, Send, CheckCircle, AlertCircle } from "lucide-react";
import api from "../../services/api";

export default function SendNotifications() {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    recipients: []
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const recipientOptions = [
    { id: "farmers", label: "Farmers", icon: "👨‍🌾", color: "green" },
    { id: "buyers", label: "Buyers", icon: "🛒", color: "blue" },
    { id: "employees", label: "Employees", icon: "👥", color: "purple" },
    { id: "all", label: "Everyone", icon: "📢", color: "orange" }
  ];

  const toggleRecipient = (id) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.includes(id)
        ? prev.recipients.filter(r => r !== id)
        : [...prev.recipients, id]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);

    if (!formData.title || !formData.message || formData.recipients.length === 0) {
      setResult({ success: false, message: "Please fill all fields and select recipients" });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/api/notifications/send", formData);
      
      setResult({
        success: true,
        message: `Notification sent to ${response.data.data.sentToCount} users successfully!`
      });

      setFormData({ title: "", message: "", recipients: [] });
      
      setTimeout(() => setResult(null), 5000);
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.error?.message || "Failed to send notification"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-indigo-600" size={32} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Send Notifications</h1>
            <p className="text-gray-600">Send updates to farmers, buyers, and employees</p>
          </div>
        </div>

        {result && (
          <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${
            result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}>
            {result.success ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{result.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Enter your message"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Send To</label>
            <div className="grid grid-cols-2 gap-3">
              {recipientOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleRecipient(option.id)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.recipients.includes(option.id)
                      ? `border-${option.color}-500 bg-${option.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={20} />
                Send Notification
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
