import { useState, useEffect } from "react";
import { ShoppingBag, TrendingUp, Calendar, IndianRupee, BarChart3 } from "lucide-react";
import api from "../../services/api";

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    try {
      const response = await api.get("/api/buyer/purchase-history");
      setPurchases(response.data.data || []);
    } catch (error) {
      console.error("Error fetching purchase history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (period) => {
    const now = new Date();
    switch (period) {
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case "quarter":
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case "year":
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return new Date(0); // All time
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const startDate = getDateRange(selectedPeriod);
    return new Date(purchase.deliveryDate) >= startDate && purchase.status === "Completed";
  });

  const calculateStats = () => {
    const cowPurchases = filteredPurchases.filter(p => p.milkType === "cow");
    const buffaloPurchases = filteredPurchases.filter(p => p.milkType === "buffalo");

    return {
      cow: {
        orders: cowPurchases.length,
        liters: cowPurchases.reduce((sum, p) => sum + p.quantity, 0),
        amount: cowPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
        avgRate: cowPurchases.length > 0 
          ? (cowPurchases.reduce((sum, p) => sum + p.rate, 0) / cowPurchases.length).toFixed(2)
          : 0
      },
      buffalo: {
        orders: buffaloPurchases.length,
        liters: buffaloPurchases.reduce((sum, p) => sum + p.quantity, 0),
        amount: buffaloPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
        avgRate: buffaloPurchases.length > 0 
          ? (buffaloPurchases.reduce((sum, p) => sum + p.rate, 0) / buffaloPurchases.length).toFixed(2)
          : 0
      },
      total: {
        orders: filteredPurchases.length,
        liters: filteredPurchases.reduce((sum, p) => sum + p.quantity, 0),
        amount: filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0)
      }
    };
  };

  const stats = calculateStats();

  const getMonthlyData = () => {
    const monthlyData = {};
    filteredPurchases.forEach(purchase => {
      const month = new Date(purchase.deliveryDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { cow: 0, buffalo: 0, total: 0 };
      }
      
      monthlyData[month][purchase.milkType] += purchase.quantity;
      monthlyData[month].total += purchase.quantity;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-6); // Last 6 months
  };

  const monthlyData = getMonthlyData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading purchase history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <ShoppingBag size={32} />
          Purchase History
        </h1>
        <p className="text-indigo-100">Detailed analysis of your milk purchases</p>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold">Time Period</h2>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {[
            { value: "week", label: "Last Week" },
            { value: "month", label: "Last Month" },
            { value: "quarter", label: "Last 3 Months" },
            { value: "year", label: "Last Year" },
            { value: "all", label: "All Time" }
          ].map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPeriod === period.value
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cow Milk Stats */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🐄</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Cow Milk</h3>
              <p className="text-sm text-gray-600">Purchase Summary</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orders:</span>
              <span className="font-bold text-lg">{stats.cow.orders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Liters:</span>
              <span className="font-bold text-lg text-blue-600">{stats.cow.liters}L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-lg text-green-600">₹{stats.cow.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Rate:</span>
              <span className="font-bold text-lg">₹{stats.cow.avgRate}/L</span>
            </div>
          </div>
        </div>

        {/* Buffalo Milk Stats */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🐃</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Buffalo Milk</h3>
              <p className="text-sm text-gray-600">Purchase Summary</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Orders:</span>
              <span className="font-bold text-lg">{stats.buffalo.orders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Liters:</span>
              <span className="font-bold text-lg text-orange-600">{stats.buffalo.liters}L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-lg text-green-600">₹{stats.buffalo.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Avg Rate:</span>
              <span className="font-bold text-lg">₹{stats.buffalo.avgRate}/L</span>
            </div>
          </div>
        </div>

        {/* Total Stats */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">📊</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Summary</h3>
              <p className="text-sm text-gray-600">Overall Statistics</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Orders:</span>
              <span className="font-bold text-lg">{stats.total.orders}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Liters:</span>
              <span className="font-bold text-lg text-purple-600">{stats.total.liters}L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Spent:</span>
              <span className="font-bold text-lg text-green-600">₹{stats.total.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Preference:</span>
              <span className="font-bold text-lg">
                {stats.cow.liters > stats.buffalo.liters ? "🐄 Cow" : 
                 stats.buffalo.liters > stats.cow.liters ? "🐃 Buffalo" : "Equal"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={24} className="text-indigo-600" />
            <h2 className="text-xl font-semibold">Monthly Purchase Trend</h2>
          </div>
          
          <div className="space-y-4">
            {monthlyData.map(([month, data]) => (
              <div key={month} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{month}</span>
                  <span className="text-sm text-gray-600">{data.total}L total</span>
                </div>
                
                <div className="flex gap-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  {data.cow > 0 && (
                    <div 
                      className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${(data.cow / data.total) * 100}%` }}
                      title={`Cow: ${data.cow}L`}
                    >
                      {data.cow > 0 && data.cow}L
                    </div>
                  )}
                  {data.buffalo > 0 && (
                    <div 
                      className="bg-orange-500 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${(data.buffalo / data.total) * 100}%` }}
                      title={`Buffalo: ${data.buffalo}L`}
                    >
                      {data.buffalo > 0 && data.buffalo}L
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    Cow: {data.cow}L
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    Buffalo: {data.buffalo}L
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Purchases */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp size={24} className="text-green-600" />
            Recent Purchases
          </h2>
        </div>
        
        {filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No Purchases Found</h3>
            <p className="text-gray-500">
              No completed purchases found for the selected period.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredPurchases
              .sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate))
              .slice(0, 10)
              .map((purchase) => (
                <div key={purchase._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {purchase.milkType === "cow" ? "🐄" : "🐃"}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {purchase.milkType} Milk - {purchase.quantity}L
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(purchase.deliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">₹{purchase.totalAmount}</div>
                      <div className="text-sm text-gray-600">₹{purchase.rate}/L</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}