import { motion } from 'framer-motion';
import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ChartSkeleton from './ChartSkeleton';

const DonutChart = ({ 
  title, 
  data, 
  centerLabel, 
  centerValue, 
  loading, 
  delay = 0 
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  if (loading) {
    return <ChartSkeleton />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Show percentage for segments larger than 3%
    if (percent < 0.03) return null;

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        className="text-base font-extrabold"
        style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)',
          fontSize: '16px',
          fontWeight: '900'
        }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white backdrop-blur-sm rounded-xl shadow-2xl p-5 border-2 border-gray-300"
          style={{ zIndex: 1000 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="w-4 h-4 rounded-full shadow-md" 
              style={{ backgroundColor: data.payload.color }}
            />
            <p className="text-sm font-bold text-gray-800">
              {data.name}
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            ₹{data.value.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-gray-600 font-semibold">
            {((data.value / total) * 100).toFixed(1)}% of total
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        />
      </div>
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={120}
              innerRadius={70}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1500}
              animationBegin={0}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                  className="transition-opacity duration-300 cursor-pointer"
                  style={{
                    filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'transparent' }}
              wrapperStyle={{ outline: 'none', zIndex: 1000 }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center content - perfectly centered and professional */}
        <motion.div 
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.5, type: "spring" }}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        >
          <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">
            {centerLabel}
          </p>
          <motion.p 
            className="text-3xl font-bold text-gray-800"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ₹{centerValue.toLocaleString('en-IN')}
          </motion.p>
        </motion.div>
      </div>
      
      {/* Legend with enhanced styling */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {data.map((item, index) => (
          <motion.div 
            key={index} 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 * index }}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <motion.div 
              className="w-4 h-4 rounded-full flex-shrink-0 shadow-md" 
              style={{ backgroundColor: item.color }}
              whileHover={{ scale: 1.3, rotate: 180 }}
              transition={{ duration: 0.3 }}
            />
            <span className="text-xs text-gray-700 font-medium truncate">{item.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DonutChart;
