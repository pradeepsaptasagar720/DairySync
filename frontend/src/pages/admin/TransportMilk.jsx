import { useEffect, useState } from "react";
import api from "../../services/api";
import { Truck, Droplet, IndianRupee, Calendar, CheckCircle, Clock, AlertCircle, X, FileText } from "lucide-react";

export default function TransportMilk() {
  const [transportData, setTransportData] = useState(null);
  const [transportRecords, setTransportRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingRecord, setCompletingRecord] = useState(null);
  const [completionForm, setCompletionForm] = useState({
    cow: { quantity: "", fat: "", rate: "" },
    buffalo: { quantity: "", fat: "", rate: "" },
  });
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all"); // all, today, week, month
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [totalTransportData, setTotalTransportData] = useState(null);
  const [loadingTotalData, setLoadingTotalData] = useState(false);

  useEffect(() => {
    fetchData();
    fetchTotalTransportData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's transport calculation
      const calcRes = await api.get("/api/transport/calculate");
      const calcData = calcRes.data.data || calcRes.data;
      setTransportData(calcData);

      // Fetch transport records
      const recordsRes = await api.get("/api/transport/records?limit=10");
      const recordsData = recordsRes.data.data || recordsRes.data;
      setTransportRecords(recordsData.transports || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalTransportData = async () => {
    try {
      setLoadingTotalData(true);
      // Fetch all completed transport records to calculate totals
      const response = await api.get("/api/transport/history?filter=all");
      const data = response.data.data || response.data;
      const completedRecords = data.transports || [];
      
      // Calculate totals from actual data
      const totals = calculateTotalsFromRecords(completedRecords);
      setTotalTransportData(totals);
    } catch (err) {
      console.error("Failed to fetch total transport data:", err);
      // Set empty totals if API fails
      setTotalTransportData({
        totalRecords: 0,
        totalTransported: 0,
        totalCowMilk: 0,
        totalBuffaloMilk: 0,
        totalAmount: 0
      });
    } finally {
      setLoadingTotalData(false);
    }
  };

  const calculateTotalsFromRecords = (records) => {
    let totalTransported = 0;
    let totalCowMilk = 0;
    let totalBuffaloMilk = 0;
    let totalAmount = 0;
    
    records.forEach(record => {
      if (record.status === 'completed' && record.completionDetails) {
        totalCowMilk += record.completionDetails.cow?.quantity || 0;
        totalBuffaloMilk += record.completionDetails.buffalo?.quantity || 0;
        totalAmount += record.completionDetails.totalAmount || 0;
      } else {
        // For non-completed records, use transport amounts
        totalCowMilk += record.cowMilkTransported || 0;
        totalBuffaloMilk += record.buffaloMilkTransported || 0;
        totalAmount += record.transportAmount || 0;
      }
    });
    
    totalTransported = totalCowMilk + totalBuffaloMilk;
    
    return {
      totalRecords: records.length,
      totalTransported,
      totalCowMilk,
      totalBuffaloMilk,
      totalAmount
    };
  };

  const handleCreateTransport = async () => {
    try {
      await api.post("/api/transport/create", {
        notes: "Daily transport record"
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to create transport record");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (status === "completed") {
      // Find the record and open completion modal
      const record = transportRecords.find(r => r._id === id);
      if (record) {
        setCompletingRecord(record);
        // Pre-fill quantities from transport record
        setCompletionForm({
          cow: { 
            quantity: (record.cowMilkTransported || 0).toFixed(2), 
            fat: "", 
            rate: "" 
          },
          buffalo: { 
            quantity: (record.buffaloMilkTransported || 0).toFixed(2), 
            fat: "", 
            rate: "" 
          },
        });
        setShowCompletionModal(true);
      }
      return;
    }

    try {
      await api.put(`/api/transport/status/${id}`, { status });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to update status");
    }
  };

  // Check if form is valid (all required fields filled)
  const isFormValid = () => {
    const cowFat = parseFloat(completionForm.cow.fat) || 0;
    const cowRate = parseFloat(completionForm.cow.rate) || 0;
    const buffaloFat = parseFloat(completionForm.buffalo.fat) || 0;
    const buffaloRate = parseFloat(completionForm.buffalo.rate) || 0;

    // All fields must be filled and greater than 0
    return cowFat > 0 && cowRate > 0 && buffaloFat > 0 && buffaloRate > 0;
  };

  const handleCompleteTransport = async () => {
    if (!completingRecord) return;

    try {
      setSaving(true);
      setError("");

      // Calculate amounts
      const cowQty = parseFloat(completionForm.cow.quantity) || 0;
      const cowRate = parseFloat(completionForm.cow.rate) || 0;
      const cowAmount = cowQty * cowRate;

      const buffaloQty = parseFloat(completionForm.buffalo.quantity) || 0;
      const buffaloRate = parseFloat(completionForm.buffalo.rate) || 0;
      const buffaloAmount = buffaloQty * buffaloRate;

      const totalAmount = cowAmount + buffaloAmount;

      await api.put(`/api/transport/status/${completingRecord._id}`, {
        status: "completed",
        completionDetails: {
          cow: {
            quantity: cowQty,
            fat: parseFloat(completionForm.cow.fat) || 0,
            rate: cowRate,
            amount: cowAmount,
          },
          buffalo: {
            quantity: buffaloQty,
            fat: parseFloat(completionForm.buffalo.fat) || 0,
            rate: buffaloRate,
            amount: buffaloAmount,
          },
          totalAmount: totalAmount,
        }
      });

      setShowCompletionModal(false);
      setCompletingRecord(null);
      setCompletionForm({
        cow: { quantity: "", fat: "", rate: "" },
        buffalo: { quantity: "", fat: "", rate: "" },
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to complete transport");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseCompletionModal = () => {
    setShowCompletionModal(false);
    setCompletingRecord(null);
    setCompletionForm({
      cow: { quantity: "", fat: "", rate: "" },
      buffalo: { quantity: "", fat: "", rate: "" },
    });
    setError("");
  };

  const fetchHistory = async (filter = historyFilter) => {
    try {
      setLoadingHistory(true);
      const res = await api.get(`/api/transport/history?filter=${filter}`);
      const data = res.data.data || res.data;
      setHistoryRecords(data.transports || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setHistoryRecords([]);
  };

  // Calculate totals for display
  const calculateTotals = () => {
    const cowQty = parseFloat(completionForm.cow.quantity) || 0;
    const cowRate = parseFloat(completionForm.cow.rate) || 0;
    const cowAmount = cowQty * cowRate;

    const buffaloQty = parseFloat(completionForm.buffalo.quantity) || 0;
    const buffaloRate = parseFloat(completionForm.buffalo.rate) || 0;
    const buffaloAmount = buffaloQty * buffaloRate;

    return {
      cowAmount,
      buffaloAmount,
      totalAmount: cowAmount + buffaloAmount
    };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="text-yellow-500" size={16} />;
      case "transported":
        return <Truck className="text-blue-500" size={16} />;
      case "completed":
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <AlertCircle className="text-gray-500" size={16} />;
    }
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

  if (loading) return <div className="p-6">Loading transport data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transport Milk Management</h1>
        <div className="flex gap-3">
          <button
            onClick={handleShowHistory}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Calendar size={16} />
            History
          </button>
          {transportData && (transportData.transportMilk || 0) > 0 && (
            <button
              onClick={handleCreateTransport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Truck size={16} />
              Create Transport Record
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Today's Transport Summary */}
      {transportData && (
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Today's Transport Summary ({transportData.date})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Milk Collection */}
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Droplet className="text-green-600" size={32} />
              </div>
              <h3 className="font-semibold text-green-800">Total Collection</h3>
              <p className="text-2xl font-bold text-green-900">{(transportData.totalMilkCollected || 0).toFixed(1)} L</p>
              <p className="text-sm text-green-700">₹{(transportData.collectionAmount || 0).toFixed(2)}</p>
            </div>

            {/* Sales to Buyers */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <IndianRupee className="text-blue-600" size={32} />
              </div>
              <h3 className="font-semibold text-blue-800">Sales to Buyers</h3>
              <p className="text-2xl font-bold text-blue-900">{(transportData.totalMilkSold || 0).toFixed(1)} L</p>
              <p className="text-sm text-blue-700">₹{(transportData.saleAmount || 0).toFixed(2)}</p>
            </div>

            {/* Transport Milk */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Truck className="text-orange-600" size={32} />
              </div>
              <h3 className="font-semibold text-orange-800">Transport Milk</h3>
              <p className="text-2xl font-bold text-orange-900">{(transportData.transportMilk || 0).toFixed(1)} L</p>
              <p className="text-sm text-orange-700">₹{(transportData.transportAmount || 0).toFixed(2)}</p>
            </div>
          </div>

          {(transportData.transportMilk || 0) > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                <strong>Note:</strong> You have {(transportData.transportMilk || 0).toFixed(1)} liters of milk ready for transport to external buyers/tankers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Total Transport Summary */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Truck size={20} />
          Total Transport Summary
        </h2>
        
        {loadingTotalData ? (
          <div className="text-center py-8 text-gray-500">
            Loading total transport data...
          </div>
        ) : totalTransportData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex justify-center mb-2">
                <FileText className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-purple-800">Total Records</h3>
              <p className="text-2xl font-bold text-purple-900">{totalTransportData.totalRecords}</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-center mb-2">
                <Truck className="text-blue-600" size={24} />
              </div>
              <h3 className="font-semibold text-blue-800">Total Transported</h3>
              <p className="text-2xl font-bold text-blue-900">{totalTransportData.totalTransported.toFixed(1)} L</p>
              <div className="text-xs text-blue-700 mt-1">
                <div>🐄 Cow: {totalTransportData.totalCowMilk.toFixed(1)} L</div>
                <div>🐃 Buffalo: {totalTransportData.totalBuffaloMilk.toFixed(1)} L</div>
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-center mb-2">
                <IndianRupee className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-green-800">Total Amount</h3>
              <p className="text-2xl font-bold text-green-900">₹{totalTransportData.totalAmount.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex justify-center mb-2">
                <Droplet className="text-orange-600" size={24} />
              </div>
              <h3 className="font-semibold text-orange-800">Average per Record</h3>
              <p className="text-2xl font-bold text-orange-900">
                {totalTransportData.totalRecords > 0 
                  ? (totalTransportData.totalTransported / totalTransportData.totalRecords).toFixed(1) 
                  : '0.0'} L
              </p>
              <p className="text-sm text-orange-700">
                ₹{totalTransportData.totalRecords > 0 
                  ? (totalTransportData.totalAmount / totalTransportData.totalRecords).toLocaleString('en-IN') 
                  : '0'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No transport data available.
          </div>
        )}
      </div>

      {/* Transport Records */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-lg font-semibold mb-4">Transport Records</h2>
        
        {transportRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transport records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">🐄 Cow (L)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">🐃 Buffalo (L)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total (L)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transportRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-blue-600 font-medium">
                        {(record.cowMilkTransported || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="text-amber-600 font-medium">
                        {(record.buffaloMilkTransported || 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {(record.transportMilk || 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.status === "completed" && record.completionDetails?.totalAmount ? (
                        <span className="font-semibold text-green-700">
                          ₹{(record.completionDetails.totalAmount || 0).toFixed(2)}
                        </span>
                      ) : (
                        <span>₹{(record.transportAmount || 0).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.status === "transported" && (
                        <button
                          onClick={() => handleUpdateStatus(record._id, "completed")}
                          className="text-green-600 hover:text-green-800 text-xs"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletionModal && completingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Complete Transport</h3>
              <button
                onClick={handleCloseCompletionModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="text"
                  value={new Date(completingRecord.date).toLocaleDateString()}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              {/* Cow Milk Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">🐄 Cow Milk</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity (L)</label>
                    <input
                      type="text"
                      value={completionForm.cow.quantity}
                      readOnly
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={completionForm.cow.fat}
                      onChange={(e) => setCompletionForm({ 
                        ...completionForm, 
                        cow: { ...completionForm.cow, fat: e.target.value }
                      })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rate (₹/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={completionForm.cow.rate}
                      onChange={(e) => setCompletionForm({ 
                        ...completionForm, 
                        cow: { ...completionForm.cow, rate: e.target.value }
                      })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {completionForm.cow.quantity && completionForm.cow.rate && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-blue-700">Amount: </span>
                    <span className="text-sm font-bold text-blue-900">
                      ₹{calculateTotals().cowAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Buffalo Milk Section */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-3">🐃 Buffalo Milk</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity (L)</label>
                    <input
                      type="text"
                      value={completionForm.buffalo.quantity}
                      readOnly
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fat (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={completionForm.buffalo.fat}
                      onChange={(e) => setCompletionForm({ 
                        ...completionForm, 
                        buffalo: { ...completionForm.buffalo, fat: e.target.value }
                      })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Rate (₹/L)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={completionForm.buffalo.rate}
                      onChange={(e) => setCompletionForm({ 
                        ...completionForm, 
                        buffalo: { ...completionForm.buffalo, rate: e.target.value }
                      })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {completionForm.buffalo.quantity && completionForm.buffalo.rate && (
                  <div className="mt-2 text-right">
                    <span className="text-sm text-amber-700">Amount: </span>
                    <span className="text-sm font-bold text-amber-900">
                      ₹{calculateTotals().buffaloAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Amount */}
              {(completionForm.cow.quantity || completionForm.buffalo.quantity) && (
                <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-green-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-900">
                      ₹{calculateTotals().totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-green-700 space-y-1">
                    {completionForm.cow.quantity && completionForm.cow.rate && (
                      <div>Cow: {parseFloat(completionForm.cow.quantity).toFixed(2)} L × ₹{parseFloat(completionForm.cow.rate).toFixed(2)} = ₹{calculateTotals().cowAmount.toFixed(2)}</div>
                    )}
                    {completionForm.buffalo.quantity && completionForm.buffalo.rate && (
                      <div>Buffalo: {parseFloat(completionForm.buffalo.quantity).toFixed(2)} L × ₹{parseFloat(completionForm.buffalo.rate).toFixed(2)} = ₹{calculateTotals().buffaloAmount.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseCompletionModal}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteTransport}
                disabled={saving || !isFormValid()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                {saving ? "Completing..." : "Complete Transport"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Transport History</h3>
              <button
                onClick={handleCloseHistory}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setHistoryFilter("all"); fetchHistory("all"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${historyFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                All
              </button>
              <button
                onClick={() => { setHistoryFilter("today"); fetchHistory("today"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${historyFilter === "today" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                Today
              </button>
              <button
                onClick={() => { setHistoryFilter("week"); fetchHistory("week"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${historyFilter === "week" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                This Week
              </button>
              <button
                onClick={() => { setHistoryFilter("month"); fetchHistory("month"); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${historyFilter === "month" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
              >
                This Month
              </button>
            </div>

            {/* History Records */}
            {loadingHistory ? (
              <div className="text-center py-8">Loading history...</div>
            ) : historyRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No completed transport records found.</div>
            ) : (
              <div className="space-y-4">
                {historyRecords.map((record) => (
                  <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Completed: {record.completionDetails?.completedAt ? new Date(record.completionDetails.completedAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Completed
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Cow Milk */}
                      {record.completionDetails?.cow && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h5 className="font-semibold text-blue-900 text-sm mb-2">🐄 Cow Milk</h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{record.completionDetails.cow.quantity?.toFixed(2)} L</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fat:</span>
                              <span className="font-medium">{record.completionDetails.cow.fat?.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rate:</span>
                              <span className="font-medium">₹{record.completionDetails.cow.rate?.toFixed(2)}/L</span>
                            </div>
                            <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                              <span className="text-gray-700 font-medium">Amount:</span>
                              <span className="font-bold text-blue-900">₹{record.completionDetails.cow.amount?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Buffalo Milk */}
                      {record.completionDetails?.buffalo && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <h5 className="font-semibold text-amber-900 text-sm mb-2">🐃 Buffalo Milk</h5>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{record.completionDetails.buffalo.quantity?.toFixed(2)} L</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Fat:</span>
                              <span className="font-medium">{record.completionDetails.buffalo.fat?.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rate:</span>
                              <span className="font-medium">₹{record.completionDetails.buffalo.rate?.toFixed(2)}/L</span>
                            </div>
                            <div className="flex justify-between border-t border-amber-300 pt-1 mt-1">
                              <span className="text-gray-700 font-medium">Amount:</span>
                              <span className="font-bold text-amber-900">₹{record.completionDetails.buffalo.amount?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="mt-3 bg-green-50 border border-green-300 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">Total Amount:</span>
                        <span className="text-xl font-bold text-green-900">
                          ₹{record.completionDetails?.totalAmount?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}