import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import ChartSkeleton from './ChartSkeleton';

const RevenueTrendLineChart = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 border-none rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            {payload[0].payload.date}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trends Over Time</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="transportedMilk" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Transported Milk"
            animationDuration={1000}
          />
          <Line 
            type="monotone" 
            dataKey="buyerPayments" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Buyer Payments"
            animationDuration={1000}
          />
          <Line 
            type="monotone" 
            dataKey="feedSales" 
            stroke="#F59E0B" 
            strokeWidth={3}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Feed Sales"
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default RevenueTrendLineChart;
