import { motion } from 'framer-motion';
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import ChartSkeleton from './ChartSkeleton';

const ProfitLossAnalysisChart = ({ data, loading }) => {
  if (loading) {
    return <ChartSkeleton />;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/95 backdrop-blur-sm border-none rounded-xl shadow-2xl p-4 border border-gray-200"
        >
          <p className="text-sm font-bold text-gray-800 mb-3">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs font-medium text-gray-700">{entry.name}:</span>
              </div>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                ₹{entry.value.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: 0.2,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">Profit & Loss Analysis</h3>
          <p className="text-gray-600 text-sm">Monthly dairy performance breakdown</p>
        </div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-3 h-3 bg-gradient-to-r from-green-500 to-red-500 rounded-full"
        />
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
          <XAxis 
            dataKey="month" 
            stroke="#6B7280"
            style={{ fontSize: '12px', fontWeight: '500' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px', fontWeight: '500' }}
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar 
            dataKey="revenue" 
            fill="url(#revenueGradient)" 
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
            name="Revenue"
          />
          <Bar 
            dataKey="expenses" 
            fill="url(#expenseGradient)" 
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
            name="Expenses"
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#8B5CF6" 
            strokeWidth={4}
            dot={{ fill: '#8B5CF6', r: 6, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
            name="Net Profit"
            animationDuration={1500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default ProfitLossAnalysisChart;