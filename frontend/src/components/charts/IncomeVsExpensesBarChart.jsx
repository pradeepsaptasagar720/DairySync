import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import ChartSkeleton from './ChartSkeleton';

const IncomeVsExpensesBarChart = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border-none rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            {payload[0].payload.category}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.fill }}>
              {entry.dataKey === 'income' ? 'Income' : 'Expense'}: ₹{entry.value.toLocaleString('en-IN')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Income vs Expenses Comparison</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data}>
          <defs>
            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="category" 
            stroke="#6B7280"
            style={{ fontSize: '11px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="income" 
            fill="url(#incomeGradient)" 
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
          <Bar 
            dataKey="expense" 
            fill="url(#expenseGradient)" 
            radius={[8, 8, 0, 0]}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default IncomeVsExpensesBarChart;
