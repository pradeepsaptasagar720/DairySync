import { useState, useEffect } from 'react';
import { Package, Plus, History, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import feedService from '../../services/FeedService';
import { useEventBus } from '../../hooks/useEventBus';
import { EVENT_TYPES } from '../../constants/eventTypes';

export default function FeedStockManagement() {
  const [feedStocks, setFeedStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFeed, setEditingFeed] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedFeedHistory, setSelectedFeedHistory] = useState([]);
  const [selectedFeedName, setSelectedFeedName] = useState('');
  const [updateForm, setUpdateForm] = useState({
    quantity: '',
    purchasedRate: '',
    price: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState(null);

  const { subscribe } = useEventBus('FeedStockManagement');

  useEffect(() => {
    loadFeedStocks();
    
    // Subscribe to real-time updates
    const unsubscribeStockUpdate = subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, handleStockUpdate);
    const unsubscribePriceUpdate = subscribe(EVENT_TYPES.FEED_STOCK_PRICE_CHANGED, handleStockUpdate);
    const unsubscribeHistoryUpdate = subscribe(EVENT_TYPES.STOCK_HISTORY_ADDED, handleHistoryUpdate);

    return () => {
      unsubscribeStockUpdate();
      unsubscribePriceUpdate();
      unsubscribeHistoryUpdate();
    };
  }, [subscribe]);

  const loadFeedStocks = () => {
    try {
      setLoading(true);
      const stocks = feedService.getAllFeedStocks();
      setFeedStocks(stocks);
    } catch (error) {
      console.error('Error loading feed stocks:', error);
      showNotification('Error loading feed stocks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = (data) => {
    // Reload feed stocks to get latest data
    loadFeedStocks();
    showNotification(`${data.feedStock.feedName} updated successfully`, 'success');
  };

  const handleHistoryUpdate = (data) => {
    // If history modal is open for this feed, refresh the history
    if (showHistoryModal && selectedFeedName === data.feedName) {
      loadStockHistory(selectedFeedName);
    }
  };

  const handleEditFeed = (feedStock) => {
    setEditingFeed(feedStock);
    setUpdateForm({
      quantity: feedStock.availableQuantity.toString(),
      purchasedRate: feedStock.purchasedRate?.toString() || '0',
      price: feedStock.pricePerKg.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingFeed(null);
    setUpdateForm({ quantity: '', purchasedRate: '', price: '' });
  };

  const handleUpdateStock = async () => {
    if (!editingFeed) return;

    try {
      setIsUpdating(true);

      const updates = {};
      const newQuantity = parseFloat(updateForm.quantity);
      const newPurchasedRate = parseFloat(updateForm.purchasedRate);
      const newPrice = parseFloat(updateForm.price);

      if (!isNaN(newQuantity) && newQuantity !== editingFeed.availableQuantity) {
        updates.quantity = newQuantity;
      }

      if (!isNaN(newPurchasedRate) && newPurchasedRate !== (editingFeed.purchasedRate || 0)) {
        updates.purchasedRate = newPurchasedRate;
      }

      if (!isNaN(newPrice) && newPrice !== editingFeed.pricePerKg) {
        updates.price = newPrice;
      }

      if (Object.keys(updates).length === 0) {
        showNotification('No changes to update', 'info');
        handleCancelEdit();
        return;
      }

      // Mock employee data - in real app, get from auth context
      const employeeId = 'emp_001';
      const employeeName = 'John Doe';

      await feedService.updateFeedStock(
        editingFeed.feedName,
        updates,
        employeeId,
        employeeName
      );

      handleCancelEdit();
      showNotification('Feed stock updated successfully', 'success');
    } catch (error) {
      console.error('Error updating feed stock:', error);
      showNotification(error.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleShowHistory = async (feedName) => {
    try {
      setSelectedFeedName(feedName);
      await loadStockHistory(feedName);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading stock history:', error);
      showNotification('Error loading stock history', 'error');
    }
  };

  const loadStockHistory = async (feedName) => {
    const history = feedService.getStockHistory({ feedName });
    setSelectedFeedHistory(history);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getStockStatusColor = (stock) => {
    const quantity = stock.availableQuantity;
    if (quantity === 0) {
      return 'text-red-600 bg-red-50';
    } else if (quantity < 200) {
      return 'text-orange-600 bg-orange-50';
    } else {
      return 'text-green-600 bg-green-50';
    }
  };

  const getStockStatusText = (stock) => {
    const quantity = stock.availableQuantity;
    if (quantity === 0) {
      return 'Out of Stock';
    } else if (quantity < 200) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Feed Stock Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feed Stock Management</h1>
        <p className="text-gray-600">Manage feed inventory quantities and prices with real-time updates</p>
        

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

      {/* Feed Stocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedStocks.map((feedStock) => (
          <div key={feedStock.id} className="bg-white rounded-lg shadow-md border border-gray-200">
            <div className="p-6">
              {/* Feed Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{feedStock.feedName}</h3>
                    <p className="text-sm text-gray-500">{feedStock.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(feedStock)}`}>
                  {getStockStatusText(feedStock)}
                </span>
              </div>

              {/* Stock Information */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Available Quantity:</span>
                  <span className="text-lg font-semibold text-gray-900">{feedStock.availableQuantity} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Purchased Rate:</span>
                  <span className="text-lg font-semibold text-orange-600">Rs.{feedStock.purchasedRate || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Selling Price:</span>
                  <span className="text-lg font-semibold text-green-600">Rs.{feedStock.pricePerKg}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm text-gray-500">
                    {new Date(feedStock.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditFeed(feedStock)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Update Stock
                </button>
                <button
                  onClick={() => handleShowHistory(feedStock.feedName)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <History className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingFeed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update {editingFeed.feedName}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={updateForm.quantity}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter quantity"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchased Rate (Rs./kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={updateForm.purchasedRate}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, purchasedRate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter purchased rate"
                />
                <p className="text-xs text-gray-500 mt-1">Rate at which feed was purchased from supplier</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (Rs./kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={updateForm.price}
                  onChange={(e) => setUpdateForm(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter selling price"
                />
                <p className="text-xs text-gray-500 mt-1">Price shown to farmers when purchasing feed</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStock}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Stock History - {selectedFeedName}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-96">
              {selectedFeedHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No history records found</p>
              ) : (
                <div className="space-y-3">
                  {selectedFeedHistory.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.actionType === 'STOCK_ADDED' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {record.actionType === 'STOCK_ADDED' ? 'Stock Added' : 'Feed Approved'}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            {record.getActionDescription()}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {record.getFormattedTimestamp()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        <p className="font-mono">{record.formula}</p>
                        {record.actionType === 'FEED_APPROVED' && (
                          <p className="text-green-600 mt-1">
                            Total Amount: Rs.{record.getTotalAmount()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}