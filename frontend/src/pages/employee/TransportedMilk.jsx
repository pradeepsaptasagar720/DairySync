import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Truck, Droplet, IndianRupee, Calendar, Edit2, Save, X, Filter, ArrowLeft, AlertTriangle, History, Eye } from "lucide-react";

export default function TransportedMilk() {
  const navigate = useNavigate();
  
  const [transportData, setTransportData] = useState(null);
  const [transportHistory, setTransportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [editingToday, setEditingToday] = useState(false);
  const [editData, setEditData] = useState({});
  const [isDairyOpen, setIsDairyOpen] = useState(true);
  
  // Filter states for history
  const [historyFilters, setHistoryFilters] = useState({
    startDate: "",
    endDate: "",
    milkType: "all", // all, cow, buffalo
    status: "all" // all, pending, transported, completed
  });

  useEffect(() => {
    fetchTodayData();
    checkDairyTime();
  }, []);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch today's transport calculation
      const response = await api.get("/api/transport/calculate");
      const data = response.data.data || response.data;
      setTransportData(data);
      
    } catch (err) {
      console.error("Error fetching transport data:", err);
      setError(err.response?.data?.message || "Failed to fetch transport data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransportHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (historyFilters.startDate) params.append('startDate', historyFilters.startDate);
      if (historyFilters.endDate) params.append('endDate', historyFilters.endDate);
      if (historyFilters.status !== 'all') params.append('status', historyFilters.status);
      
      const response = await api.get(`/api/transport/records?${params.toString()}`);
      const data = response.data.data || response.data;
      setTransportHistory(data.transports || []);
    } catch (err) {
      console.error("Error fetching transport history:", err);
      setError("Failed to fetch transport history");
    }
  };

  const checkDairyTime = () => {
    const now = new Date();
    const currentHour = now.getHours();
    // Assume dairy closes at 18:00 (6 PM)
    setIsDairyOpen(currentHour < 18);
  };

  const handleEditToday = () => {
    if (!transportData) return;
    
    setEditData({
      transportMilk: transportData.transportMilk || 0,
      transportAmount: transportData.transportAmount || 0,
      notes: ""
    });
    setEditingToday(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Show admin notification warning
      const confirmEdit = window.confirm(
        "⚠️ WARNING: If you edit this transport data, an updating message will be sent to the admin. Do you want to continue?"
      );
      
      if (!confirmEdit) {
        setEditingToday(false);
        setEditData({});
        return;
      }

      // Create/update transport record with edited data
      await api.post("/api/transport/create", {
        transportMilk: parseFloat(editData.transportMilk),
        transportAmount: parseFloat(editData.transportAmount),
        notes: `Manual edit by employee: ${editData.notes}`,
        isManualEdit: true
      });

      // Send notification to admin (you can implement this endpoint)
      try {
        await api.post("/api/notifications/admin", {
          type: "transport_edit",
          message: `Employee has manually edited today's transport data. New values: ${editData.transportMilk}L milk, ₹${editData.transportAmount}`,
          data: editData
        });
      } catch (notifErr) {
        console.warn("Failed to send admin notification:", notifErr);
      }

      setEditingToday(false);
      setEditData({});
      fetchTodayData();
      alert("Transport data updated successfully! Admin has been notified.");
      
    } catch (err) {
      console.error("Error updating transport data:", err);
      alert("Failed to update transport data");
    }
  };

  const handleCancelEdit = () => {
    setEditingToday(false);
    setEditData({});
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchTransportHistory();
  };

  const handleApplyHistoryFilters = () => {
    fetchTransportHistory();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "transported":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading transported milk data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-xl">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 text-orange-100 hover:text-white hover:bg-orange-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Truck size={32} />
          Transported Milk Management
        </h1>
        <p className="text-orange-100">Monitor and manage daily milk transport operations</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            {error}
          </div>
        </div>
      )}

      {/* Today's Transport Summary */}
      {transportData && (
        <div className="bg-white rounded-xl shadow border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar size={24} />
              Today's Transport Summary ({new Date().toLocaleDateString()})
            </h2>
            <div className="flex gap-3">
              {isDairyOpen && !editingToday && (
                <button
                  onClick={handleEditToday}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit Today's Data
                </button>
              )}
              <button
                onClick={handleShowHistory}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <History size={16} />
                View History
              </button>
            </div>
          </div>

          {!isDairyOpen && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle size={20} />
                <span className="font-medium">Dairy Closed:</span>
                <span>Edit functionality is disabled after dairy closing time (6:00 PM)</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Collection */}
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <div className="flex justify-center mb-3">
                <Droplet className="text-green-600" size={40} />
              </div>
              <h3 className="font-semibold text-green-800 mb-2">Total Collection</h3>
              <p className="text-3xl font-bold text-green-900 mb-1">
                {transportData?.totalMilkCollected?.toFixed(1) || '0.0'} L
              </p>
              <p className="text-sm text-green-700">₹{transportData?.collectionAmount?.toFixed(2) || '0.00'}</p>
            </div>

            {/* Total Sold */}
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex justify-center mb-3">
                <IndianRupee className="text-blue-600" size={40} />
              </div>
              <h3 className="font-semibold text-blue-800 mb-2">Total Sold</h3>
              <p className="text-3xl font-bold text-blue-900 mb-1">
                {transportData?.totalMilkSold?.toFixed(1) || '0.0'} L
              </p>
              <p className="text-sm text-blue-700">₹{transportData?.saleAmount?.toFixed(2) || '0.00'}</p>
            </div>

            {/* Transported Milk */}
            <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex justify-center mb-3">
                <Truck className="text-orange-600" size={40} />
              </div>
              <h3 className="font-semibold text-orange-800 mb-2">Transported Milk</h3>
              {editingToday ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-center text-2xl font-bold"
                    value={editData.transportMilk}
                    onChange={(e) => setEditData({...editData, transportMilk: e.target.value})}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-center text-sm"
                    value={editData.transportAmount}
                    onChange={(e) => setEditData({...editData, transportAmount: e.target.value})}
                    placeholder="Amount (₹)"
                  />
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-center text-xs"
                    value={editData.notes}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    placeholder="Edit reason/notes"
                  />
                  <div className="flex gap-2 justify-center mt-3">
                    <button
                      onClick={handleSaveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <Save size={14} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-orange-900 mb-1">
                    {transportData?.transportMilk?.toFixed(1) || '0.0'} L
                  </p>
                  <p className="text-sm text-orange-700">₹{transportData?.transportAmount?.toFixed(2) || '0.00'}</p>
                </>
              )}
            </div>
          </div>

          {/* Calculation Formula */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Calculation Formula:</h4>
            <p className="text-sm text-gray-600">
              <span className="font-mono bg-white px-2 py-1 rounded">
                Transported Milk = Total Collection ({transportData?.totalMilkCollected?.toFixed(1) || '0.0'}L) - Total Sold ({transportData?.totalMilkSold?.toFixed(1) || '0.0'}L) = {transportData?.transportMilk?.toFixed(1) || '0.0'}L
              </span>
            </p>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <History size={24} />
                  Transport History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* History Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={historyFilters.startDate}
                    onChange={(e) => setHistoryFilters({...historyFilters, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={historyFilters.endDate}
                    onChange={(e) => setHistoryFilters({...historyFilters, endDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Milk Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={historyFilters.milkType}
                    onChange={(e) => setHistoryFilters({...historyFilters, milkType: e.target.value})}
                  >
                    <option value="all">All Types</option>
                    <option value="cow">🐄 Cow Milk</option>
                    <option value="buffalo">🐃 Buffalo Milk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={historyFilters.status}
                    onChange={(e) => setHistoryFilters({...historyFilters, status: e.target.value})}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="transported">Transported</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleApplyHistoryFilters}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Filter size={16} />
                  Apply Filters
                </button>
              </div>
            </div>

            {/* History Table */}
            <div className="p-6 overflow-y-auto max-h-96">
              {transportHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No transport history found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Collection (L)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sold (L)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Transported (L)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount (₹)</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transportHistory.map((record) => (
                        <tr key={record._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.totalMilkCollected.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.totalMilkSold.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-orange-600">
                            {record.transportMilk.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            ₹{record.transportAmount.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                            {record.notes || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}