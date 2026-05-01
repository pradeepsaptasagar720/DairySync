import { motion } from 'framer-motion';
import { Award, TrendingUp } from 'lucide-react';
import AnimatedCounter from '../ui/AnimatedCounter';

const BestPerformingSection = ({ source }) => {
  if (!source) return null;

  const Icon = source.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="relative bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-xl shadow-lg p-4 text-white mb-6 overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />
      </div>

      <motion.div
        className="absolute top-3 right-3"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      >
        <Award className="w-5 h-5 text-yellow-300/50" />
      </motion.div>

      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
            <Icon className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
              <TrendingUp className="w-3 h-3 text-purple-900" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Award className="w-3.5 h-3.5 text-yellow-300" />
              <p className="text-purple-200 text-xs font-semibold tracking-wide uppercase">
                Best Performing Revenue Source
              </p>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{source.name}</h2>
          </div>
        </div>

        <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/20">
          <div className="text-3xl font-bold">
            <AnimatedCounter 
              end={source.amount}
              duration={2000}
              prefix="₹"
              decimals={2}
              separator=","
              className="text-white"
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 mt-1">
            <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <p className="text-purple-200 text-xs font-medium">
              {source.percentage.toFixed(1)}% of total revenue
            </p>
          </div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      />
    </motion.div>
  );
};

export default BestPerformingSection;
