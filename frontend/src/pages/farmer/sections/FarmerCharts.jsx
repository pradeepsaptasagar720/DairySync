import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../../services/api";

export default function FarmerCharts() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/api/farmer/milk-history");
        const entries = res.data.data || [];

        // Group by date, sum liters per day
        const byDate = {};
        entries.forEach((entry) => {
          const date = entry.date;
          if (!byDate[date]) byDate[date] = 0;
          byDate[date] += (entry.cow?.quantity || 0) + (entry.buffalo?.quantity || 0);
        });

        // Last 7 days sorted
        const sorted = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, liters]) => ({
            day: new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
            liters: parseFloat(liters.toFixed(1)),
          }));

        setChartData(sorted);
      } catch (err) {
        console.error("FarmerCharts fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-xl shadow border h-[300px] flex items-center justify-center text-gray-400 text-sm">
        Loading chart...
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-4 rounded-xl shadow border h-[300px] flex items-center justify-center text-gray-400 text-sm">
        No milk entries found for this period.
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow border">
      <h3 className="text-sm font-semibold mb-4">Milk Supply Trend (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="L" />
          <Tooltip formatter={(v) => [`${v}L`, "Liters"]} />
          <Line
            type="monotone"
            dataKey="liters"
            stroke="#16a34a"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
