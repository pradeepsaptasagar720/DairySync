import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Star, Award } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";

export default function EarningsDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("monthly");
  const [earningsData, setEarningsData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    fetchEarningsData();
    fetchPerformanceData();
  }, [period]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/delivery-persons/${user.id}/earnings?period=${period}`);
      setEarningsData(res.data.data);
    } catch (err) {
      console.error("Error fetching earnings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const res = await api.get(`/api/delivery-persons/${user.id}/performance`);
      setPerformanceData(res.data.data);
    } catch (err) {
      console.error("Error fetching performance:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading earnings data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/employee/dashboard')}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">💰 My Earnings</h1>
        </div>
        <p className="text-green-100 ml-14">
          Track your earnings and performance metrics
        </p>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                period === p
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings Summary */}
      {earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-blue-600" />
              <h3 className="font-semibold text-gray-800">Daily</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ₹{earningsData.summary.daily.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} className="text-purple-600" />
              <h3 className="font-semibold text-gray-800">Weekly</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              ₹{earningsData.summary.weekly.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-green-600" />
              <h3 className="font-semibold text-gray-800">Monthly</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₹{earningsData.summary.monthly.toFixed(2)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <Award size={20} className="text-orange-600" />
              <h3 className="font-semibold text-gray-800">Unpaid</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              ₹{earningsData.summary.unpaid.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {performanceData && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {performanceData.totalDeliveries}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Deliveries</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {performanceData.acceptanceRate}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Acceptance Rate</div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {performanceData.completionRate}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star size={24} className="text-yellow-500 fill-yellow-500" />
                <span className="text-3xl font-bold text-yellow-600">
                  {performanceData.averageRating.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Average Rating ({performanceData.totalRatings} ratings)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Breakdown */}
      {earningsData && earningsData.breakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Earnings Breakdown ({period})
          </h2>
          <div className="space-y-3">
            {earningsData.breakdown.map((earning) => (
              <div
                key={earning._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {earning.orderId?.milkType === "cow" ? "🐄" : "🐃"}
                    </span>
                    <div>
                      <p className="font-medium">
                        {earning.orderId?.quantity}L {earning.orderId?.milkType} Milk
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(earning.calculatedAt).toLocaleDateString()} •{" "}
                        {earning.distanceKm.toFixed(1)}km
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ₹{earning.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Base: ₹{earning.baseFee} + Distance: ₹{earning.distanceFee.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {earningsData && earningsData.breakdown.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Earnings Yet
          </h2>
          <p className="text-gray-600">
            Complete deliveries to start earning. Your earnings will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
