import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

export default function CompletedDeliveries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryData, setDeliveryData] = useState({ requests: [], summary: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletedDeliveries();
  }, []);

  const fetchCompletedDeliveries = async () => {
    try {
      const res = await api.get(`/api/delivery/requests`);
      
      // Filter for completed and cancelled deliveries only
      const completedDeliveries = res.data.data.requests.filter(
        delivery => ['Completed', 'Cancelled'].includes(delivery.status)
      );
      
      // Filter summary to only include completed statuses
      const completedSummary = res.data.data.summary.filter(
        item => ['Completed', 'Cancelled'].includes(item._id)
      );
      
      setDeliveryData({
        requests: completedDeliveries,
        summary: completedSummary
      });
    } catch (err) {
      console.error("Error fetching completed deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed": return "🎉";
      case "Cancelled": return "❌";
      default: return "📋";
    }
  };

  const getSummaryByStatus = (status) => {
    const item = deliveryData.summary.find(s => s._id === status);
    return item || { count: 0, totalQuantity: 0, totalAmount: 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading completed deliveries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">
            ✅ Completed Deliveries
          </h1>
        </div>
        <p className="text-green-100 ml-14">
          View your delivery history and completed orders
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎉</span>
            <h3 className="font-semibold text-gray-800">Completed Deliveries</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Count:</strong> {getSummaryByStatus("Completed").count}</p>
            <p><strong>Quantity:</strong> {getSummaryByStatus("Completed").totalQuantity}L</p>
            <p><strong>Amount:</strong> ₹{(getSummaryByStatus("Completed").totalAmount || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">❌</span>
            <h3 className="font-semibold text-gray-800">Cancelled Deliveries</h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Count:</strong> {getSummaryByStatus("Cancelled").count}</p>
            <p><strong>Quantity:</strong> {getSummaryByStatus("Cancelled").totalQuantity}L</p>
            <p><strong>Amount:</strong> ₹{(getSummaryByStatus("Cancelled").totalAmount || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Completed Deliveries List */}
      {deliveryData.requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Completed Deliveries
          </h2>
          <p className="text-gray-600">
            Your completed and cancelled deliveries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveryData.requests.map((request) => (
            <div key={request._id} className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow">
              {/* Mobile-first responsive layout */}
              <div className="p-4 lg:p-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">🛍️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {request.buyer?.name || request.buyer?.username || "Unknown Buyer"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Order #{request._id.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium self-start sm:self-center ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)} {request.status}
                  </span>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-600 block">Milk Type</span>
                    <p className="font-medium flex items-center gap-1 mt-1">
                      {request.milkType === "cow" ? "🐄" : "🐃"}
                      <span className="capitalize">{request.milkType}</span>
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-600 block">Quantity</span>
                    <p className="font-medium text-blue-600 mt-1">{request.quantity}L</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-600 block">Amount</span>
                    <p className="font-medium text-green-600 mt-1">₹{(request.totalAmount || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-600 block">Order Date</span>
                    <p className="font-medium mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Address Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">📍</span>
                    <div className="flex-1">
                      <span className="text-xs text-blue-600 font-medium block">Delivery Address</span>
                      <p className="text-sm text-blue-800 mt-1">{request.address}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex-1 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 text-sm">Contact:</span>
                    <p className="font-medium">{request.buyer?.mobile || "N/A"}</p>
                  </div>

                  {request.handledBy && (
                    <div className="text-sm text-gray-600 mt-2">
                      <span>Handled by:</span>
                      <span className="font-medium ml-1">{request.handledBy.name}</span>
                    </div>
                  )}
                </div>

                {/* Completion Status */}
                {request.status === "Completed" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-green-600 font-medium mb-1">✅ Delivered Successfully</div>
                      <div className="text-xs text-green-700">
                        {request.completedAt && (
                          <div>Completed: {new Date(request.completedAt).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {request.status === "Cancelled" && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-center">
                      <div className="text-red-600 font-medium mb-1">❌ Cancelled</div>
                      <div className="text-xs text-red-700">Request was declined</div>
                    </div>
                  </div>
                )}

                {/* Footer Info */}
                <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
                  <div>Order ID: #{request._id.slice(-6)}</div>
                  <div>Created: {new Date(request.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
