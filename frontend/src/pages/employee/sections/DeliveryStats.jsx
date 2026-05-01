import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import api from "../../../services/api";

export default function DeliveryStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/delivery/stats', {
        params: dateRange
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch delivery stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = () => {
    if (!stats?.overallStats) return null;

    const totalDeliveries = stats.overallStats.reduce((sum, stat) => sum + stat.count, 0);
    const completedDeliveries = stats.overallStats.find(s => s._id === "Completed")?.count || 0;
    const cancelledDeliveries = stats.overallStats.find(s => s._id === "Cancelled")?.count || 0;
    
    const successRate = totalDeliveries > 0 ? ((completedDeliveries / totalDeliveries) * 100).toFixed(1) : 0;
    const cancellationRate = totalDeliveries > 0 ? ((cancelledDeliveries / totalDeliveries) * 100).toFixed(1) : 0;

    return {
      totalDeliveries,
      completedDeliveries,
      cancelledDeliveries,
      successRate,
      cancellationRate
    };
  };

  const performanceMetrics = calculatePerformanceMetrics();

  // Prepare pie chart data
  const pieChartData = stats?.overallStats?.map(stat => ({
    name: stat._id,
    value: stat.count,
    color: stat._id === "Completed" ? "#10B981" : 
           stat._id === "Pending" ? "#F59E0B" :
           stat._id === "Approved" ? "#3B82F6" : "#EF4444"
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">📊 Delivery Analytics</h1>
            <p className="text-purple-100">Performance insights and delivery trends</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border border-purple-300 rounded-lg px-3 py-2 text-gray-800"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border border-purple-300 rounded-lg px-3 py-2 text-gray-800"
            />
          </div>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-blue-600">{performanceMetrics.totalDeliveries}</p>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{performanceMetrics.completedDeliveries}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{performanceMetrics.cancelledDeliveries}</p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-emerald-600">{performanceMetrics.successRate}%</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancel Rate</p>
                <p className="text-2xl font-bold text-orange-600">{performanceMetrics.cancellationRate}%</p>
              </div>
              <div className="text-3xl">📉</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Status Distribution</h2>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>

        {/* Daily Delivery Trends */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Delivery Trends</h2>
          {stats?.dailyStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="_id.date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value) => [value, 'Deliveries']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No daily data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats?.overallStats?.map((stat) => {
                const percentage = performanceMetrics ? ((stat.count / performanceMetrics.totalDeliveries) * 100).toFixed(1) : 0;
                return (
                  <tr key={stat._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900 capitalize">{stat._id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.totalQuantity}L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(stat.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}