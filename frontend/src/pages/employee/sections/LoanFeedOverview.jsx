import { useState, useEffect } from "react";
import { DollarSign, Package, AlertTriangle, TrendingUp, Wheat } from "lucide-react";
import api from "../../../services/api";
import feedService from "../../../services/FeedService";
import { useEventBus } from "../../../hooks/useEventBus";
import { EVENT_TYPES } from "../../../constants/eventTypes";

export default function LoanFeedOverview() {
  const [dashboardData, setDashboardData] = useState(null);
  const [stockAlerts, setStockAlerts] = useState({ lowStockAlerts: 0, outOfStockAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { subscribe } = useEventBus('LoanFeedOverview');

  useEffect(() => {
    console.log('[LoanFeedOverview] Component mounted');
    fetchDashboardData();
    fetchStockAlerts();

    // Subscribe to real-time updates
    const unsubscribeFeedApproved = subscribe(EVENT_TYPES.FEED_REQUEST_APPROVED, () => {
      console.log('[LoanFeedOverview] Feed approved event - refreshing data');
      fetchDashboardData();
      fetchStockAlerts();
    });

    const unsubscribeFeedCreated = subscribe(EVENT_TYPES.FEED_REQUEST_CREATED, () => {
      console.log('[LoanFeedOverview] Feed created event - refreshing data');
      fetchDashboardData();
    });

    const unsubscribeStockUpdated = subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, () => {
      console.log('[LoanFeedOverview] Stock updated event - refreshing alerts');
      fetchStockAlerts();
    });

    return () => {
      unsubscribeFeedApproved();
      unsubscribeFeedCreated();
      unsubscribeStockUpdated();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('[LoanFeedOverview] Fetching dashboard data...');
      
      // Get feed data from localStorage via FeedService
      const allFeedRequests = feedService.getFeedRequests();
      console.log('[LoanFeedOverview] Total feed requests:', allFeedRequests.length);
      
      // Filter by status
      const pendingFeeds = allFeedRequests.filter(req => req.status.toLowerCase() === 'pending');
      const approvedFeeds = allFeedRequests.filter(req => req.status.toLowerCase() === 'approved');
      const deliveredFeeds = allFeedRequests.filter(req => req.status.toLowerCase() === 'delivered');
      
      console.log('[LoanFeedOverview] Pending:', pendingFeeds.length, 'Approved:', approvedFeeds.length, 'Delivered:', deliveredFeeds.length);
      
      // Calculate feed summary from approved requests
      const uniqueFarmers = new Set();
      let totalQuantity = 0;
      let totalAmount = 0;
      let totalCost = 0; // Total cost based on purchased rate
      let totalProfit = 0; // Profit = Revenue - Cost
      
      approvedFeeds.forEach(req => {
        if (req.farmerId) uniqueFarmers.add(req.farmerId);
        const quantity = req.requestedQuantity || 0;
        const revenue = req.totalAmount || 0;
        
        totalQuantity += quantity;
        totalAmount += revenue;
        
        // Calculate cost based on purchased rate from feed stock
        const feedStock = feedService.getFeedStock(req.feedName);
        if (feedStock) {
          const cost = quantity * (feedStock.purchasedRate || 0);
          totalCost += cost;
        }
      });
      
      totalProfit = totalAmount - totalCost;
      
      console.log('[LoanFeedOverview] Feed summary - Farmers:', uniqueFarmers.size, 'Quantity:', totalQuantity, 'Revenue:', totalAmount, 'Cost:', totalCost, 'Profit:', totalProfit);
      
      // Structure data to match the expected format
      const feedStats = {
        pending: {
          count: pendingFeeds.length,
          totalQuantity: pendingFeeds.reduce((sum, req) => sum + (req.requestedQuantity || 0), 0)
        },
        approved: {
          count: approvedFeeds.length,
          totalQuantity: approvedFeeds.reduce((sum, req) => sum + (req.requestedQuantity || 0), 0)
        },
        delivered: {
          count: deliveredFeeds.length,
          totalQuantity: deliveredFeeds.reduce((sum, req) => sum + (req.requestedQuantity || 0), 0)
        }
      };
      
      const feedSummary = {
        uniqueFarmers: uniqueFarmers.size,
        totalRequests: approvedFeeds.length,
        totalQuantity: totalQuantity,
        totalAmount: totalAmount,
        totalCost: totalCost,
        totalProfit: totalProfit
      };
      
      // Get recent feeds (last 10)
      const recentFeeds = allFeedRequests
        .sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate))
        .slice(0, 10)
        .map(req => ({
          _id: req.id,
          farmer: { username: req.farmerName },
          feedType: req.feedName,
          quantity: req.requestedQuantity,
          status: req.status.toLowerCase()
        }));
      
      // Try to get loan data from backend, fallback to LoanService
      let loanStats = null;
      let recentLoans = [];
      
      try {
        const response = await api.get('/api/loanfeed/dashboard');
        loanStats = response.data.data.loanStats;
        recentLoans = response.data.data.recentLoans || [];
        console.log('[LoanFeedOverview] Loan data from backend:', loanStats);
      } catch (err) {
        console.log('[LoanFeedOverview] Backend unavailable, using empty loan data');
        // Fallback to empty loan data
        loanStats = {
          approved: { count: 0, totalApproved: 0, totalDue: 0 },
          partially_paid: { count: 0, totalApproved: 0, totalDue: 0 },
          fully_cleared: { count: 0, totalApproved: 0 },
          closed: { count: 0, totalApproved: 0 }
        };
      }
      
      setDashboardData({
        loanStats,
        feedStats,
        feedSummary,
        recentLoans,
        recentFeeds
      });
      
      console.log('[LoanFeedOverview] Dashboard data updated successfully');
    } catch (err) {
      console.error('[LoanFeedOverview] Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockAlerts = async () => {
    try {
      // Get stock data from FeedService
      const stockData = feedService.getAllFeedStocks();
      
      // Send to backend for calculation
      const response = await api.post('/api/loanfeed/stock-alerts', {
        stockData: stockData
      });
      
      setStockAlerts(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stock alerts:', err);
      // Fallback to local calculation
      const stockData = feedService.getAllFeedStocks();
      const lowStockItems = stockData.filter(stock => 
        stock.availableQuantity > 0 && stock.availableQuantity < 200
      );
      const outOfStockItems = stockData.filter(stock => 
        stock.availableQuantity === 0
      );
      
      setStockAlerts({
        lowStockAlerts: lowStockItems.length,
        outOfStockAlerts: outOfStockItems.length
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const { loanStats, feedStats, feedSummary, recentLoans, recentFeeds } = dashboardData || {};

  const statCards = [
    {
      title: "Total Loan Approved",
      value: ((loanStats?.approved?.count || 0) + (loanStats?.partially_paid?.count || 0) + (loanStats?.fully_cleared?.count || 0) + (loanStats?.closed?.count || 0)),
      subtitle: `₹${((loanStats?.approved?.totalApproved || 0) + (loanStats?.partially_paid?.totalApproved || 0) + (loanStats?.fully_cleared?.totalApproved || 0) + (loanStats?.closed?.totalApproved || 0)).toLocaleString()}`,
      icon: DollarSign,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Total Loan Cleared",
      value: (loanStats?.fully_cleared?.count || 0) + (loanStats?.closed?.count || 0),
      subtitle: `₹${((loanStats?.fully_cleared?.totalApproved || 0) + (loanStats?.closed?.totalApproved || 0)).toLocaleString()}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Total Loan Due",
      value: (loanStats?.approved?.count || 0) + (loanStats?.partially_paid?.count || 0),
      subtitle: `₹${((loanStats?.approved?.totalDue || 0) + (loanStats?.partially_paid?.totalDue || 0)).toLocaleString()}`,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      title: "Total Feed Approved",
      value: feedSummary?.uniqueFarmers || 0,
      subtitle: `${feedSummary?.totalRequests || 0} requests`,
      icon: Wheat,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      title: "Total Feed KG",
      value: `${(feedSummary?.totalQuantity || 0).toLocaleString()} kg`,
      subtitle: "Total feed sold",
      icon: Package,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-indigo-200"
    },
    {
      title: "Total Feed Revenue",
      value: `₹${(feedSummary?.totalAmount || 0).toLocaleString()}`,
      subtitle: "Total revenue",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    },
    {
      title: "Total Feed Cost",
      value: `₹${(feedSummary?.totalCost || 0).toLocaleString()}`,
      subtitle: "Purchase cost",
      icon: DollarSign,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200"
    },
    {
      title: "Total Feed Profit",
      value: `₹${(feedSummary?.totalProfit || 0).toLocaleString()}`,
      subtitle: `${feedSummary?.totalProfit >= 0 ? 'Profit' : 'Loss'}`,
      icon: TrendingUp,
      color: feedSummary?.totalProfit >= 0 ? "text-green-600" : "text-red-600",
      bgColor: feedSummary?.totalProfit >= 0 ? "bg-green-50" : "bg-red-50",
      borderColor: feedSummary?.totalProfit >= 0 ? "border-green-200" : "border-red-200"
    },
    {
      title: "Low Stock Alerts",
      value: stockAlerts.lowStockAlerts || 0,
      subtitle: "Items need restocking",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      title: "Out of Stock",
      value: stockAlerts.outOfStockAlerts || 0,
      subtitle: "Items out of stock",
      icon: Package,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loan & Feed Management</h1>
          <p className="text-gray-600">Manage farmer loans and feed distribution</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Wheat className="h-4 w-4" />
          <span>Loan & Feed Manager Portal</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Loan & Feed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Loan Status Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved Loans</span>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">{loanStats?.approved?.count || 0}</div>
                <div className="text-xs text-gray-500">₹{(loanStats?.approved?.totalApproved || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Partially Paid</span>
              <div className="text-right">
                <div className="text-sm font-medium text-yellow-600">{loanStats?.partially_paid?.count || 0}</div>
                <div className="text-xs text-gray-500">₹{(loanStats?.partially_paid?.totalDue || 0).toLocaleString()} due</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fully Cleared</span>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">{loanStats?.fully_cleared?.count || 0}</div>
                <div className="text-xs text-gray-500">₹{(loanStats?.fully_cleared?.totalApproved || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feed Status Overview</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Requests</span>
              <div className="text-right">
                <div className="text-sm font-medium text-yellow-600">{feedStats?.pending?.count || 0}</div>
                <div className="text-xs text-gray-500">{feedStats?.pending?.totalQuantity || 0} kg</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved Requests</span>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">{feedStats?.approved?.count || 0}</div>
                <div className="text-xs text-gray-500">{feedStats?.approved?.totalQuantity || 0} kg</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivered</span>
              <div className="text-right">
                <div className="text-sm font-medium text-green-600">{feedStats?.delivered?.count || 0}</div>
                <div className="text-xs text-gray-500">{feedStats?.delivered?.totalQuantity || 0} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Loans</h2>
          <div className="space-y-3">
            {recentLoans?.slice(0, 5).map((loan) => (
              <div key={loan._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {loan.farmer?.username || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">{loan.purpose}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{(loan.approvedAmount || loan.requestedAmount || 0).toLocaleString()}
                  </div>
                  <div className={`text-xs ${
                    loan.status === 'approved' ? 'text-blue-600' :
                    loan.status === 'partially_paid' ? 'text-yellow-600' :
                    loan.status === 'fully_cleared' ? 'text-green-600' :
                    loan.status === 'closed' ? 'text-gray-600' :
                    'text-red-600'
                  }`}>
                    {loan.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feed Requests */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Feed Requests</h2>
          <div className="space-y-3">
            {recentFeeds?.slice(0, 5).map((feed) => (
              <div key={feed._id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {feed.farmer?.username || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">{feed.feedType.replace('_', ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{feed.quantity} kg</div>
                  <div className={`text-xs ${
                    feed.status === 'pending' ? 'text-yellow-600' :
                    feed.status === 'approved' ? 'text-blue-600' :
                    feed.status === 'delivered' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {feed.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}