import { useState, useEffect } from "react";
import { History, Calendar, Package, IndianRupee, MapPin, Filter, RefreshCw, Star } from "lucide-react";
import api from "../../services/api";
import MilkQualityRatingModal from "../../components/communication/MilkQualityRatingModal";

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratings, setRatings] = useState({}); // orderId -> rating data
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);

  useEffect(() => {
    fetchOrderHistory();
    fetchMyRatings();
  }, []);

  const fetchOrderHistory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/api/buyer/order-history");
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Error fetching order history:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const getDateRange = (filter) => {
    const now = new Date();
    switch (filter) {
      case "today":
        return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekAgo };
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return { start: monthAgo };
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return { start: yearAgo };
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    // Date filter
    if (dateFilter !== "all") {
      const range = getDateRange(dateFilter);
      if (range && new Date(order.deliveryDate) < range.start) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== "all" && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  const getOrderStats = () => {
    const stats = {
      total: filteredOrders.length,
      completed: filteredOrders.filter(o => o.status === "Completed").length,
      cancelled: filteredOrders.filter(o => o.status === "Cancelled").length,
      outForDelivery: filteredOrders.filter(o => o.status === "Out for Delivery").length,
      totalAmount: filteredOrders.reduce((sum, o) => sum + (o.status === "Completed" ? o.totalAmount : 0), 0),
      totalLiters: filteredOrders.reduce((sum, o) => sum + (o.status === "Completed" ? o.quantity : 0), 0)
    };
    return stats;
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading order history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <History size={32} />
              Order History
            </h1>
            <p className="text-purple-100">View your completed, cancelled, and past orders</p>
            <div className="mt-2 text-sm text-purple-200">
              📋 Completed orders automatically move here after 12 AM
            </div>
          </div>
          <button
            onClick={() => fetchOrderHistory(true)}
            disabled={refreshing}
            className={`p-3 rounded-lg transition-colors ${
              refreshing 
                ? 'bg-purple-700 text-purple-300 cursor-not-allowed' 
                : 'bg-purple-700 hover:bg-purple-600 text-white'
            }`}
            title="Refresh order history"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-blue-600" size={20} />
            <span className="text-gray-600 text-sm">Total Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-green-600" size={20} />
            <span className="text-gray-600 text-sm">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-red-600" size={20} />
            <span className="text-gray-600 text-sm">Cancelled</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.cancelled}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center gap-3 mb-2">
            <Package className="text-orange-600" size={20} />
            <span className="text-gray-600 text-sm">Out for Delivery</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.outForDelivery}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee className="text-purple-600" size={20} />
            <span className="text-gray-600 text-sm">Total Spent</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="out for delivery">Out for Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <History size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No Order History Found</h3>
            <p className="text-gray-500">
              {dateFilter === "all" && statusFilter === "all" 
                ? "You don't have any order history yet. Completed orders will appear here after 12 AM."
                : "No orders match your current filters. Try adjusting the filters above."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">
                      {order.milkType === "cow" ? "🐄" : "🐃"}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg capitalize">
                          {order.milkType} Milk - {order.quantity}L
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          order.status === "Completed" 
                            ? "bg-green-100 text-green-800 border-green-200"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-800 border-red-200"
                            : order.status === "Out for Delivery"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>Delivery: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                        </div>
                        {order.completedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span className="text-green-600">Completed: {new Date(order.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {order.paymentMethod && (
                          <div className="flex items-center gap-2">
                            <span>Payment: {order.paymentMethod.toUpperCase()}</span>
                            {order.paymentCompleted ? " ✅" : " ⏳"}
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{order.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-2xl font-bold mb-1 ${
                      order.status === "Completed" ? "text-green-600" : "text-gray-600"
                    }`}>
                      ₹{order.totalAmount}
                    </div>
                    <div className="text-sm text-gray-600">
                      ₹{order.rate}/L
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Order #{order._id.slice(-8)}
                    </div>
                    {order.status === "Cancelled" && (
                      <div className="text-xs text-red-500 mt-1">
                        Order was cancelled
                      </div>
                    )}
                    {order.status === "Completed" && (
                      (order.milkQualityRated || ratings[order._id.toString()]) ? (
                        <div className="mt-2 flex items-center justify-end gap-1">
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
                          className="mt-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Star size={12} />
                          Rate Quality
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
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