import {
  LineChart as LC,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function LineChart({ data = [], dataKey = "value", xKey = "day", color = "#16a34a" }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LC data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
      </LC>
    </ResponsiveContainer>
  );
}
