import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CreditCard, Package, Warehouse, Users, DollarSign, TrendingUp, ArrowRight, ArrowLeft
} from "lucide-react";
import feedService from "../../services/FeedService";
import loanService from "../../services/LoanService";
import { useEventBus } from "../../hooks/useEventBus";
import { EVENT_TYPES } from "../../constants/eventTypes";
import { REQUEST_STATUS } from "../../constants/feedTypes";

export default function LoanFeedManagement() {
  // Analytics State
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
      activeFeedTypes: 6
    }
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { subscribe } = useEventBus('LoanFeedManagement');

  useEffect(() => {
    loadInitialData();
    
    // Subscribe to real-time updates
    const unsubscribeRequestCreated = subscribe(EVENT_TYPES.FEED_REQUEST_CREATED, loadFeedAnalytics);
    const unsubscribeRequestApproved = subscribe(EVENT_TYPES.FEED_REQUEST_APPROVED, loadFeedAnalytics);
    const unsubscribeStockUpdate = subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, loadFeedAnalytics);
    const unsubscribeLoanCreated = subscribe(EVENT_TYPES.LOAN_REQUEST_CREATED, loadFeedAnalytics);
    const unsubscribeLoanApproved = subscribe(EVENT_TYPES.LOAN_REQUEST_APPROVED, loadFeedAnalytics);

    return () => {
      unsubscribeRequestCreated();
      unsubscribeRequestApproved();
      unsubscribeStockUpdate();
      unsubscribeLoanCreated();
      unsubscribeLoanApproved();
    };
  }, [subscribe]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadFeedAnalytics();
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  const loadFeedAnalytics = async () => {
    try {
      // Get real feed analytics from service
      const feedRequests = feedService.getFeedRequests();
      const feedStocks = feedService.getAllFeedStocks();
      
      // Calculate feed analytics
      const approvedRequests = feedRequests.filter(req => req.status === REQUEST_STATUS.APPROVED);
      const uniqueFarmers = new Set(approvedRequests.map(req => req.farmerId));
      
      const totalQuantitySold = approvedRequests.reduce((sum, req) => sum + req.requestedQuantity, 0);
      const totalRevenue = approvedRequests.reduce((sum, req) => sum + req.totalAmount, 0);

      // Get real loan analytics from service
      const loanAnalytics = loanService.getLoanAnalytics();
      
      setAnalytics({
        loanAnalytics: {
          totalFarmersWithLoans: loanAnalytics.totalFarmersWithLoans,
          totalLoanAmount: loanAnalytics.totalLoanAmount,
          approvedLoans: loanAnalytics.approvedLoans,
          pendingLoans: loanAnalytics.pendingLoans
        },
        feedAnalytics: {
          totalFarmersBuyingFeed: uniqueFarmers.size,
          totalFeedQuantitySold: totalQuantitySold,
          totalFeedRevenue: totalRevenue,
          activeFeedTypes: feedStocks.filter(stock => stock.availableQuantity > 0).length
        }
      });
    } catch (error) {
      console.error('Error loading feed analytics:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleNavigateToLoanManagement = () => {
    navigate('/employee/loan-management');
  };

  const handleNavigateToFeedManagement = () => {
    navigate('/employee/feed-management');
  };

  const handleNavigateToFeedStockManagement = () => {
    navigate('/employee/feed-stock-management');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan & Feed Management</h1>
          <p className="text-gray-600">Comprehensive analytics and management dashboard</p>
        </div>

        {/* Analytics Cards (Read-only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Total Farmers with Loans */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Farmers with Loans</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.loanAnalytics.totalFarmersWithLoans}</p>
              </div>
              <Users className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          {/* Total Loan Amount */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Loan Amount</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(analytics.loanAnalytics.totalLoanAmount)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500" />
            </div>
          </div>

          {/* Farmers Buying Feed */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Farmers Buying Feed</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.feedAnalytics.totalFarmersBuyingFeed}</p>
              </div>
              <Package className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          {/* Total Feed Sold */}
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Feed Sold (kg)</p>
                <p className="text-3xl font-bold text-orange-600">{analytics.feedAnalytics.totalFeedQuantitySold}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Loan Management Button */}
          <button
            onClick={handleNavigateToLoanManagement}
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
            onClick={handleNavigateToFeedManagement}
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
            onClick={handleNavigateToFeedStockManagement}
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
              <p className="text-2xl font-bold text-gray-800">{analytics.loanAnalytics.pendingLoans}</p>
              <p className="text-sm text-gray-600">Pending Loan Requests</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{analytics.loanAnalytics.approvedLoans}</p>
              <p className="text-sm text-gray-600">Active Loans</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{analytics.feedAnalytics.activeFeedTypes}</p>
              <p className="text-sm text-gray-600">Feed Types Available</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(analytics.feedAnalytics.totalFeedRevenue)}</p>
              <p className="text-sm text-gray-600">Total Feed Revenue</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}