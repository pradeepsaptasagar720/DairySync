import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, XCircle, Package, Search, Filter, ArrowLeft } from "lucide-react";
import api from "../../../services/api";

export default function DeliveryHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  });

  useEffect(() => {
    fetchHistory();
  }, [pagination.page, searchTerm, statusFilter, dateFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = { 
        page: pagination.page, 
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        startDate: dateFilter.startDate || undefined,
        endDate: dateFilter.endDate || undefined
      };
      
      const response = await api.get('/api/delivery/history', { params });
      setHistory(response.data.data.deliveries);
      setPagination(prev => ({ ...prev, ...response.data.data.pagination }));
    } catch (err) {
      console.error('Failed to fetch delivery history:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'Pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Approved':
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setDateFilter({ startDate: "", endDate: "" });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-xl">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">📋 My Delivery History</h1>
        </div>
        <p className="text-indigo-100 ml-14">Track your completed deliveries and performance</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by buyer name, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            placeholder="Start Date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />

          <input
            type="date"
            placeholder="End Date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Clear Filters */}
        {(searchTerm || statusFilter !== "all" || dateFilter.startDate || dateFilter.endDate) && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* History Cards for Mobile, Table for Desktop */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {/* Mobile Cards View */}
        <div className="block lg:hidden">
          {history.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Delivery History</h3>
              <p className="text-gray-600">No deliveries found matching your criteria.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {history.map((delivery) => (
                <div key={delivery._id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        {getStatusIcon(delivery.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {delivery.buyer?.username || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {delivery.buyer?.mobile || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                      {delivery.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <p className="font-medium">{delivery.quantity}L</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-medium">₹{(delivery.totalAmount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{new Date(delivery.updatedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Milk Type:</span>
                      <p className="font-medium capitalize">{delivery.milkType || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Milk Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No Delivery History</h3>
                      <p className="text-gray-600">No deliveries found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  history.map((delivery) => (
                    <tr key={delivery._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {delivery.buyer?.username || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {delivery.buyer?.mobile || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">
                            {delivery.milkType === "cow" ? "🐄" : delivery.milkType === "buffalo" ? "🐃" : "🥛"}
                          </span>
                          <span className="text-sm text-gray-900 capitalize">{delivery.milkType || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {delivery.quantity}L
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(delivery.status)}
                          <span className="ml-2 text-sm text-gray-900">{delivery.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(delivery.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(delivery.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {history.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}