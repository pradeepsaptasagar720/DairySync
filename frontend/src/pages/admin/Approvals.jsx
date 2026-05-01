import { useEffect, useState } from "react";
import api from "../../services/api";

export default function Approvals() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/pending-users");
      const data = res.data.data || res.data;
      setPendingUsers(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to fetch pending users");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const response = await api.post(`/api/admin/approve/${userId}`);
      
      // Show success message with the generated unique ID
      const { uniqueId } = response.data.data;
      alert(`User approved successfully! Unique ID ${uniqueId} has been assigned.`);
      
      // Remove the approved user from the list
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to approve user");
    }
  };

  const handleReject = async (userId) => {
    if (!confirm("Are you sure you want to reject this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      await api.delete(`/api/admin/reject/${userId}`);
      // Remove the rejected user from the list
      setPendingUsers(pendingUsers.filter(user => user._id !== userId));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to reject user");
    }
  };

  if (loading) return <div className="bg-white p-6 rounded-xl shadow">Loading pending users...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No pending approvals at the moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 border text-left">ID</th>
                <th className="p-3 border text-left">Username</th>
                <th className="p-3 border text-left">Mobile</th>
                <th className="p-3 border text-left">Role</th>
                <th className="p-3 border text-left">Registered</th>
                <th className="p-3 border text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="p-3 border">
                    <span className="font-mono text-sm font-medium text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                      {user.uniqueId || "ID Pending"}
                    </span>
                  </td>
                  <td className="p-3 border">{user.username}</td>
                  <td className="p-3 border">{user.mobile}</td>
                  <td className="p-3 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'farmer' ? 'bg-green-100 text-green-800' :
                      user.role === 'buyer' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 border">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 border">
                    <button 
                      onClick={() => handleApprove(user._id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2 text-sm"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(user._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
