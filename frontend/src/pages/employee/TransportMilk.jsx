import { useEffect, useState } from "react";
import api from "../../services/api";
import { Truck, Droplet, IndianRupee, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function TransportMilk() {
  const [transportData, setTransportData] = useState(null);
  const [transportRecords, setTransportRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
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

  const handleCreateTransport = async () => {
    try {
      setError("");
      await api.post("/api/transport/create", {
        notes: "Daily transport record"
      });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to create transport record");
    }
  };

  const handleMarkTransported = async (id) => {
    try {
      setError("");
      await api.put(`/api/transport/status/${id}`, { status: "transported" });
      fetchData(); // Refresh data
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to update status");
    }
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
              <div className="mt-2 flex justify-center gap-3 text-xs text-green-700">
                <span>🐄 {(transportData.cowMilkCollected || 0).toFixed(1)} L</span>
                <span>🐃 {(transportData.buffaloMilkCollected || 0).toFixed(1)} L</span>
              </div>
            </div>

            {/* Sales to Buyers */}
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <IndianRupee className="text-blue-600" size={32} />
              </div>
              <h3 className="font-semibold text-blue-800">Sales to Buyers</h3>
              <p className="text-2xl font-bold text-blue-900">{(transportData.totalMilkSold || 0).toFixed(1)} L</p>
              <p className="text-sm text-blue-700">₹{(transportData.saleAmount || 0).toFixed(2)}</p>
              <div className="mt-2 flex justify-center gap-3 text-xs text-blue-700">
                <span>🐄 {(transportData.cowMilkSold || 0).toFixed(1)} L</span>
                <span>🐃 {(transportData.buffaloMilkSold || 0).toFixed(1)} L</span>
              </div>
            </div>

            {/* Transport Milk */}
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Truck className="text-orange-600" size={32} />
              </div>
              <h3 className="font-semibold text-orange-800">Transport Milk</h3>
              <p className="text-2xl font-bold text-orange-900">{(transportData.transportMilk || 0).toFixed(1)} L</p>
              <p className="text-sm text-orange-700">₹{(transportData.transportAmount || 0).toFixed(2)}</p>
              <div className="mt-2 flex justify-center gap-3 text-xs text-orange-700">
                <span>🐄 {(transportData.cowTransportMilk || 0).toFixed(1)} L</span>
                <span>🐃 {(transportData.buffaloTransportMilk || 0).toFixed(1)} L</span>
              </div>
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
                      ₹{(record.collectionAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.status === "pending" && (
                        <button
                          onClick={() => handleMarkTransported(record._id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Mark Transported
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
    </div>
  );
}
