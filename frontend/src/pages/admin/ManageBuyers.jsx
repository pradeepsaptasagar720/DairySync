import { useState, useEffect } from "react";
import { adminService } from "../../services/admin.service";

export default function ManageBuyers() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchBuyers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        fetchBuyers(true); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const fetchBuyers = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await adminService.getComprehensiveUserData({ role: "buyer" });
      setBuyers(response.data.users || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await adminService.approveUser(userId);
      fetchBuyers(); // Refresh the list
    } catch (err) {
      alert("Failed to approve user: " + err.message);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this buyer? This action cannot be undone.")) {
      return;
    }
    
    try {
      await adminService.rejectUser(userId);
      fetchBuyers(); // Refresh the list
    } catch (err) {
      alert("Failed to reject user: " + err.message);
    }
  };

  // Enhanced search functionality
  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = 
      buyer.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.mobile?.includes(searchTerm) ||
      buyer.uniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buyer.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "approved" && buyer.approved) ||
                         (filterStatus === "pending" && !buyer.approved);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBuyers = filteredBuyers.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading buyers: {error}</p>
        <button 
          onClick={fetchBuyers}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Buyers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()} 
            {autoRefresh && <span className="ml-2 text-green-600">● Auto-refresh ON</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm rounded ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {autoRefresh ? '● Auto-refresh' : '○ Manual'}
          </button>
          <button 
            onClick={() => fetchBuyers()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Real-time Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Buyers</h3>
          <p className="text-3xl font-bold text-gray-900">{buyers.length}</p>
          <p className="text-sm text-gray-600 mt-1">All registered buyers</p>
          <div className="mt-2 text-xs text-blue-600">
            🔄 Real-time count
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{buyers.filter(b => b.approved).length}</p>
          <p className="text-sm text-gray-600 mt-1">Active buyers</p>
          <div className="mt-2 text-xs text-green-600">
            ✅ {((buyers.filter(b => b.approved).length / buyers.length) * 100 || 0).toFixed(1)}% approval rate
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-orange-600">{buyers.filter(b => !b.approved).length}</p>
          <p className="text-sm text-gray-600 mt-1">Awaiting approval</p>
          <div className="mt-2 text-xs text-orange-600">
            ⏳ Need admin action
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500 mb-2">With Orders</h3>
          <p className="text-3xl font-bold text-purple-600">
            {buyers.filter(b => b.buyerData?.orders?.totalOrders > 0).length}
          </p>
          <p className="text-sm text-gray-600 mt-1">Have placed orders</p>
          <div className="mt-2 text-xs text-purple-600">
            🛒 Total: {buyers.reduce((sum, b) => sum + (b.buyerData?.orders?.totalOrders || 0), 0)} orders
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Buyers
            </label>
            <input
              type="text"
              placeholder="Search by name, mobile, email, ID, or address..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1); // Reset to first page when filtering
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>
        
        {/* Search Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          {searchTerm && (
            <p>
              Showing {filteredBuyers.length} result{filteredBuyers.length !== 1 ? 's' : ''} 
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          )}
        </div>
      </div>

      {/* Buyers List */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">
            Buyers List ({filteredBuyers.length} total, showing {paginatedBuyers.length})
          </h3>
        </div>
        
        {filteredBuyers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {buyers.length === 0 ? (
              <div>
                <p className="text-lg mb-2">No buyers found</p>
                <p>No buyers have registered yet.</p>
              </div>
            ) : (
              <div>
                <p className="text-lg mb-2">No buyers match your search</p>
                <p>Try adjusting your search terms or filters.</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBuyers.map((buyer) => (
                    <tr key={buyer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{buyer.username}</div>
                          {buyer.uniqueId && (
                            <div className="text-sm text-gray-500">ID: {buyer.uniqueId}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{buyer.mobile}</div>
                        {buyer.email && (
                          <div className="text-sm text-gray-500">{buyer.email}</div>
                        )}
                        {buyer.address && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">{buyer.address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Orders: {buyer.buyerData?.orders?.totalOrders || 0}
                        </div>
                        <div className="text-sm text-gray-500">
                          Quantity: {buyer.buyerData?.orders?.totalQuantity || 0}L
                        </div>
                        <div className="text-sm text-gray-500">
                          Amount: ₹{buyer.buyerData?.orders?.totalAmount || 0}
                        </div>
                        {buyer.buyerData?.orders?.lastOrder && (
                          <div className="text-xs text-blue-600 mt-1">
                            Last: {new Date(buyer.buyerData.orders.lastOrder).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          buyer.approved 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {buyer.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(buyer.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!buyer.approved ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(buyer._id)}
                              className="text-green-600 hover:text-green-900 px-2 py-1 rounded border border-green-300 hover:bg-green-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(buyer._id)}
                              className="text-red-600 hover:text-red-900 px-2 py-1 rounded border border-red-300 hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Approved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredBuyers.length)} of {filteredBuyers.length} results
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
