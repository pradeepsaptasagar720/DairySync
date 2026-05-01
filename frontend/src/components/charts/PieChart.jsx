import { PieChart as PC, Pie, Tooltip, Cell } from "recharts";

const COLORS = ["#16a34a", "#f59e0b", "#ef4444", "#2563eb"];

export default function PieChart({ data = [] }) {
  if (!data.length) return null;
  return (
    <PC width={300} height={250}>
      <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
        {data.map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PC>
  );
}
