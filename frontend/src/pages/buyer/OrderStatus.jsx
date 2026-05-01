import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, Bike, MapPin, Calendar, IndianRupee, X, RefreshCw, User, Phone, Star } from "lucide-react";
import api from "../../services/api";
import CallButton from "../../components/communication/CallButton";
import ChatButton from "../../components/communication/ChatButton";
import ChatInterface from "../../components/communication/ChatInterface";
import MilkQualityRatingModal from "../../components/communication/MilkQualityRatingModal";

export default function OrderStatus() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chatModalOrder, setChatModalOrder] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [ratings, setRatings] = useState({});
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  useEffect(() => {
    fetchActiveOrders();
    fetchMyRatings();
  }, []);

  // Auto-refresh every 10 seconds to keep status synchronized
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveOrders(true);
    }, 10000); // 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchActiveOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Only fetch active orders (Pending, Approved, Out for Delivery)
      const response = await api.get("/api/buyer/orders");
      const activeOrders = response.data.data || [];
      
      // Filter out orders that should be moved to history (completed or cancelled after 12 AM)
      const currentOrders = activeOrders.filter(order => {
        if (order.status === "Completed") {
          const completedDate = new Date(order.completedAt || order.updatedAt);
          const today = new Date();
          const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          // If completed before today's midnight, it should be in history
          return completedDate >= todayMidnight;
        }
        
        // Cancelled orders should go to history, not stay in current orders
        if (order.status === "Cancelled") {
          return false;
        }
        
        return true; // Keep Pending and Approved orders
      });
      
      setOrders(currentOrders);
      
      // Fetch unread counts
      fetchUnreadCounts();
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const fetchMyRatings = async () => {
    try {
      const response = await api.get("/api/ratings/my-ratings");
      if (response.data.success) {
        const map = {};
        (response.data.data || []).forEach(r => {
          const key = r.orderId?.toString ? r.orderId.toString() : String(r.orderId);
          map[key] = r;
        });
        setRatings(map);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleRatingSubmit = (ratingData) => {
    // Normalize orderId to string to ensure map key matches order._id
    const orderIdStr = ratingData.orderId?.toString ? ratingData.orderId.toString() : String(ratingData.orderId);
    setRatings(prev => ({ ...prev, [orderIdStr]: { ...ratingData, orderId: orderIdStr } }));
    setSelectedOrderForRating(null);
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await api.delete(`/api/buyer/orders/${orderId}`);
      // Refresh orders after cancellation
      await fetchActiveOrders(true);
      
      // Refresh milk availability on dashboard if the refresh function is available
      if (window.refreshMilkAvailability) {
        console.log('🔄 Order cancelled, refreshing milk availability...');
        window.refreshMilkAvailability();
        console.log('✅ Refresh function called after cancellation');
      } else {
        console.error('❌ window.refreshMilkAvailability not found after cancellation');
      }
      
      alert("Order cancelled successfully");
    } catch (error) {
      console.error("Error cancelling order:", error);
      alert(error.response?.data?.error?.message || "Failed to cancel order");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="text-yellow-600" size={20} />;
      case "Accepted":
        return <CheckCircle className="text-green-600" size={20} />;
      case "Completed":
        return <CheckCircle className="text-green-600" size={20} />;
      case "Out for Delivery":
        return <Bike className="text-blue-600" size={20} />;
      case "Cancelled":
        return <X className="text-red-600" size={20} />;
      default:
        return <Package className="text-gray-600" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Accepted":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Out for Delivery":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTrackingSteps = (status) => {
    const steps = [
      { 
        label: "Order Placed", 
        status: "completed", // Always completed since order exists
        icon: "check"
      },
      { 
        label: "Order Accepted", 
        status: ["Accepted", "Out for Delivery", "Completed"].includes(status) ? "completed" : "pending",
        icon: ["Accepted", "Out for Delivery", "Completed"].includes(status) ? "check" : "pending"
      },
      { 
        label: "Out for Delivery", 
        status: ["Out for Delivery", "Completed"].includes(status) ? "completed" : "pending",
        icon: ["Out for Delivery", "Completed"].includes(status) ? "check" : "pending"
      },
      { 
        label: "Delivered", 
        status: status === "Completed" ? "completed" : "pending",
        icon: status === "Completed" ? "check" : "pending"
      }
    ];
    
    // Handle cancelled orders
    if (status === "Cancelled") {
      return [
        { label: "Order Placed", status: "completed", icon: "check" },
        { label: "Order Cancelled", status: "completed", icon: "cancel" }
      ];
    }
    
    return steps;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Package size={32} />
              Current Orders
            </h1>
            <p className="text-blue-100">Track your active orders and delivery status</p>
            <div className="mt-2 text-sm text-blue-200">
              📋 Shows active orders only • Completed orders move to history after 12 AM
            </div>
          </div>
          <button
            onClick={() => fetchActiveOrders(true)}
            disabled={refreshing}
            className={`p-3 rounded-lg transition-colors ${
              refreshing 
                ? 'bg-blue-700 text-blue-300 cursor-not-allowed' 
                : 'bg-blue-700 hover:bg-blue-600 text-white'
            }`}
            title="Refresh orders"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Orders Display */}
      <div className="bg-white rounded-xl shadow p-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No Active Orders</h3>
            <p className="text-gray-500">
              You don't have any active orders. Place a new order to get started!
            </p>
            <div className="mt-4 text-sm text-gray-400">
              💡 Completed orders automatically move to Order History after 12 AM
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {order.milkType === "cow" ? "🐄" : "🐃"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg capitalize">
                            {order.milkType} Milk - {order.quantity}L
                          </h3>
                          <p className="text-sm text-gray-600">
                            Order ID: #{order._id.slice(-8)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full border font-medium text-sm flex items-center gap-2 ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} />
                        <span className="text-sm">
                          Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <IndianRupee size={16} />
                        <span className="text-sm">
                          Amount: ₹{order.totalAmount}
                        </span>
                      </div>
                      {order.paymentMethod && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm">
                            Payment: {order.paymentMethod.toUpperCase()} 
                            {order.paymentCompleted ? " ✅" : " ⏳"}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-sm">
                          Ordered: {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600 md:col-span-2">
                        <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{order.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Tracking */}
                  <div className="lg:w-80">
                    <h4 className="font-medium mb-4">Order Tracking</h4>
                    <div className="space-y-3">
                      {getTrackingSteps(order.status).map((step, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            step.status === "completed" 
                              ? "bg-green-600 text-white" 
                              : "bg-gray-200 text-gray-600"
                          }`}>
                            {step.status === "completed" ? (
                              <CheckCircle size={18} />
                            ) : (
                              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                            )}
                          </div>
                          <span className={`text-sm ${
                            step.status === "completed" ? "text-gray-900 font-medium" : "text-gray-500"
                          }`}>
                            {step.label}
                          </span>
                          {step.status === "completed" && (
                            <span className="text-green-600 text-xs">✓</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Status Messages */}
                    {/* Delivery Boy Information with Packing Status */}
                    {order.deliveryPersonId && order.status === "Accepted" && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                          📦 Your order is packing - Preparing for delivery
                        </p>
                        <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Bike size={16} />
                          🚲 Delivery Boy Assigned
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <User size={14} />
                            <strong>Name:</strong> {order.deliveryPersonId.username}
                          </p>
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <Phone size={14} />
                            <strong>Phone:</strong> {order.deliveryPersonId.mobile}
                          </p>
                        </div>
                        
                        {/* Communication Buttons */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <CallButton
                            phoneNumber={order.deliveryPersonId.mobile}
                            displayName={order.deliveryPersonId.username}
                            userRole="buyer"
                            orderStatus={order.status}
                          />
                          <ChatButton
                            orderId={order._id}
                            unreadCount={unreadCounts[order._id] || 0}
                            onClick={() => setChatModalOrder(order)}
                          />
                        </div>
                        
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          ⚠️ Order cannot be cancelled after delivery boy accepts
                        </p>
                      </div>
                    )}

                    {/* Delivery Boy Information (for other statuses) */}
                    {order.deliveryPersonId && order.status !== "Accepted" && order.status !== "Completed" && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                          <Bike size={16} />
                          🚲 Delivery Boy Assigned
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <User size={14} />
                            <strong>Name:</strong> {order.deliveryPersonId.username}
                          </p>
                          <p className="text-sm text-blue-800 flex items-center gap-2">
                            <Phone size={14} />
                            <strong>Phone:</strong> {order.deliveryPersonId.mobile}
                          </p>
                        </div>
                        
                        {/* Communication Buttons */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <CallButton
                            phoneNumber={order.deliveryPersonId.mobile}
                            displayName={order.deliveryPersonId.username}
                            userRole="buyer"
                            orderStatus={order.status}
                          />
                          <ChatButton
                            orderId={order._id}
                            unreadCount={unreadCounts[order._id] || 0}
                            onClick={() => setChatModalOrder(order)}
                          />
                        </div>
                        
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          ⚠️ Order cannot be cancelled after delivery boy accepts
                        </p>
                      </div>
                    )}

                    {order.status === "Accepted" && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          ✅ Order approved! Preparing for delivery.
                        </p>
                      </div>
                    )}

                    {order.status === "Out for Delivery" && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-800 font-medium">
                          🛵 Out for delivery! Your order is on the way.
                        </p>
                        {/* Track Order Button */}
                        <div className="mt-3">
                          <button
                            onClick={() => {
                              if (order.liveLocation && order.liveLocation.latitude && order.liveLocation.longitude) {
                                // Open in Google Maps with live location
                                const url = `https://www.google.com/maps?q=${order.liveLocation.latitude},${order.liveLocation.longitude}`;
                                window.open(url, '_blank');
                              } else {
                                // Show address-based tracking
                                alert(`Tracking Order #${order._id.slice(-8)}\n\nDelivery Address: ${order.address}\n\nOur delivery partner is on the way!`);
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <MapPin size={16} />
                            Track Order
                          </button>
                        </div>
                      </div>
                    )}

                    {order.status === "Completed" && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                          🎉 Order delivered successfully!
                        </p>
                        {order.completedAt && (
                          <p className="text-xs text-green-700 mt-1">
                            Delivered on: {new Date(order.completedAt).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-green-600 mt-2">
                          📝 This order will move to Order History after 12 AM
                        </p>
                        <div className="mt-3">
                          {(order.milkQualityRated || ratings[order._id.toString()]) ? (
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(s => (
                                <Star
                                  key={s}
                                  size={14}
                                  className={ratings[order._id.toString()] && s <= ratings[order._id.toString()].rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">Rated</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedOrderForRating(order)}
                              className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Star size={12} />
                              Rate Milk Quality
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {order.status === "Cancelled" && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                          ❌ Order has been cancelled
                        </p>
                      </div>
                    )}

                    {/* Cancel Button - Only for Pending orders (before delivery boy accepts) */}
                    {order.status === "Pending" && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancel Order
                        </button>
                      </div>
                    )}

                    {/* Show message when cancellation is not allowed */}
                    {(order.status === "Accepted" || order.deliveryPersonId) && order.status !== "Completed" && order.status !== "Cancelled" && (
                      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          🔒 Cancellation not allowed - Order has been accepted
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {chatModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ChatInterface
            orderId={chatModalOrder._id}
            currentUserId={
              typeof chatModalOrder.buyer === "object"
                ? chatModalOrder.buyer?._id?.toString()
                : chatModalOrder.buyer?.toString()
            }
            currentUserRole="buyer"
            orderStatus={chatModalOrder.status}
            completedAt={chatModalOrder.completedAt}
            onClose={() => {
              setChatModalOrder(null);
              fetchUnreadCounts();
            }}
          />
        </div>
      )}

      {selectedOrderForRating && (
        <MilkQualityRatingModal
          orderId={selectedOrderForRating._id}
          buyerId={selectedOrderForRating.buyer?._id || selectedOrderForRating.buyer || ""}
          onSubmit={handleRatingSubmit}
          onClose={() => setSelectedOrderForRating(null)}
        />
      )}
    </div>
  );
}