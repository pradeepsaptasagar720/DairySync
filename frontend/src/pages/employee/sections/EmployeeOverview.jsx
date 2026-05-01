import { useState, useEffect } from "react";
import api from "../../../services/api";
import KpiCard from "../../../components/ui/KpiCard";
import { 
  Users, 
  Milk,
  Truck,
  AlertCircle,
  TrendingUp,
  Calendar
} from "lucide-react";

export default function EmployeeOverview() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/api/employee/dashboard");
      setDashboardData(res.data.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading employee dashboard...</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">No dashboard data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">👨‍💼 Employee Dashboard</h1>
        <p className="text-orange-100">Manage daily dairy operations and monitor key metrics</p>
      </div>

      {/* Today's Summary */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="text-orange-600" size={28} />
          Today's Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard 
            title="🥛 Today's Milk Collection" 
            value={`${parseFloat(dashboardData.todayMilkCollection.totalLiters).toFixed(1).replace(/\.0$/, '')}L`}
            subtitle={`₹${(dashboardData.todayMilkCollection.totalAmount || 0).toLocaleString()} • ${dashboardData.todayMilkCollection.entryCount} entries`}
            icon={<Milk size={24} />}
            color="blue"
            image="🥛"
          />
          <KpiCard 
            title="🚚 Today's Deliveries" 
            value={dashboardData.todayDeliveries} 
            subtitle="Scheduled deliveries for today"
            icon={<Truck size={24} />}
            color="green"
            image="🚚"
          />
          <KpiCard 
            title="⏳ Pending Payments" 
            value={dashboardData.pendingPayments} 
            subtitle="Payments awaiting processing"
            icon={<AlertCircle size={24} />}
            color={dashboardData.pendingPayments > 0 ? "red" : "green"}
            image="💰"
          />
        </div>
      </div>

      {/* System Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="text-orange-600" size={28} />
          System Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard 
            title="👨‍🌾 Active Farmers" 
            value={dashboardData.activeFarmers} 
            subtitle="Approved and active farmers"
            icon={<Users size={24} />}
            color="green"
            image="👨‍🌾"
          />
          <KpiCard 
            title="🛍️ Active Buyers" 
            value={dashboardData.activeBuyers} 
            subtitle="Approved and active buyers"
            icon={<Users size={24} />}
            color="blue"
            image="🛍️"
          />
          <KpiCard 
            title="🐄 Total Animals" 
            value={dashboardData.totalAnimals} 
            subtitle="Registered animals in system"
            icon={<Users size={24} />}
            color="orange"
            image="🐄"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800">⚡ Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/employee/milk-collection"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🥛</span>
              <div>
                <h3 className="font-semibold text-gray-800">Record Milk</h3>
                <p className="text-sm text-gray-600">Add new milk collection</p>
              </div>
            </div>
          </a>
          
          <a
            href="/employee/animal-info"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🐄</span>
              <div>
                <h3 className="font-semibold text-gray-800">View Animals</h3>
                <p className="text-sm text-gray-600">Check animal information</p>
              </div>
            </div>
          </a>
          
          <a
            href="/employee/payment"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💳</span>
              <div>
                <h3 className="font-semibold text-gray-800">Payment</h3>
                <p className="text-sm text-gray-600">Process farmer payments</p>
              </div>
            </div>
          </a>
          
          <a
            href="/employee/payment-status"
            className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow border-l-4 border-indigo-500"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-semibold text-gray-800">Payment Status</h3>
                <p className="text-sm text-gray-600">Check payment status</p>
              </div>
            </div>
          </a>
        </div>
      </div>

    </div>
  );
}
