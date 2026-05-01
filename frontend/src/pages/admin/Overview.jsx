import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
} from 'recharts';
import api from '../../services/api';
import feedService from '../../services/FeedService';
import { 
  TrendingUp, TrendingDown, DollarSign, 
  Truck, ShoppingCart, FileText, Wheat, Factory, BarChart3
} from 'lucide-react';
import DairyPerformanceCard from '../../components/charts/DairyPerformanceCard';
import BestPerformingSection from '../../components/charts/BestPerformingSection';
import ProfitLossAnalysisChart from '../../components/charts/ProfitLossAnalysisChart';
import DairyEfficiencyGauge from '../../components/charts/DairyEfficiencyGauge';
import DonutChart from '../../components/charts/DonutChart';
import {
  calculateBestPerforming,
  transformExpenseData,
  transformRevenueData,
  calculateDairyPerformance,
  generateProfitLossData,
  calculatePerformanceCategories
} from '../../utils/chartDataTransformers';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [comprehensiveAnalytics, setComprehensiveAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  
  // Chart data states for dairy performance
  const [bestPerforming, setBestPerforming] = useState(null);
  const [profitLossData, setProfitLossData] = useState([]);
  const [expenseDonutData, setExpenseDonutData] = useState([]);
  const [revenueDonutData, setRevenueDonutData] = useState([]);
  const [dairyPerformance, setDairyPerformance] = useState(null);
  const [performanceCategories, setPerformanceCategories] = useState(null);

  // Initialize with current month dates
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    const initialRange = { fromDate, toDate };
    setDateRange(initialRange);
    fetchAllData(initialRange);
  }, []);

  const fetchAllData = async (targetDateRange) => {
    const range = targetDateRange || dateRange;
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchRevenueData(range),
        fetchComprehensiveAnalytics(range)
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueData = async (targetDateRange) => {
    try {
      const params = {};
      if (targetDateRange.fromDate) params.dateFrom = targetDateRange.fromDate;
      if (targetDateRange.toDate) params.dateTo = targetDateRange.toDate;

      const response = await api.get('/api/admin/revenue-analytics', { params });
      
      if (response.data.success) {
        const feedData = calculateFeedData();
        
        const mergedData = {
          ...response.data.data,
          summary: {
            ...response.data.data.summary,
            feedSalesToFarmers: feedData.feedSalesToFarmers,
            feedStockPurchases: feedData.feedStockPurchases,
            feedProfitLoss: feedData.feedProfitLoss,
            netCollectedAmount: response.data.data.summary.netCollectedAmount + feedData.feedSalesToFarmers,
            netPaidAmount: response.data.data.summary.netPaidAmount + feedData.feedStockPurchases,
            profitLoss: (response.data.data.summary.netCollectedAmount + feedData.feedSalesToFarmers) - 
                       (response.data.data.summary.netPaidAmount + feedData.feedStockPurchases)
          }
        };
        
        setData(mergedData);
        
        const icons = { Truck, ShoppingCart, Wheat };
        setBestPerforming(calculateBestPerforming(mergedData.summary, icons));
        setProfitLossData(generateProfitLossData(mergedData.summary));
        setExpenseDonutData(transformExpenseData(mergedData.summary));
        setRevenueDonutData(transformRevenueData(mergedData.summary));
        setDairyPerformance(calculateDairyPerformance(mergedData.summary));
        setPerformanceCategories(calculatePerformanceCategories(mergedData.summary));
      }
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      throw err;
    }
  };

  const fetchComprehensiveAnalytics = async (targetDateRange) => {
    try {
      const params = new URLSearchParams({
        t: Date.now().toString(),
        fromDate: targetDateRange.fromDate,
        toDate: targetDateRange.toDate
      });
      
      const response = await api.get(`/api/admin/comprehensive-analytics?${params}`);
      setComprehensiveAnalytics(response.data.data);
    } catch (err) {
      console.error('Error fetching comprehensive analytics:', err);
      throw err;
    }
  };

  const calculateFeedData = () => {
    try {
      const allFeedRequests = feedService.getFeedRequests();
      const approvedFeeds = allFeedRequests.filter(req => req.status.toLowerCase() === 'approved');
      
      let totalRevenue = 0;
      let totalCost = 0;
      
      approvedFeeds.forEach(req => {
        const quantity = req.requestedQuantity || 0;
        const revenue = req.totalAmount || 0;
        
        totalRevenue += revenue;
        
        const feedStock = feedService.getFeedStock(req.feedName);
        const purchasedRate = feedStock?.purchasedRate || 0;
        const cost = quantity * purchasedRate;
        totalCost += cost;
      });
      
      const totalProfit = totalRevenue - totalCost;
      
      return {
        feedSalesToFarmers: totalRevenue,
        feedStockPurchases: totalCost,
        feedProfitLoss: totalProfit
      };
    } catch (error) {
      console.error('[RevenueAnalytics] Error calculating feed data:', error);
      return {
        feedSalesToFarmers: 0,
        feedStockPurchases: 0,
        feedProfitLoss: 0
      };
    }
  };

  const handleDateRangeChange = (field, value) => {
    // If changing toDate, automatically adjust to end of month
    if (field === 'toDate' && value) {
      const selectedDate = new Date(value);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      // Get the last day of the selected month
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
      const adjustedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
      
      console.log('[Overview] Auto-adjusting toDate to end of month:', { 
        original: value, 
        adjusted: adjustedDate, 
        lastDay: lastDayOfMonth 
      });
      
      setDateRange(prev => ({
        ...prev,
        [field]: adjustedDate
      }));
    } else {
      setDateRange(prev => ({
        ...prev,
        [field]: value
      }));
    }
    setIsCustomDateRange(true);
  };

  const applyDateFilter = () => {
    if (dateRange.fromDate && dateRange.toDate) {
      fetchAllData(dateRange);
    }
  };

  const resetToCurrentMonth = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;
    
    const newRange = { fromDate, toDate };
    setDateRange(newRange);
    setIsCustomDateRange(false);
    fetchAllData(newRange);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare comprehensive analytics chart data
  const analytics = comprehensiveAnalytics || {};
  const {
    overview = {},
    users = { byRole: [] },
    milkCollection = { weeklyTrend: [], topFarmers: [], today: [] },
    deliveries = { todayStatus: [], topBuyers: [] },
    financial = { dailyTrend: [] },
    operations = { transport: {}, loans: [], animals: [] },
    employees = { milkCollectors: [] }
  } = analytics;

  const userRoleData = (users.byRole || []).map(role => ({
    name: role._id.charAt(0).toUpperCase() + role._id.slice(1) + 's',
    total: role.total || 0,
    approved: role.approved || 0,
    pending: (role.total || 0) - (role.approved || 0)
  }));

  const milkTrendData = (milkCollection.weeklyTrend || []).map(day => ({
    date: day._id,
    cowMilk: parseFloat((day.cowMilk || 0).toFixed(1)),
    buffaloMilk: parseFloat((day.buffaloMilk || 0).toFixed(1)),
    total: parseFloat(((day.cowMilk || 0) + (day.buffaloMilk || 0)).toFixed(1)),
    revenue: parseFloat((day.totalAmount || 0).toFixed(2))
  }));

  const revenueTrendData = (financial.dailyTrend || []).map(day => ({
    date: day._id,
    revenue: parseFloat((day.revenue || 0).toFixed(2))
  }));

  const loanPieChartData = analytics?.loans ? [
    {
      name: 'Total Requests',
      value: analytics.loans.overview.totalRequested || 0,
      color: '#6366F1'
    },
    {
      name: 'Total Approved', 
      value: analytics.loans.overview.totalApproved || 0,
      color: '#10B981'
    },
    {
      name: 'Total Returned',
      value: analytics.loans.overview.totalReturned || 0,
      color: '#14B8A6'
    },
    {
      name: 'Total Due',
      value: analytics.loans.overview.totalOutstanding || 0,
      color: '#EF4444'
    }
  ].filter(item => item.value > 0) : [];

  const healthStatuses = ['healthy', 'sick', 'pregnant', 'dry'];
  const healthColors = {
    'Healthy': '#10B981',
    'Sick': '#EF4444',
    'Pregnant': '#F59E0B',
    'Dry': '#6B7280'
  };
  
  const animalHealthData = healthStatuses.map(status => {
    const found = (operations.animals || []).find(animal => animal._id === status);
    const healthStatus = status.charAt(0).toUpperCase() + status.slice(1);
    return {
      healthStatus,
      count: found ? found.count : 0,
      avgMilkCapacity: found ? parseFloat((found.avgMilkCapacity || 0).toFixed(1)) : 0,
      farmerCount: found ? found.farmerCount : 0,
      color: healthColors[healthStatus]
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Compact Header with Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-4 mb-6 border border-white/50"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Dairy Performance Analytics
              </h1>
              <p className="text-gray-600 text-sm">
                Professional profit & loss analysis
              </p>
            </div>
          </div>

          {/* Date Range Filters - Inline */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.fromDate}
                onChange={(e) => handleDateRangeChange('fromDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-blue-300"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.toDate}
                onChange={(e) => handleDateRangeChange('toDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-blue-300"
              />
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={applyDateFilter}
                disabled={loading || !dateRange.fromDate || !dateRange.toDate}
                className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Apply
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetToCurrentMonth}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Current
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fetchAllData(dateRange)}
                disabled={loading}
                className="px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '...' : 'Refresh'}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 shadow-lg"
        >
          {error}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Best Performing Section */}
            {bestPerforming && <BestPerformingSection source={bestPerforming} />}

            {/* Dairy Performance Overview */}
            {dairyPerformance && (
              <div className="mb-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-800">Dairy Performance Overview</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DairyEfficiencyGauge 
                    efficiency={dairyPerformance.dairyEfficiency} 
                    title="Overall Efficiency"
                    delay={0.1}
                  />
                  <DairyEfficiencyGauge 
                    efficiency={Math.max(0, dairyPerformance.profitMargin)} 
                    title="Profit Margin"
                    delay={0.2}
                  />
                  <DairyEfficiencyGauge 
                    efficiency={Math.min(100, dairyPerformance.operationalEfficiency)} 
                    title="Operational Efficiency"
                    delay={0.3}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl shadow-md p-4 border border-gray-100 text-center"
                  >
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-800 mb-1">Performance Score</h3>
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {Math.round(dairyPerformance.dairyEfficiency)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {dairyPerformance.dairyEfficiency >= 80 ? 'Excellent' :
                       dairyPerformance.dairyEfficiency >= 60 ? 'Good' :
                       dairyPerformance.dairyEfficiency >= 40 ? 'Average' : 'Needs Improvement'}
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* Operational Performance Cards */}
            {performanceCategories && (
              <div className="mb-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-800">Operational Performance</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <DairyPerformanceCard
                    title="Milk Operations"
                    amount={performanceCategories.milkOperations.revenue}
                    icon={Truck}
                    gradientFrom="from-blue-500"
                    gradientTo="to-blue-600"
                    profitLoss={performanceCategories.milkOperations.profitLoss}
                    subtitle={`Expenses: ₹${performanceCategories.milkOperations.expenses.toLocaleString('en-IN')}`}
                    delay={0.1}
                  />
                  <DairyPerformanceCard
                    title="Feed Operations"
                    amount={performanceCategories.feedOperations.revenue}
                    icon={Wheat}
                    gradientFrom="from-yellow-500"
                    gradientTo="to-yellow-600"
                    profitLoss={performanceCategories.feedOperations.profitLoss}
                    subtitle={`Expenses: ₹${performanceCategories.feedOperations.expenses.toLocaleString('en-IN')}`}
                    delay={0.2}
                  />
                  <DairyPerformanceCard
                    title="Buyer Operations"
                    amount={performanceCategories.buyerOperations.revenue}
                    icon={ShoppingCart}
                    gradientFrom="from-green-500"
                    gradientTo="to-green-600"
                    profitLoss={performanceCategories.buyerOperations.profitLoss}
                    subtitle={`Expenses: ₹${performanceCategories.buyerOperations.expenses.toLocaleString('en-IN')}`}
                    delay={0.3}
                  />
                  <DairyPerformanceCard
                    title="Other Operations"
                    amount={0}
                    icon={FileText}
                    gradientFrom="from-red-500"
                    gradientTo="to-red-600"
                    profitLoss={performanceCategories.otherOperations.profitLoss}
                    subtitle={`Expenses: ₹${performanceCategories.otherOperations.expenses.toLocaleString('en-IN')}`}
                    delay={0.4}
                  />
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="mb-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">Financial Summary</h2>
              </motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DairyPerformanceCard
                  title="Total Revenue"
                  amount={data.summary.netCollectedAmount}
                  icon={TrendingUp}
                  gradientFrom="from-green-500"
                  gradientTo="to-emerald-600"
                  subtitle="All revenue streams combined"
                  delay={0.1}
                />
                <DairyPerformanceCard
                  title="Total Expenses"
                  amount={data.summary.netPaidAmount}
                  icon={TrendingDown}
                  gradientFrom="from-red-500"
                  gradientTo="to-rose-600"
                  subtitle="All operational costs"
                  delay={0.2}
                />
                <DairyPerformanceCard
                  title="Net Profit/Loss"
                  amount={Math.abs(data.summary.profitLoss)}
                  icon={DollarSign}
                  gradientFrom={data.summary.profitLoss >= 0 ? "from-green-600" : "from-red-600"}
                  gradientTo={data.summary.profitLoss >= 0 ? "to-emerald-700" : "to-rose-700"}
                  profitLoss={data.summary.profitLoss}
                  subtitle={`Margin: ${dairyPerformance ? dairyPerformance.profitMargin.toFixed(1) : '0'}%`}
                  delay={0.3}
                />
              </div>
            </div>

            {/* Profit & Loss Analysis Chart */}
            <div className="mb-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">Profit & Loss Trends</h2>
              </motion.div>
              <ProfitLossAnalysisChart data={profitLossData} loading={loading} />
            </div>

            {/* Distribution Analysis */}
            <div className="mb-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mb-4"
              >
                <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">Revenue & Expense Distribution</h2>
              </motion.div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DonutChart
                  title="Revenue Distribution"
                  data={revenueDonutData}
                  centerLabel="Total Revenue"
                  centerValue={data.summary.netCollectedAmount}
                  loading={loading}
                  delay={0.2}
                />
                <DonutChart
                  title="Expense Distribution"
                  data={expenseDonutData}
                  centerLabel="Total Expenses"
                  centerValue={data.summary.netPaidAmount}
                  loading={loading}
                  delay={0.4}
                />
              </div>
            </div>

            {/* System Analytics Section */}
            {comprehensiveAnalytics && (
              <>
                {/* Overview Cards */}
                <div className="mb-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-4"
                  >
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Users</p>
                          <p className="text-3xl font-bold">{overview.totalUsers || 0}</p>
                          <p className="text-blue-200 text-xs">Approved: {overview.totalApproved || 0}</p>
                        </div>
                        <div className="bg-blue-400 rounded-full p-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Total Milk (L)</p>
                          <p className="text-3xl font-bold">{(overview.totalMilkCollected || 0).toLocaleString()}</p>
                          <p className="text-green-200 text-xs">
                            {`${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="bg-green-400 rounded-full p-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Total Revenue</p>
                          <p className="text-3xl font-bold">₹{(overview.totalRevenue || 0).toLocaleString()}</p>
                          <p className="text-purple-200 text-xs">
                            {`${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="bg-purple-400 rounded-full p-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-100 text-sm">Total Deliveries</p>
                          <p className="text-3xl font-bold">{overview.totalDeliveries || 0}</p>
                          <p className="text-orange-200 text-xs">
                            {`${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="bg-orange-400 rounded-full p-3">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="mb-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 mb-4"
                  >
                    <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-800">Analytics Charts</h2>
                  </motion.div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* User Distribution */}
                    {userRoleData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={userRoleData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, total }) => `${name}: ${total}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="total"
                            >
                              {userRoleData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Milk Production Trends */}
                    {milkTrendData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Weekly Milk Production
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={milkTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [
                                `${parseFloat(value).toFixed(1)}L`, 
                                name === 'cowMilk' ? 'Cow Milk' : 'Buffalo Milk'
                              ]}
                            />
                            <Area type="monotone" dataKey="cowMilk" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="buffaloMilk" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Daily Revenue Trend */}
                    {revenueTrendData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Daily Revenue Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={revenueTrendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                            <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Loan Analytics */}
                    {loanPieChartData.length > 0 && (
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Loan Statistics</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={loanPieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {loanPieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Performance & Animal Health */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* System Performance */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4">System Performance</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{overview.todayRegistrations || 0}</div>
                          <div className="text-sm text-gray-600">Today's Registrations</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{(milkCollection.today || []).length}</div>
                          <div className="text-sm text-gray-600">Today's Collections</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{(deliveries.todayStatus || []).length}</div>
                          <div className="text-sm text-gray-600">Today's Orders</div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-gray-900">{(employees.milkCollectors || []).length}</div>
                          <div className="text-sm text-gray-600">Active Collectors</div>
                        </div>
                      </div>
                    </div>

                    {/* Operations Overview */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h3 className="text-lg font-semibold mb-4">Operations Overview</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                          <span className="text-sm font-medium">Transport Trips</span>
                          <span className="text-blue-600 font-bold">{operations.transport?.trips || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                          <span className="text-sm font-medium">Milk Transported</span>
                          <span className="text-green-600 font-bold">{operations.transport?.totalTransported || 0}L</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                          <span className="text-sm font-medium">Transport Cost</span>
                          <span className="text-purple-600 font-bold">₹{(operations.transport?.totalCost || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animal Health Statistics + Top Performers side by side */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Animal Health Statistics */}
                    <div>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-4"
                      >
                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-800">Animal Health Statistics</h2>
                      </motion.div>
                      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-100 p-5 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none" />
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">Health status distribution across all animals</p>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={animalHealthData} barCategoryGap="30%" barGap={4}>
                            <defs>
                              {animalHealthData.map((entry, index) => (
                                <linearGradient key={index} id={`ovHealthGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.55} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis 
                              dataKey="healthStatus" 
                              tick={{ fontSize: 12, fontWeight: 600, fill: '#6B7280' }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 11, fill: '#9CA3AF' }}
                              axisLine={false}
                              tickLine={false}
                              width={30}
                            />
                            <Tooltip
                              cursor={{ fill: 'rgba(0,0,0,0.04)', radius: 6 }}
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 min-w-[150px]">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                                      <span className="font-bold text-gray-800 text-sm">{label}</span>
                                    </div>
                                    <div className="space-y-1 text-xs text-gray-600">
                                      <div className="flex justify-between gap-4">
                                        <span>Animals</span>
                                        <span className="font-semibold text-gray-800">{d.count}</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span>Avg Milk</span>
                                        <span className="font-semibold text-gray-800">{d.avgMilkCapacity}L</span>
                                      </div>
                                      <div className="flex justify-between gap-4">
                                        <span>Farmers</span>
                                        <span className="font-semibold text-gray-800">{d.farmerCount}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                              {animalHealthData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#ovHealthGrad${index})`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                          {animalHealthData.map((animal, index) => (
                            <div
                              key={index}
                              className="relative rounded-xl p-3 overflow-hidden"
                              style={{ background: `${animal.color}12`, border: `1px solid ${animal.color}30` }}
                            >
                              <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-xl" style={{ background: animal.color }} />
                              <div className="pl-1.5">
                                <div className="text-2xl font-extrabold" style={{ color: animal.color }}>{animal.count}</div>
                                <div className="text-sm font-semibold text-gray-700 capitalize">{animal.healthStatus}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{animal.avgMilkCapacity}L · {animal.farmerCount} farmers</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Top Performers */}
                    <div>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 mb-4"
                      >
                        <div className="w-1 h-6 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-gray-800">Top Performers</h2>
                      </motion.div>
                      <div className="grid grid-cols-1 gap-4">
                        {/* Top Farmers */}
                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                            Top Farmers
                          </h3>
                          <div className="space-y-2.5">
                            {(milkCollection.topFarmers || []).slice(0, 5).map((farmer, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">{index + 1}</span>
                                  <div>
                                    <div className="font-semibold text-sm text-gray-800">{farmer.farmerInfo?.[0]?.username || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{farmer.entries} entries</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm text-green-700">{farmer.totalLiters}L</div>
                                  <div className="text-xs text-gray-500">₹{(farmer.totalAmount || 0).toLocaleString()}</div>
                                </div>
                              </div>
                            ))}
                            {(milkCollection.topFarmers || []).length === 0 && (
                              <div className="text-center text-gray-400 py-4 text-sm">No farmer data available</div>
                            )}
                          </div>
                        </div>

                        {/* Top Buyers */}
                        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
                          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                            Top Buyers
                          </h3>
                          <div className="space-y-2.5">
                            {(deliveries.topBuyers || []).slice(0, 5).map((buyer, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">{index + 1}</span>
                                  <div>
                                    <div className="font-semibold text-sm text-gray-800">{buyer.buyerInfo?.[0]?.username || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{buyer.orders} orders</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm text-blue-700">{buyer.totalQuantity}L</div>
                                  <div className="text-xs text-gray-500">₹{(buyer.totalAmount || 0).toLocaleString()}</div>
                                </div>
                              </div>
                            ))}
                            {(deliveries.topBuyers || []).length === 0 && (
                              <div className="text-center text-gray-400 py-4 text-sm">No buyer data available</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Overview;
