import {
  BarChart as BC,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function BarChart({ data = [], dataKey = "value", xKey = "name", color = "#2563eb" }) {
  if (!data.length) return null;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BC data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BC>
    </ResponsiveContainer>
  );
}
