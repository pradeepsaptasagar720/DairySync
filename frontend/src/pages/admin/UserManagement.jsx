import { useState, useEffect } from "react";
import { AdminService } from "../../services/admin.service";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [summary, setSummary] = useState({
    farmers: { approved: 0, pending: 0, total: 0 },
    buyers: { approved: 0, pending: 0, total: 0 },
    employees: { approved: 0, pending: 0, total: 0 }
  });
  const [assigningIds, setAssigningIds] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, approvalFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (roleFilter !== "all") params.role = roleFilter;
      if (approvalFilter !== "all") params.approved = approvalFilter === "approved";
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await AdminService.getAllUsers(params);
      const data = response.data.data;

      setUsers(data.users);
      setPagination(data.pagination);
      setSummary(data.summary);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUniqueIds = async () => {
    if (!confirm("This will assign unique IDs to all approved users who don't have one. Continue?")) {
      return;
    }

    try {
      setAssigningIds(true);
      const response = await AdminService.assignUniqueIds();
      const { assignedCount, totalProcessed } = response.data.data;
      
      alert(`Successfully assigned unique IDs to ${assignedCount} out of ${totalProcessed} users.`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to assign unique IDs");
    } finally {
      setAssigningIds(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await AdminService.approveUser(userId);
      const { uniqueId } = response.data.data;
      alert(`User approved successfully! Unique ID ${uniqueId} has been assigned.`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to approve user");
    }
  };

  const handleReject = async (userId) => {
    if (!confirm("Are you sure you want to reject this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      await AdminService.rejectUser(userId);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to reject user");
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'farmer': return 'bg-green-100 text-green-800';
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (approved) => {
    return approved 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">👥 User Management</h1>
        <p className="text-indigo-100">Manage all farmers, buyers, and employees with unique ID system</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👨‍🌾</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Farmers</h3>
              <p className="text-sm text-gray-600">Agricultural producers</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Approved:</span>
              <span className="font-medium text-green-600">{summary.farmers.approved}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-medium text-yellow-600">{summary.farmers.pending}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{summary.farmers.total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🛍️</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Buyers</h3>
              <p className="text-sm text-gray-600">Milk consumers</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Approved:</span>
              <span className="font-medium text-green-600">{summary.buyers.approved}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-medium text-yellow-600">{summary.buyers.pending}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{summary.buyers.total}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👨‍💼</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Employees</h3>
              <p className="text-sm text-gray-600">Dairy staff</p>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Approved:</span>
              <span className="font-medium text-green-600">{summary.employees.approved}</span>
            </div>
            <div className="flex justify-between">
              <span>Pending:</span>
              <span className="font-medium text-yellow-600">{summary.employees.pending}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{summary.employees.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by username, unique ID, mobile, or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="farmer">Farmers</option>
            <option value="buyer">Buyers</option>
            <option value="employee">Employees</option>
          </select>

          {/* Approval Filter */}
          <select
            value={approvalFilter}
            onChange={(e) => {
              setApprovalFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
          </select>

          {/* Assign IDs Button */}
          <button
            onClick={handleAssignUniqueIds}
            disabled={assigningIds}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {assigningIds ? "Assigning..." : "Assign IDs"}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Users Found</h2>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== "all" || approvalFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No users have been registered yet."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-mono text-sm font-bold px-3 py-1 rounded-full ${
                          user.uniqueId 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.uniqueId || "ID Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user._id.slice(-8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.mobile}</div>
                        <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.approved)}`}>
                          {user.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {!user.approved ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(user._id)}
                              className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(user._id)}
                              className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      {[...Array(pagination.pages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => handlePageChange(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === i + 1
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
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
          </>
        )}
      </div>
    </div>
  );
}