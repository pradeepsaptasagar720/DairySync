import { useState, useEffect } from "react";
import { History, CheckCircle, Clock, Filter, Search, RefreshCw } from "lucide-react";
import { EmployeeService } from "../../services/employee.service";

export default function PaymentHistory() {
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    farmerSearch: '',
    paymentType: 'all',
    status: 'all'
  });

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const fetchPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await EmployeeService.getPaymentHistory({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      
      const payments = response.data.data?.payments || [];
      setPaymentHistory(payments);
    } catch (err) {
      console.error('Error fetching payment history:', err);
      alert('Failed to fetch payment history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    fetchPaymentHistory();
  };

  const handleResetFilter = () => {
    const resetFilters = {
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      farmerSearch: '',
      paymentType: 'all',
      status: 'all'
    };
    setFilters(resetFilters);
    setTimeout(() => fetchPaymentHistory(), 0);
  };

  const filteredHistory = paymentHistory.filter(payment => {
    if (filters.farmerSearch) {
      const searchLower = filters.farmerSearch.toLowerCase();
      const matchesName = payment.farmerName?.toLowerCase().includes(searchLower);
      const matchesMobile = payment.farmerMobile?.includes(filters.farmerSearch);
      if (!matchesName && !matchesMobile) return false;
    }

    if (filters.paymentType !== 'all' && payment.paymentType !== filters.paymentType) {
      return false;
    }

    if (filters.status !== 'all' && payment.status !== filters.status) {
      return false;
    }

    return true;
  });

  const getPaymentTypeClass = (type) => {
    if (type === 'cash') return 'bg-green-100 text-green-800';
    if (type === 'bank_transfer') return 'bg-blue-100 text-blue-800';
    if (type === 'upi') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusClass = (status) => {
    if (status === 'completed') return 'text-green-600';
    if (status === 'pending') return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <History className="text-green-600" size={28} />
              Payment History
            </h1>
            <p className="text-gray-600 mt-1">View and filter all payment transactions</p>
          </div>
          <button
            onClick={fetchPaymentHistory}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-gray-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-700">Filter Payment History</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date From</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📅 Date To</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">🔍 Search Farmer</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Name or mobile..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={filters.farmerSearch}
                onChange={(e) => handleFilterChange('farmerSearch', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">💳 Payment Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={filters.paymentType}
              onChange={(e) => handleFilterChange('paymentType', e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📊 Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApplyFilter}
            disabled={loading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Filter size={16} />
            Apply Date Filter
          </button>
          <button
            onClick={handleResetFilter}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Reset
          </button>
          <div className="ml-auto text-sm text-gray-600 flex items-center">
            Showing {filteredHistory.length} of {paymentHistory.length} payments
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payment history...</p>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Farmer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Payment Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredHistory.map((payment, index) => (
                  <tr key={payment._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">{formatDate(payment.paymentDate || payment.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{payment.farmerName}</div>
                        <div className="text-gray-500 text-xs">{payment.farmerMobile}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-green-600">
                      ₹{payment.amount?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentTypeClass(payment.paymentType)}`}>
                        {payment.paymentType?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 font-medium ${getStatusClass(payment.status)}`}>
                        {payment.status === 'completed' && <CheckCircle size={14} />}
                        {payment.status === 'pending' && <Clock size={14} />}
                        {payment.status !== 'completed' && payment.status !== 'pending' && (
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        )}
                        {payment.status === 'completed' ? 'Completed' : 
                         payment.status === 'pending' ? 'Pending' : 
                         payment.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{payment.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <History size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No payment history found</p>
            <p className="text-sm mt-1">Try adjusting your filters or date range</p>
          </div>
        )}
      </div>
    </div>
  );
}
