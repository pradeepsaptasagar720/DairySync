import { useState, useEffect } from "react";
import { 
  CreditCard, 
  ShoppingBag, 
  FileText,
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from "lucide-react";
import { farmerService } from "../../services/farmer.service";

export default function Reports() {
  const [activeView, setActiveView] = useState('main');
  const [loanData, setLoanData] = useState({ loans: [], summary: {}, loading: true, error: null });
  const [feedData, setFeedData] = useState({ feeds: [], summary: {}, loading: true, error: null });
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    feedType: 'all'
  });

  // Fetch loan history
  const fetchLoanHistory = async () => {
    try {
      setLoanData(prev => ({ ...prev, loading: true, error: null }));
      
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status !== 'all') params.append('status', filters.status);
      params.append('limit', '50');
      
      const response = await farmerService.getLoanHistory(params.toString());
      
      if (response.data.success) {
        setLoanData({
          loans: response.data.data.loans,
          summary: response.data.data.summary,
          loading: false,
          error: null
        });
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch loan history');
      }
    } catch (error) {
      console.error('Error fetching loan history:', error);
      setLoanData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch loan history'
      }));
    }
  };

  // Fetch feed history
  const fetchFeedHistory = async () => {
    try {
      setFeedData(prev => ({ ...prev, loading: true, error: null }));
      
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.feedType !== 'all') params.append('feedType', filters.feedType);
      params.append('limit', '50');
      
      const response = await farmerService.getFeedHistory(params.toString());
      
      if (response.data.success) {
        setFeedData({
          feeds: response.data.data.feeds,
          summary: response.data.data.summary,
          loading: false,
          error: null
        });
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch feed history');
      }
    } catch (error) {
      console.error('Error fetching feed history:', error);
      setFeedData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to fetch feed history'
      }));
    }
  };

  // Load data when view changes
  useEffect(() => {
    if (activeView === 'loan') {
      fetchLoanHistory();
    } else if (activeView === 'feed') {
      fetchFeedHistory();
    }
  }, [activeView, filters]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get status color and icon
  const getStatusDisplay = (status, type = 'loan') => {
    const statusConfig = {
      loan: {
        requested: { color: 'text-yellow-600 bg-yellow-50', icon: Clock, text: 'Requested' },
        approved: { color: 'text-blue-600 bg-blue-50', icon: CheckCircle, text: 'Approved' },
        partially_paid: { color: 'text-orange-600 bg-orange-50', icon: AlertTriangle, text: 'Partially Paid' },
        fully_cleared: { color: 'text-green-600 bg-green-50', icon: CheckCircle, text: 'Fully Cleared' },
        closed: { color: 'text-gray-600 bg-gray-50', icon: XCircle, text: 'Closed' }
      },
      feed: {
        pending: { color: 'text-yellow-600 bg-yellow-50', icon: Clock, text: 'Pending' },
        approved: { color: 'text-blue-600 bg-blue-50', icon: CheckCircle, text: 'Approved' },
        delivered: { color: 'text-green-600 bg-green-50', icon: CheckCircle, text: 'Delivered' },
        cancelled: { color: 'text-red-600 bg-red-50', icon: XCircle, text: 'Cancelled' }
      }
    };

    const config = statusConfig[type][status] || { 
      color: 'text-gray-600 bg-gray-50', 
      icon: Info, 
      text: status 
    };

    return config;
  };

  return (
    <div className="space-y-6">
      {activeView === 'main' && (
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-center mb-8">
            <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
            <p className="text-gray-600">View your loan and feed transaction history</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Loan History Button */}
            <div 
              onClick={() => setActiveView('loan')}
              className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl border-2 border-transparent hover:border-indigo-300 cursor-pointer transition-all duration-200 hover:shadow-lg group"
            >
              <div className="text-center">
                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-700 transition-colors">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Loan History</h3>
                <p className="text-gray-600 mb-4">View all your loan transactions, payments, and status updates</p>
                <div className="text-sm text-indigo-600 font-medium">Click to view details →</div>
              </div>
            </div>
            
            {/* Feed History Button */}
            <div 
              onClick={() => setActiveView('feed')}
              className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-xl border-2 border-transparent hover:border-emerald-300 cursor-pointer transition-all duration-200 hover:shadow-lg group"
            >
              <div className="text-center">
                <div className="bg-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-700 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Feed History</h3>
                <p className="text-gray-600 mb-4">Track all your feed purchases, deliveries, and payment status</p>
                <div className="text-sm text-emerald-600 font-medium">Click to view details →</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'loan' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveView('main')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mr-3"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <CreditCard className="w-8 h-8 text-indigo-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Loan History</h2>
              </div>
              
              {/* Filters */}
              <div className="flex gap-3">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="To Date"
                />
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="approved">Approved</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="fully_cleared">Fully Cleared</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {!loanData.loading && loanData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Requested</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(loanData.summary.totalRequested)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Approved</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(loanData.summary.totalApproved)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Returned</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(loanData.summary.totalReturned)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Due</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(loanData.summary.totalDue)}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {loanData.loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading loan history...</p>
              </div>
            ) : loanData.error ? (
              <div className="p-8 text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4">{loanData.error}</p>
                <button
                  onClick={fetchLoanHistory}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Retry
                </button>
              </div>
            ) : loanData.loans.length === 0 ? (
              <div className="p-8 text-center">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Loan Records Found</h3>
                <p className="text-gray-600">Your loan history will appear here once you have loan transactions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Progress
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loanData.loans.map((loan) => {
                      const statusConfig = getStatusDisplay(loan.status, 'loan');
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={loan._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(loan.requestDate)}
                                </div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">
                                  {loan.purpose}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>Requested: {formatCurrency(loan.requestedAmount)}</div>
                              {loan.approvedAmount && (
                                <div>Approved: {formatCurrency(loan.approvedAmount)}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>Returned: {formatCurrency(loan.totalReturned)}</div>
                              <div className="text-red-600">Due: {formatCurrency(loan.totalDue)}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'feed' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setActiveView('main')}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mr-3"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <ShoppingBag className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Feed History</h2>
              </div>
              
              {/* Filters */}
              <div className="flex gap-3">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="To Date"
                />
                <select
                  value={filters.feedType}
                  onChange={(e) => setFilters(prev => ({ ...prev, feedType: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Feed Types</option>
                  <option value="cattle_feed">Cattle Feed</option>
                  <option value="buffalo_feed">Buffalo Feed</option>
                  <option value="mixed_feed">Mixed Feed</option>
                  <option value="organic_feed">Organic Feed</option>
                  <option value="concentrate">Concentrate</option>
                  <option value="roughage">Roughage</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          {!feedData.loading && feedData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Quantity</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {feedData.summary.totalQuantity} kg
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Amount</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(feedData.summary.totalAmount)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Paid</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(feedData.summary.totalPaid)}
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow">
                <div className="text-sm text-gray-600">Total Due</div>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(feedData.summary.totalDue)}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {feedData.loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading feed history...</p>
              </div>
            ) : feedData.error ? (
              <div className="p-8 text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
                <p className="text-gray-600 mb-4">{feedData.error}</p>
                <button
                  onClick={fetchFeedHistory}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Retry
                </button>
              </div>
            ) : feedData.feeds.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Feed Records Found</h3>
                <p className="text-gray-600">Your feed purchase history will appear here once you have feed transactions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Feed Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity & Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delivery
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feedData.feeds.map((feed) => {
                      const statusConfig = getStatusDisplay(feed.status, 'feed');
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <tr key={feed._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatDate(feed.requestDate)}
                                </div>
                                <div className="text-sm text-gray-500 capitalize">
                                  {feed.feedType.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>{feed.quantity} {feed.unit}</div>
                              <div className="text-gray-500">
                                @ {formatCurrency(feed.pricePerUnit)}/{feed.unit}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig.text}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div>Total: {formatCurrency(feed.totalAmount)}</div>
                              <div className="text-green-600">Paid: {formatCurrency(feed.paidAmount)}</div>
                              {feed.remainingAmount > 0 && (
                                <div className="text-red-600">Due: {formatCurrency(feed.remainingAmount)}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {feed.deliveredDate ? (
                                <div className="text-green-600">
                                  Delivered: {formatDate(feed.deliveredDate)}
                                </div>
                              ) : feed.deliveryDate ? (
                                <div className="text-blue-600">
                                  Expected: {formatDate(feed.deliveryDate)}
                                </div>
                              ) : (
                                <div className="text-gray-500">Not scheduled</div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}