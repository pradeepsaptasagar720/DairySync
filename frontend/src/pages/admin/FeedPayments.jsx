import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import feedService from '../../services/FeedService';
import eventBus from '../../services/EventBus';
import { EVENT_TYPES } from '../../constants/eventTypes';

export default function FeedPayments() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [feedData, setFeedData] = useState({
    feedStockPurchases: 0,
    feedSalesToFarmers: 0,
    feedProfitLoss: 0
  });
  const [feedBreakdown, setFeedBreakdown] = useState([]);
  const [bestSellingFeed, setBestSellingFeed] = useState(null);

  useEffect(() => {
    fetchFeedData();

    // Subscribe to real-time updates
    const unsubscribeFeedApproved = eventBus.subscribe(EVENT_TYPES.FEED_REQUEST_APPROVED, () => {
      console.log('[FeedPayments] Feed approved - refreshing data');
      fetchFeedData();
    });

    const unsubscribeStockUpdated = eventBus.subscribe(EVENT_TYPES.FEED_STOCK_UPDATED, () => {
      console.log('[FeedPayments] Stock updated - refreshing data');
      fetchFeedData();
    });

    return () => {
      unsubscribeFeedApproved();
      unsubscribeStockUpdated();
    };
  }, []);

  const fetchFeedData = () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get approved feed requests from localStorage
      const allFeedRequests = feedService.getFeedRequests();
      const approvedFeeds = allFeedRequests.filter(req => req.status.toLowerCase() === 'approved');
      
      console.log('[FeedPayments] Total approved feeds:', approvedFeeds.length);
      
      // Calculate totals
      let totalRevenue = 0;
      let totalCost = 0;
      const feedTypeMap = new Map();
      
      approvedFeeds.forEach(req => {
        const quantity = req.requestedQuantity || 0;
        const revenue = req.totalAmount || 0;
        
        totalRevenue += revenue;
        
        // Get feed stock to calculate cost
        const feedStock = feedService.getFeedStock(req.feedName);
        const purchasedRate = feedStock?.purchasedRate || 0;
        const cost = quantity * purchasedRate;
        totalCost += cost;
        
        // Track per-feed breakdown
        if (!feedTypeMap.has(req.feedName)) {
          feedTypeMap.set(req.feedName, {
            feedName: req.feedName,
            quantity: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            requestCount: 0,
            purchasedRate: purchasedRate,
            sellingPrice: feedStock?.pricePerKg || 0
          });
        }
        
        const feedData = feedTypeMap.get(req.feedName);
        feedData.quantity += quantity;
        feedData.revenue += revenue;
        feedData.cost += cost;
        feedData.profit = feedData.revenue - feedData.cost;
        feedData.requestCount += 1;
      });
      
      const totalProfit = totalRevenue - totalCost;
      
      // Convert map to array and sort by revenue (best selling)
      const breakdown = Array.from(feedTypeMap.values()).sort((a, b) => b.revenue - a.revenue);
      
      // Identify best selling feed (highest revenue)
      const bestSelling = breakdown.length > 0 ? breakdown[0] : null;
      
      setFeedData({
        feedStockPurchases: totalCost,
        feedSalesToFarmers: totalRevenue,
        feedProfitLoss: totalProfit
      });
      
      setFeedBreakdown(breakdown);
      setBestSellingFeed(bestSelling);
      
      console.log('[FeedPayments] Data updated - Revenue:', totalRevenue, 'Cost:', totalCost, 'Profit:', totalProfit);
      console.log('[FeedPayments] Best selling:', bestSelling?.feedName);
    } catch (error) {
      console.error('[FeedPayments] Error fetching feed data:', error);
      setError(error.message || 'Failed to fetch feed data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/payments')}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
        >
          ← Back to Payments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Feed Payments Management</h1>
        <p className="text-gray-600">Track feed stock purchases and sales to farmers</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchFeedData}
                  className="text-sm font-medium text-red-600 hover:text-red-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Feed Stock Purchases */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Feed Stock Purchases</p>
                <p className="text-xs text-gray-500">Amount purchased by employees</p>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-red-600">
              ₹{feedData.feedStockPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">Total expenses on feed stock</p>
        </div>

        {/* Feed Sales to Farmers */}
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🌾</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Feed Sales to Farmers</p>
                <p className="text-xs text-gray-500">Amount received from farmers</p>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-orange-600">
              ₹{feedData.feedSalesToFarmers.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">Total revenue from feed sales</p>
        </div>

        {/* Feed Profit/Loss */}
        <div className={`bg-white p-6 rounded-lg shadow-lg border-l-4 ${feedData.feedProfitLoss >= 0 ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 ${feedData.feedProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
                <span className="text-2xl">{feedData.feedProfitLoss >= 0 ? '📈' : '📉'}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Feed Profit/Loss</p>
                <p className="text-xs text-gray-500">Sales - Purchases</p>
              </div>
            </div>
          </div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : (
            <p className={`text-3xl font-bold ${feedData.feedProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {feedData.feedProfitLoss >= 0 ? '+' : ''}₹{feedData.feedProfitLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {feedData.feedProfitLoss >= 0 ? 'Profit from feed operations' : 'Loss from feed operations'}
          </p>
        </div>
      </div>

      {/* Best Selling Feed Highlight */}
      {bestSellingFeed && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🏆</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-purple-900 mb-1">Best Selling Feed</h2>
                <p className="text-2xl font-bold text-purple-700">{bestSellingFeed.feedName}</p>
                <p className="text-sm text-purple-600 mt-1">
                  {bestSellingFeed.requestCount} requests • {bestSellingFeed.quantity.toLocaleString()} kg sold
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-600">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-700">
                ₹{bestSellingFeed.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-purple-600 mt-1">
                Profit: ₹{bestSellingFeed.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feed Breakdown Table */}
      {feedBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Feed Sales Breakdown</h2>
            <p className="text-sm text-gray-600">Detailed analysis by feed type</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Feed Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selling Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit/Loss
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedBreakdown.map((feed, index) => (
                  <tr key={index} className={index === 0 ? 'bg-purple-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 && <span className="text-lg mr-2">🏆</span>}
                        <span className="text-sm font-medium text-gray-900">{feed.feedName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {feed.requestCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {feed.quantity.toLocaleString()} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ₹{feed.purchasedRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ₹{feed.sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                      ₹{feed.cost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${feed.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{feed.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${feed.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {feed.profit >= 0 ? '+' : ''}₹{feed.profit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calculation Formula */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-md font-semibold text-blue-900 mb-3 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How Feed Profit/Loss is Calculated
        </h3>
        <div className="bg-white rounded p-4 text-sm text-gray-700">
          <p className="font-mono mb-2">
            <span className="font-semibold">Feed Profit/Loss</span> = Feed Sales to Farmers - Feed Stock Purchases
          </p>
          <p className="text-xs text-gray-600 mt-3">
            This calculation shows whether the feed operations are profitable or running at a loss. 
            A positive value indicates profit, while a negative value indicates loss.
          </p>
        </div>
      </div>

      {/* Data Source Note */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Data Source</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>
                All amounts are calculated from approved feed requests stored in localStorage. 
                The data updates in real-time as the Loan & Feed Manager approves requests and updates stock.
                Best selling feed is determined by total revenue generated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
