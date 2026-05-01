import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import OTPEntryModal from "../../components/delivery/OTPEntryModal";
import { toast } from 'react-toastify';
import ChatButton from "../../components/communication/ChatButton";
import ChatInterface from "../../components/communication/ChatInterface";

export default function DeliveryRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deliveryData, setDeliveryData] = useState({ requests: [], summary: [] });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [chatModalOrder, setChatModalOrder] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Check if user is milk collector (read-only mode)
  const isMilkCollector = user?.role === "employee" && user?.employeeRole === "milk_collector";

  useEffect(() => {
    fetchDeliveryRequests();
  }, []);

  const fetchDeliveryRequests = async () => {
    try {
      // For milk collectors, show all delivery requests for monitoring
      // For delivery boys, backend returns only active orders (Pending, Accepted, Out for Delivery)
      const res = await api.get(`/api/delivery/requests`);
      
      setDeliveryData({
        requests: res.data.data.requests,
        summary: res.data.data.summary
      });
      
      // Fetch unread counts
      fetchUnreadCounts();
    } catch (err) {
      console.error("Error fetching delivery requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const response = await api.get("/api/chat/unread-counts");
      if (response.data.success) {
        setUnreadCounts(response.data.data.orderUnreadCounts);
      }
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  };

  const updateDeliveryStatus = async (id, status, notes = "") => {
    // Prevent milk collectors from updating delivery status
    if (isMilkCollector) {
      alert("You don't have permission to update delivery requests. This is view-only access for monitoring delivery boy performance.");
      return;
    }

    try {
      setUpdating(id);
      await api.put(`/api/delivery/requests/${id}`, { status, notes });
      
      // Refresh the data
      await fetchDeliveryRequests();
      
    } catch (err) {
      console.error("Error updating delivery status:", err);
      alert("Failed to update delivery status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  const handleCompleteDelivery = async (orderId) => {
    try {
      setUpdating(orderId);
      
      // Step 1: Generate OTP
      const otpResponse = await api.post('/api/otp/generate', { orderId });
      
      if (otpResponse.data.success) {
        const otpData = otpResponse.data.data;
        
        // Step 2: Show toast notification based on SMS status
        if (otpData.smsSent) {
          toast.success('🎉 OTP sent to buyer successfully! Valid for 10 minutes.', {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (otpData.fallbackOTP) {
          toast.warning(`⚠️ SMS failed. OTP: ${otpData.fallbackOTP}. Please share with buyer.`, {
            position: "top-right",
            autoClose: 10000,
          });
        } else {
          toast.info('📱 OTP generated! Ask buyer for the code.', {
            position: "top-right",
            autoClose: 3000,
          });
        }
        
        // Step 3: Open OTP modal
        setSelectedOrderId(orderId);
        setOtpModalOpen(true);
      } else {
        toast.error('❌ Failed to generate OTP. Please try again.', {
          position: "top-right",
          autoClose: 4000,
        });
      }
    } catch (err) {
      console.error("Error generating OTP:", err);
      toast.error('❌ Failed to generate OTP. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Accepted": return "bg-indigo-100 text-indigo-800";
      case "Out for Delivery": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return "⏳";
      case "Accepted": return "👍";
      case "Out for Delivery": return "🚚";
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
        <div className="text-lg text-gray-500">Loading delivery requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">
            🚚 {isMilkCollector ? "Delivery Monitoring Dashboard" : "My Delivery Requests"}
          </h1>
        </div>
        <p className="text-blue-100 ml-14">
          {isMilkCollector 
            ? "Monitor delivery boy performance and track all delivery requests (Read-Only Access)"
            : "Accept and manage your assigned delivery requests"
          }
        </p>
        {isMilkCollector && (
          <div className="mt-3 ml-14 bg-blue-700 bg-opacity-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-yellow-300">👁️</span>
              <span className="text-sm font-medium">View-Only Mode: You can monitor delivery performance but cannot modify requests</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏳</span>
            <h3 className="font-semibold text-gray-800">
              {isMilkCollector ? "All Pending Requests" : "Pending Requests"}
            </h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Count:</strong> {getSummaryByStatus("Pending").count}</p>
            <p><strong>Quantity:</strong> {getSummaryByStatus("Pending").totalQuantity}L</p>
            <p><strong>Amount:</strong> ₹{(getSummaryByStatus("Pending").totalAmount || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👍</span>
            <h3 className="font-semibold text-gray-800">
              {isMilkCollector ? "Accepted Orders" : "My Accepted"}
            </h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>Count:</strong> {getSummaryByStatus("Accepted").count}</p>
            <p><strong>Quantity:</strong> {getSummaryByStatus("Accepted").totalQuantity}L</p>
            <p><strong>Amount:</strong> ₹{(getSummaryByStatus("Accepted").totalAmount || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <h3 className="font-semibold text-gray-800">
              {isMilkCollector ? "Delivery Boys Performance" : "Quick Actions"}
            </h3>
          </div>
          <div className="space-y-1 text-sm">
            <p><strong>{isMilkCollector ? "Active Delivery Boys" : "Accept All"}:</strong> {isMilkCollector ? "Monitoring" : "Available"}</p>
            <p><strong>{isMilkCollector ? "Performance Tracking" : "Bulk Actions"}:</strong> {isMilkCollector ? "Real-time" : "Coming Soon"}</p>
            <p><strong>Priority:</strong> First Come First Serve</p>
          </div>
        </div>
      </div>



      {/* Delivery Requests List */}
      {deliveryData.requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">🚚</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {isMilkCollector ? "No Delivery Requests to Monitor" : "No Delivery Requests"}
          </h2>
          <p className="text-gray-600">
            {isMilkCollector 
              ? "No delivery requests found in the system. New orders will appear here for monitoring."
              : "No delivery requests found. New orders from buyers will appear here for you to accept."
            }
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
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
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
                      
                      {/* Live Location Display */}
                      {request.liveLocation && request.liveLocation.isLive && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-medium text-green-800">Live Location Available</span>
                          </div>
                          <div className="text-xs text-green-700 mb-2">
                            📍 {request.liveLocation.latitude.toFixed(6)}, {request.liveLocation.longitude.toFixed(6)}
                            {request.liveLocation.accuracy && (
                              <span className="ml-2">🎯 ~{Math.round(request.liveLocation.accuracy)}m</span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              const url = `https://www.google.com/maps?q=${request.liveLocation.latitude},${request.liveLocation.longitude}`;
                              window.open(url, '_blank');
                            }}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                          >
                            🗺️ Open in Maps
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact & Actions Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Contact Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-600 text-sm">Contact:</span>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.buyer?.mobile || "N/A"}</p>
                        {request.buyer?.mobile && (
                          <div className="flex gap-1 flex-wrap">
                            <a
                              href={`tel:${request.buyer.mobile}`}
                              className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded text-xs font-medium transition-colors"
                              title="Call customer"
                            >
                              📞 Call
                            </a>
                            {(request.status === "Accepted" || request.status === "Out for Delivery") && (
                              <ChatButton
                                orderId={request._id}
                                unreadCount={unreadCounts[request._id] || 0}
                                onClick={() => setChatModalOrder(request)}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {request.handledBy && (
                      <div className="text-sm text-gray-600">
                        <span>Handled by:</span>
                        <span className="font-medium ml-1">{request.handledBy.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 min-w-[200px]">
                    {isMilkCollector ? (
                      /* Read-only view for milk collectors */
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-center">
                          <div className="text-blue-600 font-medium mb-1">👁️ Monitoring Mode</div>
                          <div className="text-xs text-blue-700">
                            Status: <span className="font-semibold">{request.status}</span>
                          </div>
                          {request.handledBy && (
                            <div className="text-xs text-blue-700 mt-1">
                              Handler: <span className="font-semibold">{request.handledBy.username}</span>
                            </div>
                          )}
                          <div className="text-xs text-blue-600 mt-2">
                            View-only access for performance monitoring
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Full functionality for delivery boys */
                      <>
                        {request.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateDeliveryStatus(request._id, "Accepted")}
                              disabled={updating === request._id}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                              {updating === request._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Updating...
                                </>
                              ) : (
                                <>✅ Accept Order</>
                              )}
                            </button>
                            <button
                              onClick={() => updateDeliveryStatus(request._id, "Cancelled")}
                              disabled={updating === request._id}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                              {updating === request._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Updating...
                                </>
                              ) : (
                                <>❌ Decline</>
                              )}
                            </button>
                          </>
                        )}
                        
                        {request.status === "Accepted" && (
                          <button
                            onClick={() => updateDeliveryStatus(request._id, "Out for Delivery")}
                            disabled={updating === request._id}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            {updating === request._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Updating...
                              </>
                            ) : (
                              <>🚚 Out for Delivery</>
                            )}
                          </button>
                        )}
                        
                        {request.status === "Out for Delivery" && (
                          <>
                            <button
                              onClick={() => handleCompleteDelivery(request._id)}
                              disabled={updating === request._id}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                              {updating === request._id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Updating...
                                </>
                              ) : (
                                <>🔐 Complete Delivery</>
                              )}
                            </button>
                            
                            {/* Navigation Button */}
                            {request.liveLocation && request.liveLocation.isLive ? (
                              <button
                                onClick={() => {
                                  const url = `https://www.google.com/maps/dir/?api=1&destination=${request.liveLocation.latitude},${request.liveLocation.longitude}`;
                                  window.open(url, '_blank');
                                }}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                              >
                                🧭 Navigate
                              </button>
                            ) : (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                <div className="text-xs text-blue-700 text-center">
                                  <div className="font-medium">📍 En Route</div>
                                  <div>Delivery in progress</div>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {request.status === "Completed" && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="text-center">
                              <div className="text-green-600 font-medium mb-1">✅ Delivered</div>
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
                              <div className="text-xs text-red-700">Request declined</div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

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

      {/* OTP Entry Modal */}
      <OTPEntryModal
        isOpen={otpModalOpen}
        onClose={() => {
          setOtpModalOpen(false);
          setSelectedOrderId(null);
        }}
        orderId={selectedOrderId}
        onVerifySuccess={() => {
          // Refresh delivery requests after successful OTP verification
          fetchDeliveryRequests();
        }}
      />
      
      {/* Chat Modal */}
      {chatModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ChatInterface
            orderId={chatModalOrder._id}
            currentUserId={user.id}
            currentUserRole="delivery_boy"
            orderStatus={chatModalOrder.status}
            completedAt={chatModalOrder.completedAt}
            onClose={() => {
              setChatModalOrder(null);
              fetchUnreadCounts();
            }}
          />
        </div>
      )}
    </div>
  );
}