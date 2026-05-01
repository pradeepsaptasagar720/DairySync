import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';

const AnimatedMetricCard = ({ 
  title, 
  amount, 
  icon: Icon, 
  gradientFrom, 
  gradientTo, 
  subtitle, 
  trend, 
  delay = 0 
}) => {
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
        scale: 1.05,
        y: -5,
        transition: { duration: 0.2 }
      }}
      className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl shadow-xl p-6 text-white overflow-hidden group cursor-pointer`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
        <motion.div
          className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <motion.div 
            className="bg-white/20 backdrop-blur-sm rounded-xl p-3 shadow-lg"
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-7 h-7" />
          </motion.div>
          {trend && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.3 }}
              className={`flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${
                trend.direction === 'up' 
                  ? 'bg-green-500/30 text-green-100' 
                  : 'bg-red-500/30 text-red-100'
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
        
        <p className="text-white/90 text-sm font-medium mb-2 tracking-wide">{title}</p>
        
        <div className="flex items-baseline gap-2">
          <div className="text-4xl font-bold tracking-tight">
            <AnimatedCounter 
              end={amount} 
              duration={2000}
              prefix="₹"
              decimals={2}
              separator=","
              className="text-white drop-shadow-lg"
            />
          </div>
          <motion.div
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles className="w-5 h-5 text-white/60" />
          </motion.div>
        </div>
        
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.4 }}
            className="text-white/80 text-xs mt-3 font-medium"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.6 }}
      />
    </motion.div>
  );
};

export default AnimatedMetricCard;
