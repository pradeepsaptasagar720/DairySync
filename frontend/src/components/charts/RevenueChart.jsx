import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "../../services/api";

export default function RevenueChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await api.get("/api/admin/revenue-analytics");
        const monthly = res.data.data?.monthlyRevenue || res.data.data?.monthly || [];

        const formatted = monthly.slice(-6).map((m) => ({
          month: m.month || m.label || m._id || "",
          amount: m.revenue || m.amount || m.total || 0,
        }));

        setData(formatted);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="text-sm font-semibold mb-4">Monthly Revenue</h3>
      {loading ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
            <Bar dataKey="amount" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
