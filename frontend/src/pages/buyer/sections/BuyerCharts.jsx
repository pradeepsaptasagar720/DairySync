import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import api from "../../../services/api";

export default function BuyerCharts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/api/buyer/orders");
        const orders = res.data.data?.orders || res.data.data || [];

        // Group by week
        const byWeek = {};
        orders.forEach((o) => {
          const d = new Date(o.createdAt);
          const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleString("en-IN", { month: "short" })}`;
          if (!byWeek[week]) byWeek[week] = 0;
          byWeek[week] += o.quantity || 0;
        });

        const formatted = Object.entries(byWeek).slice(-4).map(([week, liters]) => ({ week, liters }));
        setData(formatted);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow border">
      <h3 className="text-sm font-semibold mb-4">Monthly Milk Consumption Trend</h3>
      {loading ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No order data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="L" />
            <Tooltip formatter={(v) => [`${v}L`, "Liters"]} />
            <Line type="monotone" dataKey="liters" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
