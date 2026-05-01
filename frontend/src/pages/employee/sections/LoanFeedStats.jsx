import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../../services/api";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function LoanFeedStats() {
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
      const response = await api.get('/api/loanfeed/stats', {
        params: dateRange
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch loan/feed stats:', err);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Loan & Feed Statistics</h1>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
      </div>

      {/* Loan Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Statistics</h2>
          <div className="space-y-4">
            {stats?.loanStats && typeof stats.loanStats === 'object' && Object.entries(stats.loanStats).map(([status, stat]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{stat.count || 0} loans</div>
                  <div className="text-xs text-gray-500">₹{(stat.totalApproved || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feed Statistics</h2>
          <div className="space-y-4">
            {stats?.feedStats?.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{stat._id}</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{stat.count} requests</div>
                  <div className="text-xs text-gray-500">{stat.totalQuantity} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Loan Management</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.myLoanStats || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ _id, count }) => `${_id}: ${count}`}
              >
                {stats?.myLoanStats?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Feed Management</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={stats?.myFeedStats || []}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ _id, count }) => `${_id}: ${count}`}
              >
                {stats?.myFeedStats?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}