import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, Package, Warehouse, Users, DollarSign, TrendingUp, ArrowRight, RefreshCw
} from "lucide-react";
import feedService from "../../services/FeedService";
import loanService from "../../services/LoanService";
import { useEventBus } from "../../hooks/useEventBus";
import { EVENT_TYPES } from "../../constants/eventTypes";

export default function LoanFeedDashboard() {
  const [analytics, setAnalytics] = useState({
    loanAnalytics: {
      totalFarmersWithLoans: 0,
      totalLoanAmount: 0,
      approvedLoans: 0,
      pendingLoans: 0
    },
    feedAnalytics: {
      totalFarmersBuyingFeed: 0,
      totalFeedQuantitySold: 0,
      totalFeedRevenue: 0,
      activeFeedTypes: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();
  const { subscribe } = useEventBus('LoanFeedManagement');

  useEffect(() => {
    console.log('[Dashboard] ========== COMPONENT MOUNTED ==========');
    console.log('[Dashboard] subscribe function:', subscribe);
    console.log('[Dashboard] EVENT_TYPES:', EVENT_TYPES);
    loadInitialData();
    
    const unsubscribeRequestCreated = subscribe(EVENT_TYPES.FEED_REQUEST_CREATED, handleFeedUpdate);
    const unsubscribeRequestApproved = subscribe(EVENT_TYPES.FEED_REQUEST_APPROVED, handleFeedUpdate);
    const unsubscribeStockUpdate = subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, handleFeedUpdate);
    const unsubscribeLoanCreated = subscribe(EVENT_TYPES.LOAN_REQUEST_CREATED, handleLoanUpdate);
    const unsubscribeLoanApproved = subscribe(EVENT_TYPES.LOAN_REQUEST_APPROVED, handleLoanUpdate);

    return () => {
      unsubscribeRequestCreated();
      unsubscribeRequestApproved();
      unsubscribeStockUpdate();
      unsubscribeLoanCreated();
      unsubscribeLoanApproved();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      console.log('[Dashboard] Loading initial data...');
      await loadAnalytics();
    } catch (error) {
      console.error('[Dashboard] Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedUpdate = () => {
    console.log('[Dashboard] Feed update event received - reloading analytics');
    loadAnalytics();
  };

  const handleLoanUpdate = () => {
    console.log('[Dashboard] Loan update event received - reloading analytics');
    loadAnalytics();
  };

  const loadAnalytics = async () => {
    try {
      console.log('[Dashboard] ========== LOADING ANALYTICS ==========');
      
      // Step 1: Get feed requests from FeedService
      console.log('[Dashboard] Step 1 - Getting feed requests from FeedService...');
      const allFeedRequests = feedService.getFeedRequests();
      const allFeedStocks = feedService.getAllFeedStocks();
      
      console.log('[Dashboard] Step 1 - Service data:');
      console.log('  - Total feed requests:', allFeedRequests.length);
      console.log('  - Total feed stocks:', allFeedStocks.length);
      console.log('  - All feed requests:', allFeedRequests);
      
      // Step 2: Filter approved requests
      console.log('[Dashboard] Step 2 - Filtering approved requests...');
      const approvedRequests = allFeedRequests.filter(req => {
        const status = req.status || '';
        const statusLower = status.toLowerCase();
        const isApproved = statusLower === 'approved';
        
        console.log(`  Request ID: ${req.id}`);
        console.log(`    - Farmer: ${req.farmerName}`);
        console.log(`    - Status: "${status}"`);
        console.log(`    - Status (lowercase): "${statusLower}"`);
        console.log(`    - Is Approved: ${isApproved}`);
        console.log(`    - Quantity: ${req.requestedQuantity}`);
        console.log(`    - Amount: ${req.totalAmount}`);
        
        return isApproved;
      });
      
      console.log('[Dashboard] Step 2 - Filtering complete:');
      console.log('  - Approved requests found:', approvedRequests.length);
      console.log('  - Approved requests:', approvedRequests);
      
      // Step 3: Calculate analytics
      console.log('[Dashboard] Step 3 - Calculating analytics...');
      
      const uniqueFarmers = new Set();
      let totalQuantity = 0;
      let totalRevenue = 0;
      
      approvedRequests.forEach((req, index) => {
        const farmerId = req.farmerId || '';
        const quantity = req.requestedQuantity || 0;
        const amount = req.totalAmount || 0;
        
        console.log(`  [${index}] Processing approved request:`);
        console.log(`      - Farmer ID: ${farmerId}`);
        console.log(`      - Quantity: ${quantity}`);
        console.log(`      - Amount: ${amount}`);
        
        if (farmerId) {
          uniqueFarmers.add(farmerId);
        }
        totalQuantity += quantity;
        totalRevenue += amount;
      });
      
      const activeFeedTypes = allFeedStocks.filter(stock => 
        stock.availableQuantity && stock.availableQuantity > 0
      ).length;
      
      console.log('[Dashboard] Step 3 - Calculations complete:');
      console.log('  - Unique farmers:', uniqueFarmers.size);
      console.log('  - Total quantity:', totalQuantity);
      console.log('  - Total revenue:', totalRevenue);
      console.log('  - Active feed types:', activeFeedTypes);
      
      // Step 4: Load loan analytics
      console.log('[Dashboard] Step 4 - Loading loan analytics...');
      const loanAnalytics = loanService.getLoanAnalytics();
      console.log('  - Loan analytics:', loanAnalytics);
      
      // Step 5: Update state
      console.log('[Dashboard] Step 5 - Updating state...');
      const newAnalytics = {
        loanAnalytics: {
          totalFarmersWithLoans: loanAnalytics.totalFarmersWithLoans || 0,
          totalLoanAmount: loanAnalytics.totalApprovedAmount || 0,
          approvedLoans: loanAnalytics.approvedLoans || 0,
          pendingLoans: loanAnalytics.requestedLoans || 0
        },
        feedAnalytics: {
          totalFarmersBuyingFeed: uniqueFarmers.size,
          totalFeedQuantitySold: totalQuantity,
          totalFeedRevenue: totalRevenue,
          activeFeedTypes: activeFeedTypes
        }
      };
      
      console.log('[Dashboard] Step 5 - New analytics state:', newAnalytics);
      setAnalytics(newAnalytics);
      
      setDebugInfo({
        totalRequests: allFeedRequests.length,
        approvedCount: approvedRequests.length,
        uniqueFarmers: uniqueFarmers.size,
        totalQuantity,
        totalRevenue
      });
      
      console.log('[Dashboard] ========== ANALYTICS LOADED SUCCESSFULLY ==========');
    } catch (error) {
      console.error('[Dashboard] ========== ERROR LOADING ANALYTICS ==========');
      console.error('[Dashboard] Error:', error);
      console.error('[Dashboard] Error stack:', error.stack);
      setDebugInfo(`Error: ${error.message}`);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      console.log('[Dashboard] ========== MANUAL REFRESH TRIGGERED ==========');
      await loadAnalytics();
    } catch (error) {
      console.error('[Dashboard] Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Loan & Feed Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan & Feed Management</h1>
              <p className="text-gray-600">Comprehensive analytics and management dashboard</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Debug Info Banner */}
        {debugInfo && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">Debug Info (Check Console for Details):</p>
            <pre className="text-xs text-blue-800 overflow-x-auto">
              {typeof debugInfo === 'string' ? debugInfo : JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Farmers with Loans */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Farmers with Loans</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.loanAnalytics.totalFarmersWithLoans}
                </p>
              </div>
              <Users className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          {/* Total Loan Amount */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Loan Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(analytics.loanAnalytics.totalLoanAmount)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500" />
            </div>
          </div>

          {/* Farmers Buying Feed */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Farmers Buying Feed</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.feedAnalytics.totalFarmersBuyingFeed}
                </p>
              </div>
              <Package className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          {/* Total Feed Sold */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feed Sold (kg)</p>
                <p className="text-3xl font-bold text-orange-600">
                  {analytics.feedAnalytics.totalFeedQuantitySold}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Loan Management Button */}
          <button
            onClick={() => navigate('/loanfeed/loan-management')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-purple-100 rounded-full p-6 mb-6 group-hover:bg-purple-200 transition-colors">
                <CreditCard className="h-12 w-12 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Loan Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Manage loan requests, approvals, and farmer loan history. Track pending applications and approved loans.
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700">
                <span>Manage Loans</span>
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Feed Management Button */}
          <button
            onClick={() => navigate('/loanfeed/feed-management')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 rounded-full p-6 mb-6 group-hover:bg-blue-200 transition-colors">
                <Package className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Feed Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Handle feed requests, approvals, and farmer feed purchase history. Monitor feed sales and deliveries.
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700">
                <span>Manage Feed</span>
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          {/* Feed Stock Management Button */}
          <button
            onClick={() => navigate('/loanfeed/feed-stock-management')}
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-200 group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-100 rounded-full p-6 mb-6 group-hover:bg-indigo-200 transition-colors">
                <Warehouse className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Feed Stock Management</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Update feed inventory, manage stock levels, and adjust prices. Monitor available quantities and stock status.
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                <span>Manage Stock</span>
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {analytics.loanAnalytics.pendingLoans}
              </p>
              <p className="text-sm text-gray-600">Pending Loan Requests</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {analytics.loanAnalytics.approvedLoans}
              </p>
              <p className="text-sm text-gray-600">Active Loans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {analytics.feedAnalytics.activeFeedTypes}
              </p>
              <p className="text-sm text-gray-600">Feed Types Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(analytics.feedAnalytics.totalFeedRevenue)}
              </p>
              <p className="text-sm text-gray-600">Total Feed Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
