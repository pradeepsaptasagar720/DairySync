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
import api from "../../services/api";

export default function MilkCollectionChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch7Days = async () => {
      try {
        const res = await api.get("/api/admin/milk-entries");
        const entries = res.data.data || [];

        const byDate = {};
        entries.forEach((e) => {
          const d = e.date;
          if (!byDate[d]) byDate[d] = 0;
          byDate[d] += (e.cow?.quantity || 0) + (e.buffalo?.quantity || 0);
        });

        const sorted = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, liters]) => ({
            day: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            liters: parseFloat(liters.toFixed(1)),
          }));

        setData(sorted);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetch7Days();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <h3 className="text-sm font-semibold mb-4">Milk Collection (Last 7 Days)</h3>
      {loading ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="L" />
            <Tooltip formatter={(v) => [`${v}L`, "Liters"]} />
            <Line type="monotone" dataKey="liters" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
