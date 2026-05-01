import { useState } from "react";
import PropTypes from "prop-types";
import { Star, X } from "lucide-react";
import api from "../../services/api";

/**
 * MilkQualityRatingModal Component
 * Modal for submitting milk quality ratings with 1-5 stars and optional comments
 * 
 * @param {string} orderId - The order ID
 * @param {string} buyerId - The buyer's ID
 * @param {function} onSubmit - Success callback
 * @param {function} onClose - Close handler
 */
export default function MilkQualityRatingModal({ orderId, buyerId, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    
    if (comments.length > 500) {
      setError("Comments exceed 500 character limit");
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await api.post("/api/ratings", {
        orderId,
        rating,
        comments: comments.trim()
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSubmit(response.data.data);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      setError(err.response?.data?.error?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };
  
  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded p-1"
        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
      >
        <Star
          size={40}
          className={`${
            star <= (hoverRating || rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          } transition-colors`}
        />
      </button>
    ));
  };
  
  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600">Your rating has been submitted successfully.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Rate Milk Quality</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              How would you rate the milk quality?
            </label>
            <div className="flex justify-center gap-2">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="text-center mt-2 text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
              Comments (Optional)
            </label>
            <textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your experience with the milk quality..."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {comments.length}/500 characters
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

MilkQualityRatingModal.propTypes = {
  orderId: PropTypes.string.isRequired,
  buyerId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
