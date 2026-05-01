import { useState, useEffect } from "react";
import api from "../../services/api";

export default function ManageFarmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState({
    approved: 0,
    pending: 0,
    total: 0
  });

  useEffect(() => {
    fetchFarmers();
  }, [searchTerm, pagination.page]);

  const fetchFarmers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await api.get("/api/employee/farmers", { params });
      const data = res.data.data;
      
      setFarmers(data.farmers || []);
      setPagination(data.pagination || pagination);
      setStats(data.stats || stats);
    } catch (err) {
      console.error("Error fetching farmers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading farmers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">👨‍🌾 Manage Farmers</h1>
        <p className="text-green-100">View and manage all registered farmers with unique ID system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600">{stats.approved}</h3>
              <p className="text-sm text-gray-600">Approved Farmers</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
              <p className="text-sm text-gray-600">Pending Approval</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👨‍🌾</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-600">{stats.total}</h3>
              <p className="text-sm text-gray-600">Total Farmers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search farmers by name, mobile, unique ID, or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg font-medium">
              Showing: {farmers.length}
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-medium">
              Page: {pagination.page} of {pagination.pages}
            </div>
          </div>
        </div>
      </div>

      {/* Farmers List */}
      {farmers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">👨‍🌾</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {searchTerm ? "No Farmers Found" : "No Farmers Registered"}
          </h2>
          <p className="text-gray-600">
            {searchTerm 
              ? "Try adjusting your search terms." 
              : "No farmers have been registered and approved yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmers.map((farmer) => (
              <div key={farmer._id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">👨‍🌾</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{farmer.username}</h3>
                    <p className="text-sm font-mono font-bold text-green-600">
                      ID: {farmer.uniqueId || "ID Pending"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📱 Mobile:</span>
                    <span className="font-medium">{farmer.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📧 Email:</span>
                    <span className="font-medium text-xs">{farmer.email || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📅 Joined:</span>
                    <span className="font-medium">
                      {new Date(farmer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">✅ Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      farmer.approved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {farmer.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                      View Details
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white p-4 rounded-xl shadow">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} farmers
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                    {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
  );
}