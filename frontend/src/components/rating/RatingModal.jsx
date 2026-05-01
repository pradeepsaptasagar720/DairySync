import { useState } from "react";
import { Star, X } from "lucide-react";
import api from "../../services/api";

export default function RatingModal({ order, onClose, onSuccess }) {
  const [stars, setStars] = useState(0);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (stars === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post(`/api/orders/${order._id}/rating`, {
        stars,
        feedback: feedback.trim()
      });

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError(err.response?.data?.error?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Rate Your Delivery</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Order Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{order.milkType === "cow" ? "🐄" : "🐃"}</span>
              <div>
                <p className="font-medium capitalize">{order.milkType} Milk - {order.quantity}L</p>
                <p className="text-sm text-gray-600">Order #{order._id.slice(-8)}</p>
              </div>
            </div>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How was your delivery experience?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStars(star)}
                  onMouseEnter={() => setHoveredStars(star)}
                  onMouseLeave={() => setHoveredStars(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`${
                      star <= (hoveredStars || stars)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    } transition-colors`}
                  />
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600">
                {stars === 1 && "Poor"}
                {stars === 2 && "Fair"}
                {stars === 3 && "Good"}
                {stars === 4 && "Very Good"}
                {stars === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Feedback */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us more about your experience..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || stars === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
