import { useState, useEffect } from "react";
import { Calendar, Clock, Filter, History, Milk, TrendingUp, Eye, ChevronLeft, ChevronRight, Search } from "lucide-react";
import api from "../../services/api";

export default function MilkHistory() {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    session: 'both',
    milkType: 'both',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchMilkHistory();
  }, [filters]);

  const fetchMilkHistory = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.session !== 'both') params.append('session', filters.session);
      if (filters.milkType !== 'both') params.append('milkType', filters.milkType);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());

      const response = await api.get(`/api/farmer/milk-history?${params}`);
      setHistoryData(response.data.data);
    } catch (err) {
      console.error('Error fetching milk history:', err);
      setError(err.response?.data?.error?.message || 'Failed to load milk history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      session: 'both',
      milkType: 'both',
      page: 1,
      limit: 10
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getSessionIcon = (session) => {
    return session === 'Morning' ? '🌅' : '🌆';
  };

  const getSessionColor = (session) => {
    return session === 'Morning' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading milk history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchMilkHistory}
          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <History size={32} />
          Milk History
        </h1>
        <p className="text-blue-100">View your complete milk collection history with detailed filters</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Filter className="text-blue-600" size={24} />
          Filter Options
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date From
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 Date To
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🕐 Session
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.session}
              onChange={(e) => handleFilterChange('session', e.target.value)}
            >
              <option value="both">Both Sessions</option>
              <option value="Morning">Morning Only</option>
              <option value="Evening">Evening Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🥛 Milk Type
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.milkType}
              onChange={(e) => handleFilterChange('milkType', e.target.value)}
            >
              <option value="both">Both Types</option>
              <option value="cow">Cow Milk Only</option>
              <option value="buffalo">Buffalo Milk Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearFilters}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Search size={16} />
            Clear Filters
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show:</span>
            <select
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {historyData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-2xl">🐄</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cow Milk</p>
                <p className="text-xl font-bold text-blue-600">
                  {historyData.summary.cowMilkTotal.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <span className="text-2xl">🐃</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Buffalo Milk</p>
                <p className="text-xl font-bold text-orange-600">
                  {historyData.summary.buffaloMilkTotal.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-green-600">
                  ₹{historyData.summary.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Milk className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-xl font-bold text-purple-600">
                  {historyData.summary.entryCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milk History Entries */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <History className="text-blue-600" size={24} />
            Milk Collection History
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            {historyData?.pagination ? 
              `Showing ${((historyData.pagination.page - 1) * historyData.pagination.limit) + 1}-${Math.min(historyData.pagination.page * historyData.pagination.limit, historyData.pagination.total)} of ${historyData.pagination.total} entries` :
              'Complete history of your milk collections'
            }
          </p>
        </div>

        <div className="p-6">
          {!historyData?.entries || historyData.entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Milk History Found</h3>
              <p className="text-gray-600">
                {filters.dateFrom || filters.dateTo || filters.session !== 'both' || filters.milkType !== 'both' ?
                  'No milk entries found for the selected filters. Try adjusting your search criteria.' :
                  'You don\'t have any milk collection history yet. Your entries will appear here after milk collection.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyData.entries.map((entry, index) => (
                <div key={entry._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSessionIcon(entry.session)}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionColor(entry.session)}`}>
                            {entry.session} Session
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar size={14} />
                            <span>{formatDate(entry.date)}</span>
                            <Clock size={14} className="ml-2" />
                            <span>{formatTime(entry.time)}</span>
                          </div>
                          <p>
                            Collected by: {entry.collectedByName} ({entry.collectedByUniqueId})
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ₹{entry.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount</p>
                    </div>
                  </div>

                  {/* Milk Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cow Milk */}
                    {entry.cow && entry.cow.quantity > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🐄</span>
                          <span className="font-medium text-blue-800">Cow Milk</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{entry.cow.quantity.toFixed(1)}L</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fat:</span>
                            <span className="font-medium">{entry.cow.fat.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span className="font-medium">₹{entry.cow.rate.toFixed(2)}/L</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Amount:</span>
                            <span className="font-bold text-blue-600">₹{entry.cow.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Buffalo Milk */}
                    {entry.buffalo && entry.buffalo.quantity > 0 && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🐃</span>
                          <span className="font-medium text-orange-800">Buffalo Milk</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{entry.buffalo.quantity.toFixed(1)}L</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fat:</span>
                            <span className="font-medium">{entry.buffalo.fat.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span className="font-medium">₹{entry.buffalo.rate.toFixed(2)}/L</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Amount:</span>
                            <span className="font-bold text-orange-600">₹{entry.buffalo.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Entry Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                    <span>Entry #{((historyData.pagination.page - 1) * historyData.pagination.limit) + index + 1}</span>
                    <span>Receipt Generated: {entry.receiptGenerated ? '✅ Yes' : '❌ No'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {historyData?.pagination && historyData.pagination.pages > 1 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Page {historyData.pagination.page} of {historyData.pagination.pages}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(historyData.pagination.page - 1)}
                  disabled={historyData.pagination.page <= 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, historyData.pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg ${
                          pageNum === historyData.pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(historyData.pagination.page + 1)}
                  disabled={historyData.pagination.page >= historyData.pagination.pages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">About Milk History</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• This page shows your complete milk collection history</li>
              <li>• Entries from "Today Milk Status" automatically move here after midnight</li>
              <li>• Use filters to find specific entries by date, session, or milk type</li>
              <li>• All data is read-only and maintained for your records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
