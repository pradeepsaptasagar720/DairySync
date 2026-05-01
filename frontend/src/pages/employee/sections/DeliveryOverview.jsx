import { useState, useEffect } from "react";
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Phone, 
  Navigation,
  Star,
  Calendar,
  DollarSign
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../services/api";

export default function DeliveryOverview() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check if user is milk collector (read-only mode)
  const isMilkCollector = user?.role === "employee" && user?.employeeRole === "milk_collector";

  useEffect(() => {
    fetchDashboardData();
    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timeInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/delivery/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const { todayStats, myHandledToday, pendingDeliveries, recentDeliveries } = dashboardData || {};

  const statCards = [
    {
      title: "Pending Deliveries",
      value: pendingDeliveries || 0,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: isMilkCollector ? "System-wide pending" : "Awaiting pickup"
    },
    {
      title: "Today's Total",
      value: todayStats?.total?.count || 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "All deliveries today"
    },
    {
      title: "Completed Today",
      value: todayStats?.completed?.count || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Successfully delivered"
    },
    {
      title: isMilkCollector ? "System Performance" : "My Deliveries",
      value: myHandledToday || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: isMilkCollector ? "Overall efficiency" : "Handled by me today"
    }
  ];

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Greeting */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Truck size={32} />
              {getGreeting()}, {isMilkCollector ? "Milk Collector!" : "Delivery Partner!"}
            </h1>
            <p className="text-blue-100 text-lg">
              {isMilkCollector 
                ? "Monitor delivery operations and track performance" 
                : "Ready to deliver fresh milk to our customers"
              }
            </p>
            {isMilkCollector && (
              <div className="mt-3 bg-blue-700 bg-opacity-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300">👁️</span>
                  <span className="text-sm font-medium">Monitoring Mode: View-only access to delivery operations</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-blue-200">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>{currentTime.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-2xl font-bold">{myHandledToday || 0}</div>
              <div className="text-sm text-blue-200">
                {isMilkCollector ? "Total Deliveries Today" : "My Deliveries Today"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className={`h-10 w-10 ${stat.color}`} />
              </div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Navigation className="text-blue-600" size={24} />
          {isMilkCollector ? "Monitoring Dashboard" : "Quick Actions"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isMilkCollector ? (
            /* Read-only monitoring cards for milk collectors */
            <>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package size={20} className="text-blue-600" />
                  <div>
                    <div className="font-medium text-blue-800">Monitor Orders</div>
                    <div className="text-sm text-blue-600">{pendingDeliveries || 0} pending orders</div>
                    <div className="text-xs text-blue-500 mt-1">View-only access</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <div>
                    <div className="font-medium text-green-800">Track Performance</div>
                    <div className="text-sm text-green-600">System overview</div>
                    <div className="text-xs text-green-500 mt-1">Real-time monitoring</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp size={20} className="text-purple-600" />
                  <div>
                    <div className="font-medium text-purple-800">Analytics</div>
                    <div className="text-sm text-purple-600">Delivery insights</div>
                    <div className="text-xs text-purple-500 mt-1">Performance metrics</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Full functionality for delivery boys */
            <>
              <button 
                onClick={() => window.location.href = '/delivery/delivery-requests'}
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
              >
                <Package size={20} />
                <div className="text-left">
                  <div className="font-medium">View Pending Orders</div>
                  <div className="text-sm opacity-90">{pendingDeliveries || 0} waiting</div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/delivery/earnings'}
                className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
              >
                <DollarSign size={20} />
                <div className="text-left">
                  <div className="font-medium">My Earnings</div>
                  <div className="text-sm opacity-90">Track income</div>
                </div>
              </button>
              
              <button 
                onClick={() => window.location.href = '/delivery/stats'}
                className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex items-center gap-3"
              >
                <TrendingUp size={20} />
                <div className="text-left">
                  <div className="font-medium">Performance</div>
                  <div className="text-sm opacity-90">View stats</div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Today's Status Breakdown */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="text-green-600" size={24} />
          Today's Delivery Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{todayStats?.pending?.count || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Pending</div>
            <div className="text-xs text-gray-500">{todayStats?.pending?.totalQuantity || 0}L</div>
            <div className="text-xs text-gray-500">₹{(todayStats?.pending?.totalAmount || 0).toLocaleString()}</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{todayStats?.approved?.count || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Ready</div>
            <div className="text-xs text-gray-500">{todayStats?.approved?.totalQuantity || 0}L</div>
            <div className="text-xs text-gray-500">₹{(todayStats?.approved?.totalAmount || 0).toLocaleString()}</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{todayStats?.completed?.count || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Delivered</div>
            <div className="text-xs text-gray-500">{todayStats?.completed?.totalQuantity || 0}L</div>
            <div className="text-xs text-gray-500">₹{(todayStats?.completed?.totalAmount || 0).toLocaleString()}</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">{todayStats?.cancelled?.count || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Cancelled</div>
            <div className="text-xs text-gray-500">{todayStats?.cancelled?.totalQuantity || 0}L</div>
            <div className="text-xs text-gray-500">₹{(todayStats?.cancelled?.totalAmount || 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Recent Deliveries with Enhanced UI */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Package className="text-orange-600" size={24} />
            Recent Deliveries
          </h2>
          <button 
            onClick={() => window.location.href = '/delivery/requests'}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All →
          </button>
        </div>
        
        {recentDeliveries?.length === 0 ? (
          <div className="text-center py-8">
            <Package size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No recent deliveries</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDeliveries?.slice(0, 5).map((delivery) => (
              <div key={delivery._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{delivery.milkType === 'cow' ? '🐄' : '🐃'}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {delivery.buyer?.username || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone size={12} />
                        {delivery.buyer?.mobile || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{delivery.quantity}L</div>
                    <div className="text-sm text-gray-500">₹{(delivery.totalAmount || 0).toLocaleString()}</div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      delivery.status === 'Completed' ? 'bg-green-100 text-green-800' :
                      delivery.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                      delivery.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {delivery.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="text-yellow-500" size={24} />
          Today's Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {todayStats?.total?.totalQuantity || 0}L
            </div>
            <div className="text-sm text-gray-600">Total Milk Handled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ₹{(todayStats?.total?.totalAmount || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Total Value Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {todayStats?.completed?.count && todayStats?.total?.count 
                ? Math.round((todayStats.completed.count / todayStats.total.count) * 100) 
                : 0}%
            </div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}