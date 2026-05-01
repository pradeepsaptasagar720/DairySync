import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';

const DairyPerformanceCard = ({ 
  title, 
  amount, 
  icon: Icon, 
  gradientFrom, 
  gradientTo, 
  subtitle, 
  trend, 
  profitLoss,
  delay = 0 
}) => {
  const isProfitable = profitLoss >= 0;
  const performanceColor = isProfitable ? 'text-green-400' : 'text-red-400';
  const performanceIcon = isProfitable ? CheckCircle : AlertTriangle;
  const PerformanceIcon = performanceIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ 
        scale: 1.02,
        y: -8,
        transition: { duration: 0.2 }
      }}
      className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl shadow-2xl p-6 text-white overflow-hidden group cursor-pointer border border-white/20`}
    >
      {/* Professional background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent"></div>
        <motion.div
          className="absolute -right-16 -top-16 w-48 h-48 bg-white/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Performance indicator */}
      <motion.div
        className={`absolute top-4 right-4 ${performanceColor}`}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <PerformanceIcon className="w-6 h-6" />
      </motion.div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="bg-white/25 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-white/30"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-8 h-8" />
          </motion.div>
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm ${
                trend.direction === 'up' 
                  ? 'bg-green-500/30 text-green-100 border border-green-400/30' 
                  : 'bg-red-500/30 text-red-100 border border-red-400/30'
              }`}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.abs(trend.value)}%
            </motion.div>
          )}
        </div>
        
        <p className="text-white/95 text-sm font-semibold mb-3 tracking-wide uppercase">{title}</p>
        
        <div className="flex items-baseline gap-2 mb-4">
          <div className="text-4xl font-bold tracking-tight">
            <AnimatedCounter 
              end={amount} 
              duration={2500}
              prefix="₹"
              decimals={2}
              separator=","
              className="text-white drop-shadow-lg"
            />
          </div>
        </div>

        {/* Profit/Loss indicator */}
        {profitLoss !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.4 }}
            className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg backdrop-blur-sm ${
              isProfitable 
                ? 'bg-green-500/20 text-green-100 border border-green-400/30' 
                : 'bg-red-500/20 text-red-100 border border-red-400/30'
            }`}
          >
            <span className="text-xs opacity-80">P&L:</span>
            <AnimatedCounter 
              end={profitLoss} 
              duration={2000}
              prefix="₹"
              decimals={2}
              separator=","
              className="font-bold"
            />
          </motion.div>
        )}
        
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
            className="text-white/85 text-xs mt-3 font-medium bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Professional bottom accent */}
      <motion.div
        className={`absolute bottom-0 left-0 right-0 h-1 ${isProfitable ? 'bg-green-400/50' : 'bg-red-400/50'}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.8 }}
      />
    </motion.div>
  );
};

export default DairyPerformanceCard;