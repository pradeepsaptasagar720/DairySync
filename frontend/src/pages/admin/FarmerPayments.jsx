// src/pages/admin/FarmerPayments.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, User, FileText, Download, Printer, Filter, Receipt, IndianRupee, Milk, CreditCard, History, CheckCircle, Clock } from "lucide-react";
import { AdminService } from "../../services/admin.service";

export default function FarmerPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [milkType, setMilkType] = useState("all");
  const [lastBillInfo, setLastBillInfo] = useState(null);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalFarmers: 0,
    totalLiters: 0
  });
  
  // Real-time update states
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [newPaymentsCount, setNewPaymentsCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected', 'disconnected', 'connecting'
  const intervalRef = useRef(null);
  const lastPaymentCountRef = useRef(0);

  useEffect(() => {
    fetchPayments();
    
    // Set up real-time updates
    if (isRealTimeEnabled) {
      startRealTimeUpdates();
    }
    
    // Set up cross-tab communication listeners
    const handleStorageChange = (e) => {
      if (e.key === 'recentPayments' && e.newValue) {
        // New payment was processed in another tab
        const recentPayments = JSON.parse(e.newValue);
        if (recentPayments.length > 0) {
          const latestPayment = recentPayments[0];
          showNewPaymentNotification(1, `New payment: ₹${latestPayment.amount} from ${latestPayment.farmerName}`);
          // Trigger immediate refresh
          setTimeout(() => fetchPayments(), 1000);
        }
      }
    };

    const handleNewPaymentEvent = (e) => {
      const paymentData = e.detail;
      showNewPaymentNotification(1, `New payment: ₹${paymentData.amount} from ${paymentData.farmerName}`);
      // Trigger immediate refresh
      setTimeout(() => fetchPayments(), 1000);
    };

    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for same-tab events
    window.addEventListener('newPaymentProcessed', handleNewPaymentEvent);
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('newPaymentProcessed', handleNewPaymentEvent);
    };
  }, []);

  // Effect to handle real-time toggle
  useEffect(() => {
    if (isRealTimeEnabled) {
      startRealTimeUpdates();
    } else {
      stopRealTimeUpdates();
    }
  }, [isRealTimeEnabled]);

  const startRealTimeUpdates = () => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setConnectionStatus('connecting');
    
    // Set up polling every 5 seconds for more responsive updates
    intervalRef.current = setInterval(() => {
      fetchPaymentsForRealTime();
    }, 5000);
    
    // Initial fetch to establish connection
    fetchPaymentsForRealTime();
  };

  const stopRealTimeUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  const fetchPaymentsForRealTime = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Build current query parameters
      const queryParams = {};
      if (dateFrom) queryParams.dateFrom = dateFrom;
      if (dateTo) queryParams.dateTo = dateTo;
      if (milkType && milkType !== 'all') queryParams.milkType = milkType;
      if (filterStatus && filterStatus !== 'all') queryParams.status = filterStatus;
      
      const response = await AdminService.getFarmerPayments(queryParams);
      const data = response.data.data;
      
      // Check if there are new payments
      const currentPaymentCount = data.payments?.length || 0;
      const previousCount = lastPaymentCountRef.current;
      
      if (currentPaymentCount > previousCount) {
        setNewPaymentsCount(currentPaymentCount - previousCount);
        // Show notification for new payments
        showNewPaymentNotification(currentPaymentCount - previousCount);
      }
      
      // Check for changes in payment data (not just count)
      const currentPaymentIds = new Set(data.payments?.map(p => p._id) || []);
      const previousPaymentIds = new Set(payments.map(p => p._id));
      
      // Find truly new payments (not just different count)
      const newPaymentIds = [...currentPaymentIds].filter(id => !previousPaymentIds.has(id));
      
      if (newPaymentIds.length > 0 && previousPaymentIds.size > 0) {
        // There are genuinely new payments
        const newPayments = data.payments?.filter(p => newPaymentIds.includes(p._id)) || [];
        if (newPayments.length > 0) {
          const latestPayment = newPayments[0];
          showNewPaymentNotification(
            newPayments.length, 
            `New payment: ₹${latestPayment.amount} from ${latestPayment.farmerName}`
          );
        }
      }
      
      // Update data
      setPayments(data.payments || []);
      setLastBillInfo(data.lastBillInfo || null);
      setSummary({
        totalAmount: data.summary?.totalAmount || 0,
        totalFarmers: data.payments?.length || 0,
        totalLiters: data.summary?.totalLiters || 0
      });
      
      setLastUpdateTime(new Date());
      lastPaymentCountRef.current = currentPaymentCount;
      setConnectionStatus('connected');
      
    } catch (err) {
      console.error('Real-time update failed:', err);
      setConnectionStatus('disconnected');
      // Don't show error for background updates
    }
  };

  const showNewPaymentNotification = (count, customMessage = null) => {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span>${customMessage || `${count} new payment${count > 1 ? 's' : ''} received!`}</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 500);
      }
      setNewPaymentsCount(0);
    }, 4000);
  };

  const fetchPayments = async (filters = {}) => {
    setLoading(true);
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in as admin to view farmer payments');
        return;
      }
      
      // Build query parameters object
      const queryParams = {};
      if (filters.dateFrom) queryParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) queryParams.dateTo = filters.dateTo;
      if (filters.milkType && filters.milkType !== 'all') queryParams.milkType = filters.milkType;
      if (filters.status && filters.status !== 'all') queryParams.status = filters.status;
      
      const response = await AdminService.getFarmerPayments(queryParams);
      const data = response.data.data;
      
      // Check if no payments found for the selected criteria
      if (filters.dateFrom || filters.dateTo || (filters.milkType && filters.milkType !== 'all') || (filters.status && filters.status !== 'all')) {
        if (!data.payments || data.payments.length === 0) {
          setValidationMessage("No bills found for the selected date range and criteria. Please select a proper date range or check if bills were generated by milk collectors.");
          setShowValidationPopup(true);
          setPayments([]);
          setSummary({
            totalAmount: 0,
            totalFarmers: 0,
            totalLiters: 0
          });
          return;
        }
      }
      
      setPayments(data.payments || []);
      setLastBillInfo(data.lastBillInfo || null);
      
      // Update summary with real data
      setSummary({
        totalAmount: data.summary?.totalAmount || 0,
        totalFarmers: data.payments?.length || 0,
        totalLiters: data.summary?.totalLiters || 0
      });
      
      // Update real-time tracking
      lastPaymentCountRef.current = data.payments?.length || 0;
      setLastUpdateTime(new Date());
      
    } catch (err) {
      console.error('Error fetching farmer payments:', err);
      
      if (err.response?.status === 401) {
        alert('Authentication failed. Please log in as admin.');
        navigate('/login');
      } else if (err.response?.status === 403) {
        alert('Access denied. Admin privileges required.');
        navigate('/login');
      } else {
        setValidationMessage("Failed to fetch farmer payments. Please try again or check if bills were generated for the selected period.");
        setShowValidationPopup(true);
      }
      
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    // Validate date range
    if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
      setValidationMessage("Invalid date range. 'From' date cannot be later than 'To' date. Please select a proper date range.");
      setShowValidationPopup(true);
      return;
    }
    
    // Apply filters
    fetchPayments({
      dateFrom,
      dateTo,
      milkType,
      status: filterStatus
    });
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setMilkType("all");
    setFilterStatus("all");
    fetchPayments();
  };

  const closeValidationPopup = () => {
    setShowValidationPopup(false);
    setValidationMessage("");
  };

  // Helper function to check if payment is recent (within last 30 seconds)
  const isRecentPayment = (paymentDate) => {
    const now = new Date();
    const payment = new Date(paymentDate);
    const diffInSeconds = (now - payment) / 1000;
    return diffInSeconds <= 30;
  };

  // Since we removed search functionality, just return all payments
  const filteredPayments = payments;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || statusClasses.completed}`;
  };

  const printBill = () => {
    window.print();
  };

  const downloadBill = () => {
    // This would integrate with a PDF library like jsPDF
    alert('PDF download functionality will be implemented');
  };

  return (
    <div className="space-y-6">
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
        
        .animate-fadeOut {
          animation: fadeOut 0.5s ease-out forwards;
        }
      `}</style>

      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center mb-3">
              <Link to="/admin/payments" className="text-green-100 hover:text-white mr-4">
                ← Back to Payments
              </Link>
            </div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Receipt size={32} />
              Amount Paid to Farmers - Bills & Records
            </h1>
            <p className="text-green-100">View detailed payment bills exactly as generated by milk collectors</p>
          </div>
          
          {/* Real-time Status Indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' && isRealTimeEnabled 
                  ? 'bg-green-300 animate-pulse' 
                  : connectionStatus === 'connecting' 
                  ? 'bg-yellow-300 animate-spin' 
                  : 'bg-gray-300'
              }`}></div>
              <span className="text-sm text-green-100">
                {connectionStatus === 'connected' && isRealTimeEnabled 
                  ? 'Live Updates' 
                  : connectionStatus === 'connecting' 
                  ? 'Connecting...' 
                  : connectionStatus === 'disconnected' && isRealTimeEnabled
                  ? 'Reconnecting...'
                  : 'Manual Refresh'}
              </span>
            </div>
            
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                isRealTimeEnabled 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {isRealTimeEnabled ? 'Disable Live' : 'Enable Live'}
            </button>
            
            <button
              onClick={() => fetchPayments()}
              className="px-3 py-1 text-xs bg-white/20 text-white rounded-full font-medium hover:bg-white/30 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          {/* Last Update Time */}
          <div className="text-xs text-green-100">
            Last updated: {lastUpdateTime.toLocaleTimeString()}
          </div>
          
          {/* New Payments Indicator */}
          {newPaymentsCount > 0 && (
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium animate-bounce">
              +{newPaymentsCount} new
            </div>
          )}
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Filter className="text-green-600" size={24} />
          Filter Payment Bills
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date From
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date To
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🥛 Milk Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={milkType}
              onChange={(e) => setMilkType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="cow">Cow Milk</option>
              <option value="buffalo">Buffalo Milk</option>
              <option value="mixed">Mixed Milk</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 Payment Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleFilterApply}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Filter size={16} />
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Last Bill Info */}
      {lastBillInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">📋 Last Bill Generated</h3>
          
          {/* Date Range */}
          {lastBillInfo.dateFrom && lastBillInfo.dateTo && (
            <div className="mb-2">
              <p className="text-xs text-blue-600 mb-1">Period:</p>
              <p className="text-sm font-medium text-blue-900">
                {formatDate(lastBillInfo.dateFrom)} - {formatDate(lastBillInfo.dateTo)}
              </p>
            </div>
          )}
          
          {/* Generation Date */}
          <div className="mb-2">
            <p className="text-xs text-blue-600 mb-1">Generated on:</p>
            <p className="text-sm font-medium text-blue-900">
              {formatDate(lastBillInfo.generatedDate)}
            </p>
          </div>
          
          {/* Collector Info */}
          <div>
            <p className="text-xs text-blue-600 mb-1">by Milk Collector:</p>
            <p className="text-sm font-semibold text-blue-900">
              {lastBillInfo.collectorName}
            </p>
            {lastBillInfo.collectorId && (
              <p className="text-xs text-blue-700">ID: {lastBillInfo.collectorId}</p>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Amount Paid</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Farmers</h3>
          <p className="text-2xl font-bold text-blue-600">{summary.totalFarmers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Liters</h3>
          <p className="text-2xl font-bold text-purple-600">
            {summary.totalLiters ? summary.totalLiters.toLocaleString() : 0} L
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Payment Bills Display */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {/* Bill Header */}
            <div className="bg-green-50 p-4 border-b">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-xl font-bold text-green-800 mb-1">
                    🥛 Dairy Management System
                  </h2>
                  <p className="text-green-600 text-sm">Amount Paid to Farmers - Admin View</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-600">View Date: {formatDate(new Date())}</p>
                  {dateFrom && dateTo && (
                    <p className="text-gray-600">Period: {formatDate(dateFrom)} to {formatDate(dateTo)}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={printBill}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Printer size={14} />
                  Print
                </button>
                <button
                  onClick={downloadBill}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Download size={14} />
                  PDF
                </button>
              </div>
            </div>

            {/* Bill Content */}
            <div className="p-4">
              {filteredPayments.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Amount Paid to Farmers</h3>
                  
                  {filteredPayments.map((payment, index) => (
                    <div key={payment._id} className={`border border-gray-200 rounded-lg p-4 mb-4 ${
                      isRecentPayment(payment.paymentDate) 
                        ? 'bg-green-50 border-l-4 border-green-400 animate-pulse' 
                        : ''
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h4 className="font-semibold text-base">{payment.farmerName}</h4>
                          <p className="text-xs text-gray-600">
                            ID: {payment.farmer?.uniqueId || 'N/A'} | Mobile: {payment.farmerMobile}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-base font-bold text-green-600">₹{payment.amount.toLocaleString()}</p>
                            <p className="text-xs text-gray-600">{formatDate(payment.paymentDate)}</p>
                          </div>
                          <span className={getStatusBadge(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                          {isRecentPayment(payment.paymentDate) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Milk Type Summary - Matching Collector's Bill Structure */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {/* Cow Milk */}
                        {payment.cowMilkAmount > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🐄</span>
                              <h5 className="font-semibold text-base text-blue-800">Cow Milk</h5>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><strong>Amount:</strong> <span className="font-bold text-blue-600">₹{payment.cowMilkAmount.toLocaleString()}</span></p>
                            </div>
                          </div>
                        )}

                        {/* Buffalo Milk */}
                        {payment.buffaloMilkAmount > 0 && (
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">🐃</span>
                              <h5 className="font-semibold text-base text-orange-800">Buffalo Milk</h5>
                            </div>
                            <div className="text-sm space-y-1">
                              <p><strong>Amount:</strong> <span className="font-bold text-orange-600">₹{payment.buffaloMilkAmount.toLocaleString()}</span></p>
                            </div>
                          </div>
                        )}

                        {/* Total Summary */}
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💰</span>
                            <h5 className="font-semibold text-base text-green-800">Total Payment</h5>
                          </div>
                          <div className="text-sm space-y-1">
                            <p><strong>Amount:</strong> <span className="font-bold text-green-600">₹{payment.amount.toLocaleString()}</span></p>
                            <p><strong>Type:</strong> {payment.paymentType?.replace('_', ' ').toUpperCase()}</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-sm font-medium text-gray-800 mb-2">📋 Payment Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p><strong>Reference:</strong> {payment.referenceNumber}</p>
                            <p><strong>Payment Type:</strong> {payment.paymentType?.replace('_', ' ').toUpperCase()}</p>
                            <p><strong>Milk Type:</strong> {
                              payment.milkType === 'mixed' ? (
                                <span className="flex items-center gap-1">
                                  <span className="px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">🐄 Cow</span>
                                  <span className="px-1 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">🐃 Buffalo</span>
                                </span>
                              ) : (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  payment.milkType === 'cow' ? 'bg-blue-100 text-blue-800' :
                                  payment.milkType === 'buffalo' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {payment.milkType === 'cow' ? '🐄 Cow' :
                                   payment.milkType === 'buffalo' ? '🐃 Buffalo' :
                                   '🥛 Mixed'}
                                </span>
                              )
                            }</p>
                          </div>
                          <div>
                            <p><strong>Processed By:</strong> {payment.processedBy?.username || 'N/A'}</p>
                            <p><strong>Collector ID:</strong> {payment.processedBy?.uniqueId || 'N/A'}</p>
                            {payment.notes && <p><strong>Notes:</strong> {payment.notes}</p>}
                          </div>
                        </div>

                        {/* Bill Period */}
                        {payment.billPeriod && (payment.billPeriod.dateFrom || payment.billPeriod.dateTo) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm"><strong>Bill Period:</strong> 
                              {payment.billPeriod.dateFrom && formatDate(payment.billPeriod.dateFrom)}
                              {payment.billPeriod.dateFrom && payment.billPeriod.dateTo && ' - '}
                              {payment.billPeriod.dateTo && formatDate(payment.billPeriod.dateTo)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 mt-3">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                          View Details
                        </button>
                        <button className="text-green-600 hover:text-green-900 text-sm font-medium px-3 py-1 rounded hover:bg-green-50 transition-colors">
                          Download Receipt
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-1 rounded hover:bg-gray-50 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Grand Total */}
                  <div className="border-t-2 border-green-600 pt-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-600">Total Payments</p>
                          <p className="text-lg font-bold text-green-600">{filteredPayments.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Cow Milk Total</p>
                          <p className="text-lg font-bold text-blue-600">
                            ₹{filteredPayments.reduce((sum, p) => sum + (p.cowMilkAmount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Buffalo Milk Total</p>
                          <p className="text-lg font-bold text-orange-600">
                            ₹{filteredPayments.reduce((sum, p) => sum + (p.buffaloMilkAmount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Grand Total</p>
                          <p className="text-xl font-bold text-green-600">
                            ₹{filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📊</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">No Payment Bills Found</h2>
                  <p className="text-gray-600">
                    No farmer payment bills found for the selected criteria. Try adjusting your filters or check if bills have been generated by milk collectors.
                  </p>
                </div>
              )}
            </div>

            {/* Bill Footer */}
            <div className="bg-gray-50 p-3 border-t text-center text-xs text-gray-600">
              <p>This is a computer-generated report. All amounts are as recorded by milk collectors.</p>
              <p>Generated on: {new Date().toLocaleString('en-IN')}</p>
            </div>
          </div>
        </>
      )}

      {/* Validation Popup Modal */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Invalid Selection</h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">{validationMessage}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={closeValidationPopup}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}