import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DairyEfficiencyGauge = ({ efficiency, title, delay = 0 }) => {
  const data = [
    { name: 'Efficiency', value: efficiency },
    { name: 'Remaining', value: 100 - efficiency }
  ];

  const getEfficiencyColor = (value) => {
    if (value >= 80) return '#10B981'; // Green
    if (value >= 60) return '#F59E0B'; // Yellow
    if (value >= 40) return '#EF4444'; // Red
    return '#DC2626'; // Dark Red
  };

  const getEfficiencyStatus = (value) => {
    if (value >= 80) return { status: 'Excellent', color: 'text-green-600' };
    if (value >= 60) return { status: 'Good', color: 'text-yellow-600' };
    if (value >= 40) return { status: 'Average', color: 'text-orange-600' };
    return { status: 'Poor', color: 'text-red-600' };
  };

  const efficiencyColor = getEfficiencyColor(efficiency);
  const { status, color } = getEfficiencyStatus(efficiency);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-all duration-300"
    >
      <div className="text-center">
        <h3 className="text-sm font-bold text-gray-800 mb-2">{title}</h3>
        
        <div className="relative">
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={42}
                outerRadius={62}
                dataKey="value"
                animationDuration={1500}
              >
                <Cell fill={efficiencyColor} />
                <Cell fill="#E5E7EB" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center content */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.4, type: "spring" }}
            >
              <div className="text-2xl font-bold" style={{ color: efficiencyColor }}>
                {efficiency.toFixed(1)}%
              </div>
              <div className={`text-xs font-semibold ${color}`}>
                {status}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Efficiency indicators */}
        <div className="mt-1 grid grid-cols-4 gap-1 text-xs">
          <div className="text-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-0.5"></div>
            <span className="text-gray-500 text-[10px]">0-40%</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 bg-orange-500 rounded-full mx-auto mb-0.5"></div>
            <span className="text-gray-500 text-[10px]">40-60%</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-0.5"></div>
            <span className="text-gray-500 text-[10px]">60-80%</span>
          </div>
          <div className="text-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-0.5"></div>
            <span className="text-gray-500 text-[10px]">80-100%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DairyEfficiencyGauge;