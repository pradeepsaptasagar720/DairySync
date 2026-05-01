import { useState, useEffect } from 'react';
import { Package, AlertCircle, CheckCircle, Clock, TrendingUp, ShoppingCart } from 'lucide-react';
import feedService from '../../services/FeedService';
import { useEventBus } from '../../hooks/useEventBus';
import { EVENT_TYPES } from '../../constants/eventTypes';
import { PREDEFINED_FEEDS, URGENCY_LEVELS } from '../../constants/feedTypes';

export default function BookFeed() {
  const [stockAvailability, setStockAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    feedName: '',
    quantity: '',
    urgencyLevel: URGENCY_LEVELS.NORMAL.value,
    notes: ''
  });
  const [validationError, setValidationError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedFeedStock, setSelectedFeedStock] = useState(null);

  const { subscribe, emit } = useEventBus('BookFeed');

  useEffect(() => {
    loadStockAvailability();
    
    // Subscribe to real-time stock updates
    const unsubscribeStockUpdate = subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, handleStockUpdate);
    const unsubscribePriceUpdate = subscribe(EVENT_TYPES.FEED_STOCK_PRICE_CHANGED, handleStockUpdate);

    return () => {
      unsubscribeStockUpdate();
      unsubscribePriceUpdate();
    };
  }, [subscribe]);

  useEffect(() => {
    // Validate quantity whenever form changes
    if (bookingForm.feedName && bookingForm.quantity) {
      validateQuantity();
    } else {
      setValidationError('');
    }
  }, [bookingForm.feedName, bookingForm.quantity]);

  const loadStockAvailability = () => {
    try {
      setLoading(true);
      const availability = feedService.getStockAvailability();
      setStockAvailability(availability);
    } catch (error) {
      console.error('Error loading stock availability:', error);
      showNotification('Error loading stock availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = (data) => {
    // Reload stock availability for real-time updates
    loadStockAvailability();
    
    // If currently selected feed was updated, show notification
    if (bookingForm.feedName === data.feedStock.feedName) {
      showNotification(`${data.feedStock.feedName} stock updated`, 'info');
      
      // Re-validate current quantity
      if (bookingForm.quantity) {
        validateQuantity();
      }
    }
  };

  const validateQuantity = () => {
    const quantity = parseFloat(bookingForm.quantity);
    
    if (isNaN(quantity) || quantity <= 0) {
      setValidationError('Please enter a valid quantity');
      return false;
    }

    const validation = feedService.validateQuantityRequest(bookingForm.feedName, quantity);
    
    if (!validation.isValid) {
      setValidationError(validation.error);
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleFormChange = (field, value) => {
    setBookingForm(prev => ({ ...prev, [field]: value }));
    
    // Update selected feed stock when feed name changes
    if (field === 'feedName') {
      const feedStock = stockAvailability.find(stock => stock.feedName === value);
      setSelectedFeedStock(feedStock);
      
      // Clear quantity when changing feed type
      setBookingForm(prev => ({ ...prev, quantity: '' }));
    }
  };

  const handleSubmitBooking = () => {
    if (!validateQuantity()) {
      return;
    }

    if (!bookingForm.feedName || !bookingForm.quantity || !bookingForm.urgencyLevel) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmBooking = async () => {
    try {
      setIsSubmitting(true);

      // Mock farmer data - in real app, get from auth context
      const farmerId = 'farmer_001';
      const farmerName = 'Rajesh Kumar';

      const requestData = {
        farmerId,
        farmerName,
        feedName: bookingForm.feedName,
        requestedQuantity: parseFloat(bookingForm.quantity),
        urgencyLevel: bookingForm.urgencyLevel,
        notes: bookingForm.notes
      };

      const feedRequest = await feedService.createFeedRequest(requestData);

      // Reset form
      setBookingForm({
        feedName: '',
        quantity: '',
        urgencyLevel: URGENCY_LEVELS.NORMAL.value,
        notes: ''
      });
      setSelectedFeedStock(null);
      setShowConfirmation(false);

      showNotification(`Feed booking submitted successfully! Request ID: ${feedRequest.id}`, 'success');
    } catch (error) {
      console.error('Error creating feed request:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelBooking = () => {
    setShowConfirmation(false);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getUrgencyColor = (urgencyLevel) => {
    const urgency = Object.values(URGENCY_LEVELS).find(u => u.value === urgencyLevel);
    switch (urgency?.color) {
      case 'red': return 'border-red-500 bg-red-50';
      case 'orange': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const calculateTotalAmount = () => {
    if (!selectedFeedStock || !bookingForm.quantity) return 0;
    return parseFloat(bookingForm.quantity) * selectedFeedStock.pricePerKg;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Feed Booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Feed</h1>
          <p className="text-gray-600">Request feed supplies with real-time stock availability</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {notification.type === 'info' && <Clock className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stock Availability Dashboard */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Stock Availability</h2>
            <div className="space-y-4">
              {stockAvailability.map((stock) => (
                <div key={stock.feedName} className={`bg-white rounded-lg shadow-md border-2 p-4 ${
                  bookingForm.feedName === stock.feedName ? 'border-green-500' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{stock.feedName}</h3>
                        <p className="text-sm text-gray-500">{stock.description}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stock.stockStatus === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                      stock.stockStatus === 'low_stock' ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {stock.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                       stock.stockStatus === 'low_stock' ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Available: <span className="font-semibold">{stock.availableQuantity} kg</span></p>
                      {stock.isAvailable && (
                        <p className="text-sm text-gray-600">Price: <span className="font-semibold text-green-600">₹{stock.pricePerKg}/kg</span></p>
                      )}
                    </div>
                    {stock.isAvailable && (
                      <button
                        onClick={() => handleFormChange('feedName', stock.feedName)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          bookingForm.feedName === stock.feedName
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {bookingForm.feedName === stock.feedName ? 'Selected' : 'Select'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Feed Booking Form</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="space-y-6">
                {/* Feed Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Feed Type *
                  </label>
                  <select
                    value={bookingForm.feedName}
                    onChange={(e) => handleFormChange('feedName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Choose a feed type</option>
                    {stockAvailability
                      .filter(stock => stock.isAvailable)
                      .map((stock) => (
                        <option key={stock.feedName} value={stock.feedName}>
                          {stock.feedName} - {stock.availableQuantity} kg available
                        </option>
                      ))}
                  </select>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity (kg) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={bookingForm.quantity}
                    onChange={(e) => handleFormChange('quantity', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      validationError ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter quantity in kg"
                    disabled={!bookingForm.feedName}
                  />
                  {selectedFeedStock && (
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {selectedFeedStock.availableQuantity} kg
                    </p>
                  )}
                  {validationError && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {validationError}
                    </p>
                  )}
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(URGENCY_LEVELS).map((urgency) => (
                      <button
                        key={urgency.value}
                        type="button"
                        onClick={() => handleFormChange('urgencyLevel', urgency.value)}
                        className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                          bookingForm.urgencyLevel === urgency.value
                            ? getUrgencyColor(urgency.value)
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        {urgency.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Any special requirements or notes..."
                  />
                </div>

                {/* Total Amount Display */}
                {selectedFeedStock && bookingForm.quantity && !validationError && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-green-800">Estimated Total Amount:</span>
                      <span className="text-lg font-bold text-green-900">
                        {formatCurrency(calculateTotalAmount())}
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {bookingForm.quantity} kg × ₹{selectedFeedStock.pricePerKg}/kg
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmitBooking}
                  disabled={!bookingForm.feedName || !bookingForm.quantity || validationError || isSubmitting}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Book Feed Request
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Confirm Feed Booking
              </h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Feed Type:</span>
                  <span className="font-medium">{bookingForm.feedName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{bookingForm.quantity} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per kg:</span>
                  <span className="font-medium">₹{selectedFeedStock?.pricePerKg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-medium text-green-600">{formatCurrency(calculateTotalAmount())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Urgency:</span>
                  <span className={`px-2 py-1 rounded text-sm ${getUrgencyColor(bookingForm.urgencyLevel)}`}>
                    {bookingForm.urgencyLevel}
                  </span>
                </div>
                {bookingForm.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded mt-1">{bookingForm.notes}</p>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to book this feed? Your request will be sent to the employee for approval.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelBooking}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBooking}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}