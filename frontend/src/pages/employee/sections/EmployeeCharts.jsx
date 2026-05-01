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
import api from "../../../services/api";

export default function EmployeeCharts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await api.get("/api/employee/milk-entries");
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
    fetchEntries();
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow border">
      <h3 className="text-sm font-semibold mb-4">Daily Milk Collection (This Week)</h3>
      {loading ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Loading...</div>
      ) : data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">No data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} unit="L" />
            <Tooltip formatter={(v) => [`${v}L`, "Liters"]} />
            <Bar dataKey="liters" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
