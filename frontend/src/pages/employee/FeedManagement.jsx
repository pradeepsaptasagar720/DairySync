import { useState, useEffect } from 'react';
import { Package, Clock, AlertTriangle, CheckCircle, XCircle, User, Calendar } from 'lucide-react';
import feedService from '../../services/FeedService';
import { useEventBus } from '../../hooks/useEventBus';
import { EVENT_TYPES } from '../../constants/eventTypes';
import { REQUEST_STATUS, URGENCY_LEVELS } from '../../constants/feedTypes';

export default function FeedManagement() {
  const [feedRequests, setFeedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('pending');

  const { subscribe } = useEventBus('FeedManagement');

  useEffect(() => {
    loadFeedRequests();
    
    // Subscribe to real-time updates
    const unsubscribeRequestCreated = subscribe(EVENT_TYPES.FEED_REQUEST_CREATED, handleNewRequest);
    const unsubscribeRequestApproved = subscribe(EVENT_TYPES.FEED_REQUEST_APPROVED, handleRequestUpdate);
    const unsubscribeStockUpdate = subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, handleStockUpdate);

    return () => {
      unsubscribeRequestCreated();
      unsubscribeRequestApproved();
      unsubscribeStockUpdate();
    };
  }, [subscribe, filter]);

  const loadFeedRequests = () => {
    try {
      setLoading(true);
      const filters = filter === 'all' ? {} : { status: filter === 'pending' ? REQUEST_STATUS.PENDING : REQUEST_STATUS.APPROVED };
      const requests = feedService.getFeedRequests(filters);
      setFeedRequests(requests);
    } catch (error) {
      console.error('Error loading feed requests:', error);
      showNotification('Error loading feed requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNewRequest = (data) => {
    // Reload requests to include new one
    loadFeedRequests();
    showNotification(`New feed request from ${data.feedRequest.farmerName}`, 'info');
  };

  const handleRequestUpdate = (data) => {
    // Reload requests to reflect approval
    loadFeedRequests();
    showNotification(`Feed request approved for ${data.feedRequest.farmerName}`, 'success');
  };

  const handleStockUpdate = (data) => {
    // Stock updated, requests may need validation refresh
    if (selectedRequest) {
      // Re-validate current stock for selected request
      const validation = feedService.validateQuantityRequest(
        selectedRequest.feedName, 
        selectedRequest.requestedQuantity
      );
      if (!validation.isValid) {
        showNotification('Stock levels changed - please review request', 'warning');
      }
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const confirmApproval = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);

      // Validate current stock availability
      const validation = feedService.validateQuantityRequest(
        selectedRequest.feedName,
        selectedRequest.requestedQuantity
      );

      if (!validation.isValid) {
        showNotification(validation.error, 'error');
        return;
      }

      // Mock employee data - in real app, get from auth context
      const employeeId = 'emp_001';
      const employeeName = 'John Doe';

      const result = await feedService.approveFeedRequest(
        selectedRequest.id,
        employeeId,
        employeeName
      );

      setShowApprovalModal(false);
      setSelectedRequest(null);
      showNotification(`Feed request approved successfully. Receipt ID: ${result.receiptId}`, 'success');
    } catch (error) {
      console.error('Error approving feed request:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelApproval = () => {
    setShowApprovalModal(false);
    setSelectedRequest(null);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getUrgencyColor = (urgencyLevel) => {
    const urgency = Object.values(URGENCY_LEVELS).find(u => u.value === urgencyLevel);
    switch (urgency?.color) {
      case 'red': return 'bg-red-100 text-red-800 border-red-200';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyIcon = (urgencyLevel) => {
    const urgency = Object.values(URGENCY_LEVELS).find(u => u.value === urgencyLevel);
    switch (urgency?.color) {
      case 'red': return <AlertTriangle className="h-4 w-4" />;
      case 'orange': return <Clock className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Feed Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed Management</h1>
        <p className="text-gray-600">Review and approve farmer feed requests with automatic stock reduction</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
          {notification.type === 'error' && <XCircle className="h-5 w-5" />}
          {notification.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
          {notification.type === 'info' && <Clock className="h-5 w-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: 'Pending Requests', count: feedRequests.filter(r => r.status === REQUEST_STATUS.PENDING).length },
              { key: 'approved', label: 'Approved Requests', count: feedRequests.filter(r => r.status === REQUEST_STATUS.APPROVED).length },
              { key: 'all', label: 'All Requests', count: feedRequests.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Feed Requests List */}
      {feedRequests.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feed requests found</h3>
          <p className="text-gray-500">
            {filter === 'pending' ? 'No pending requests at the moment' : 'No requests match the current filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Request Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-500" />
                      <span className="font-semibold text-gray-900">{request.farmerName}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(request.urgencyLevel)}`}>
                      <div className="flex items-center gap-1">
                        {getUrgencyIcon(request.urgencyLevel)}
                        {request.urgencyLevel}
                      </div>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      request.status === REQUEST_STATUS.PENDING 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : request.status === REQUEST_STATUS.APPROVED
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Feed Type</p>
                      <p className="font-medium text-gray-900">{request.feedName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantity</p>
                      <p className="font-medium text-gray-900">{request.requestedQuantity} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium text-green-600">{formatCurrency(request.totalAmount)}</p>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Requested: {new Date(request.requestDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span>Price: Rs.{request.pricePerKg}/kg</span>
                    </div>
                    {request.isOverdue() && (
                      <span className="text-red-600 font-medium">Overdue</span>
                    )}
                  </div>

                  {/* Notes */}
                  {request.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Notes:</p>
                      <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{request.notes}</p>
                    </div>
                  )}

                  {/* Approval Info */}
                  {request.status === REQUEST_STATUS.APPROVED && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>Approved by:</strong> {request.approvedByName} on {new Date(request.approvalDate).toLocaleDateString()}
                      </p>
                      {request.receiptId && (
                        <p className="text-sm text-green-800">
                          <strong>Receipt ID:</strong> {request.receiptId}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {request.status === REQUEST_STATUS.PENDING && (
                  <div className="ml-6">
                    <button
                      onClick={() => handleApproveRequest(request)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Request
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Feed Approval
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Farmer:</span>
                <span className="font-medium">{selectedRequest.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Feed:</span>
                <span className="font-medium">{selectedRequest.feedName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{selectedRequest.requestedQuantity} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-green-600">{formatCurrency(selectedRequest.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Urgency:</span>
                <span className={`px-2 py-1 rounded text-sm ${getUrgencyColor(selectedRequest.urgencyLevel)}`}>
                  {selectedRequest.urgencyLevel}
                </span>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Approving this request will automatically reduce the feed stock quantity and generate a receipt.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelApproval}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmApproval}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Approve Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}