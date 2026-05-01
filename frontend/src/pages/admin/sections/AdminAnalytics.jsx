import { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar
} from 'recharts';
import api from '../../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date filtering state
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  // Initialize with current month dates
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Create dates in local timezone to avoid UTC issues
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    // Format dates properly for local timezone
    const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
    
    const currentMonthRange = {
      fromDate,
      toDate
    };
    
    console.log('🗓️ Initializing with current month:', currentMonthRange);
    console.log('🗓️ Current date:', now);
    console.log('🗓️ Year:', year, 'Month:', month + 1);
    
    setDateRange(currentMonthRange);
  }, []);

  useEffect(() => {
    console.log('🔄 useEffect triggered with dateRange:', dateRange, 'isCustomDateRange:', isCustomDateRange);
    
    if (dateRange.fromDate && dateRange.toDate) {
      fetchAnalytics();
    }
    
    // Set up auto-refresh every 2 minutes only if not using custom date range
    let interval;
    if (!isCustomDateRange) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refresh triggered');
        fetchAnalytics();
      }, 120000); // 2 minutes
    }

    return () => {
      if (interval) {
        console.log('🔄 Clearing auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [dateRange.fromDate, dateRange.toDate, isCustomDateRange]);

  const fetchAnalytics = async () => {
    await fetchAnalyticsWithDateRange();
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
    setIsCustomDateRange(true);
  };

  const resetToCurrentMonth = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // Create dates in local timezone to avoid UTC issues
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    
    // Format dates properly for local timezone
    const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
    
    const newDateRange = {
      fromDate,
      toDate
    };
    
    console.log('🔄 Resetting to current month:', newDateRange);
    console.log('🔄 Current date:', now);
    console.log('🔄 Year:', year, 'Month:', month + 1);
    console.log('🔄 Previous dateRange state:', dateRange);
    
    // Force complete refresh
    setAnalytics(null);
    setLoading(true);
    setError(null);
    
    // Update state first
    setDateRange(newDateRange);
    setIsCustomDateRange(false);
    
    // Add a small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Force immediate fetch with new date range and cache busting
    try {
      const params = new URLSearchParams({
        t: Date.now().toString(),
        fromDate: newDateRange.fromDate,
        toDate: newDateRange.toDate,
        forceRefresh: 'true',
        currentMonth: 'true'
      });
      
      console.log('🔄 Fetching current month with params:', params.toString());
      console.log('🔄 API URL:', `/api/admin/comprehensive-analytics?${params}`);
      
      const response = await api.get(`/api/admin/comprehensive-analytics?${params}`);
      console.log('✅ Current month analytics response:', response.data);
      
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching current month analytics:', err);
      setError(`Failed to load analytics: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsWithDateRange = async (customDateRange = null) => {
    const targetDateRange = customDateRange || dateRange;
    
    console.log('🔄 fetchAnalyticsWithDateRange called with:', {
      customDateRange,
      targetDateRange,
      currentDateRangeState: dateRange
    });
    
    try {
      setLoading(true);
      console.log('🔄 Fetching analytics for date range:', targetDateRange);
      
      const params = new URLSearchParams({
        t: Date.now().toString(),
        fromDate: targetDateRange.fromDate,
        toDate: targetDateRange.toDate
      });
      
      console.log('🔄 API call URL:', `/api/admin/comprehensive-analytics?${params}`);
      
      const response = await api.get(`/api/admin/comprehensive-analytics?${params}`);
      console.log('✅ Analytics response:', response.data);
      
      setAnalytics(response.data.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching analytics:', err);
      setError(`Failed to load analytics: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = () => {
    if (dateRange.fromDate && dateRange.toDate) {
      fetchAnalytics();
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
          <p className="text-xs text-gray-400">Fetching real-time data from database</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button 
                onClick={fetchAnalytics}
                className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-gray-600">No analytics data available</p>
          <button 
            onClick={fetchAnalytics}
            className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
            Retry Loading Data
          </button>
        </div>
      </div>
    );
  }

  const {
    overview = {},
    users = { byRole: [] },
    milkCollection = { weeklyTrend: [], topFarmers: [], today: [] },
    deliveries = { todayStatus: [], topBuyers: [] },
    financial = { dailyTrend: [] },
    operations = { transport: {}, loans: [], animals: [] },
    employees = { milkCollectors: [] }
  } = analytics;

  // Prepare chart data with safety checks
  const userRoleData = (users.byRole || []).map(role => ({
    name: role._id.charAt(0).toUpperCase() + role._id.slice(1) + 's',
    total: role.total || 0,
    approved: role.approved || 0,
    pending: (role.total || 0) - (role.approved || 0)
  }));

  // Debug user role data
  console.log('📈 Processed userRoleData:', userRoleData);
  const employeeRoleData = userRoleData.find(role => role.name === 'Employees');
  if (employeeRoleData) {
    console.log('👨‍💼 Employee role data for chart:', employeeRoleData);
  }

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

  // Prepare loan analytics pie chart data
  const loanPieChartData = analytics?.loans ? [
    {
      name: 'Total Requests',
      value: analytics.loans.overview.totalRequested || 0,
      color: '#6366F1' // Indigo
    },
    {
      name: 'Total Approved', 
      value: analytics.loans.overview.totalApproved || 0,
      color: '#10B981' // Emerald
    },
    {
      name: 'Total Returned',
      value: analytics.loans.overview.totalReturned || 0,
      color: '#14B8A6' // Teal
    },
    {
      name: 'Total Due',
      value: analytics.loans.overview.totalOutstanding || 0,
      color: '#EF4444' // Red
    }
  ].filter(item => item.value > 0) : []; // Only show items with values > 0

  // Prepare animal health chart data - always show all 4 health statuses
  const healthStatuses = ['healthy', 'sick', 'pregnant', 'dry'];
  const healthColors = {
    'Healthy': '#10B981',   // Green
    'Sick': '#EF4444',      // Red  
    'Pregnant': '#F59E0B',  // Orange
    'Dry': '#6B7280'        // Gray
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
    <div className="p-6 space-y-6">
      {/* Header with Date Range Picker */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">Dairy Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time performance analysis and insights</p>
            <p className="text-xs text-gray-400">
              Data for: {new Date(dateRange.fromDate).toLocaleDateString()} - {new Date(dateRange.toDate).toLocaleDateString()}
              {analytics?.metadata?.generatedAt && ` | Last updated: ${new Date(analytics.metadata.generatedAt).toLocaleString()}`}
            </p>
          </div>
          
          {/* Date Range Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.fromDate}
                onChange={(e) => handleDateRangeChange('fromDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.toDate}
                onChange={(e) => handleDateRangeChange('toDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={applyDateFilter}
                disabled={loading || !dateRange.fromDate || !dateRange.toDate}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Apply
              </button>
              
              <button
                onClick={resetToCurrentMonth}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Current Month
              </button>
              
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              Milk Production Trend 
              {` (${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()})`}
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

        {/* Revenue Trend */}
        {revenueTrendData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
              Revenue Trend
              {` (${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()})`}
            </h3>
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

        {/* Loan Analytics Pie Chart */}
        {loanPieChartData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Loan Analytics Distribution</h3>
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

        {/* System Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            System Performance
            {analytics.metadata?.generatedAt && 
              ` (as of ${new Date(analytics.metadata.generatedAt).toLocaleDateString()})`
            }
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{overview.todayRegistrations || 0}</div>
              <div className="text-sm text-gray-600">
                {analytics.metadata?.dateRanges?.today ? 
                  `Registrations (${new Date(analytics.metadata.dateRanges.today.start).toLocaleDateString()})` : 
                  "Today's Registrations"
                }
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(milkCollection.today || []).length}</div>
              <div className="text-sm text-gray-600">
                {analytics.metadata?.dateRanges?.today ? 
                  `Collections (${new Date(analytics.metadata.dateRanges.today.start).toLocaleDateString()})` : 
                  "Today's Collections"
                }
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(deliveries.todayStatus || []).length}</div>
              <div className="text-sm text-gray-600">
                {analytics.metadata?.dateRanges?.today ? 
                  `Orders (${new Date(analytics.metadata.dateRanges.today.start).toLocaleDateString()})` : 
                  "Today's Orders"
                }
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{(employees.milkCollectors || []).length}</div>
              <div className="text-sm text-gray-600">Active Collectors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
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

        {/* Animal Health Statistics Bar Chart */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-100 p-4 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-60 pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Animal Health Statistics</h3>
              <p className="text-xs text-gray-500">Health status distribution</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={animalHealthData} barCategoryGap="30%" barGap={4}>
              <defs>
                {animalHealthData.map((entry, index) => (
                  <linearGradient key={index} id={`healthGrad${index}`} x1="0" y1="0" x2="0" y2="1">
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
                  <Cell key={`cell-${index}`} fill={`url(#healthGrad${index})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
            {animalHealthData.map((animal, index) => (
              <div
                key={index}
                className="relative rounded-lg p-2 overflow-hidden"
                style={{ background: `${animal.color}12`, border: `1px solid ${animal.color}30` }}
              >
                <div className="absolute top-0 left-0 w-1 h-full rounded-l-lg" style={{ background: animal.color }} />
                <div className="pl-1">
                  <div className="text-lg font-extrabold" style={{ color: animal.color }}>{animal.count}</div>
                  <div className="text-xs font-semibold text-gray-700 capitalize">{animal.healthStatus}</div>
                  <div className="text-xs text-gray-500">{animal.avgMilkCapacity}L · {animal.farmerCount} farmers</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Farmers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top Farmers
            {` (${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()})`}
          </h3>
          <div className="space-y-3">
            {(milkCollection.topFarmers || []).slice(0, 5).map((farmer, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{farmer.farmerInfo?.[0]?.username || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">{farmer.entries} entries</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{farmer.totalLiters}L</div>
                  <div className="text-sm text-gray-600">₹{(farmer.totalAmount || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {(milkCollection.topFarmers || []).length === 0 && (
              <div className="text-center text-gray-500 py-4">No farmer data available</div>
            )}
          </div>
        </div>

        {/* Top Buyers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Top Buyers
            {` (${new Date(dateRange.fromDate).toLocaleDateString()} - ${new Date(dateRange.toDate).toLocaleDateString()})`}
          </h3>
          <div className="space-y-3">
            {(deliveries.topBuyers || []).slice(0, 5).map((buyer, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{buyer.buyerInfo?.[0]?.username || 'Unknown'}</div>
                  <div className="text-sm text-gray-600">{buyer.orders} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{buyer.totalQuantity}L</div>
                  <div className="text-sm text-gray-600">₹{(buyer.totalAmount || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {(deliveries.topBuyers || []).length === 0 && (
              <div className="text-center text-gray-500 py-4">No buyer data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;