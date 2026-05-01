import { useState, useEffect } from "react";
import { Calendar, Clock, User, Milk, TrendingUp, Eye } from "lucide-react";
import api from "../../services/api";

export default function TodayMilkStatus() {
  const [loading, setLoading] = useState(true);
  const [milkData, setMilkData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTodayMilkEntries();
  }, []);

  const fetchTodayMilkEntries = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get('/api/farmer/today-milk-entries');
      setMilkData(response.data.data);
    } catch (err) {
      console.error('Error fetching today milk entries:', err);
      setError(err.response?.data?.error?.message || 'Failed to load today\'s milk status');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      // Handle both HH:MM:SS and HH:MM formats
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle both YYYY-MM-DD string format and Date objects
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid
      }
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return `${dateString} ${timeString || ''}`.trim();
      }
      const formattedDate = date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const formattedTime = formatTime(timeString);
      return `${formattedDate} at ${formattedTime}`;
    } catch {
      return `${dateString} ${timeString || ''}`.trim();
    }
  };

  const getSessionIcon = (session) => {
    return session === 'Morning' ? '🌅' : '🌆';
  };

  const getSessionColor = (session) => {
    return session === 'Morning' 
      ? 'bg-yellow-100 text-yellow-800' 
      : 'bg-blue-100 text-blue-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading today's milk status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchTodayMilkEntries}
          className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Eye size={32} />
          Today Milk Status
        </h1>
        <p className="text-green-100">View your milk collection details for today</p>
        <div className="flex items-center gap-2 mt-2 text-green-100">
          <Calendar size={16} />
          <span>{formatDate(milkData?.date || new Date().toISOString().split('T')[0])}</span>
        </div>
      </div>

      {/* Summary Cards */}
      {milkData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <span className="text-2xl">🐄</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cow Milk</p>
                <p className="text-xl font-bold text-blue-600">
                  {milkData.summary.cowMilkTotal.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <span className="text-2xl">🐃</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Buffalo Milk</p>
                <p className="text-xl font-bold text-orange-600">
                  {milkData.summary.buffaloMilkTotal.toFixed(1)}L
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold text-green-600">
                  ₹{milkData.summary.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Milk className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Fat</p>
                <p className="text-xl font-bold text-purple-600">
                  {milkData.summary.averageFat}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Milk Entries */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Milk className="text-green-600" size={24} />
            Today's Milk Collection Details
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Collection details recorded by dairy staff
          </p>
        </div>

        <div className="p-6">
          {!milkData?.entries || milkData.entries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🥛</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Milk Collection Today</h3>
              <p className="text-gray-600">
                Your milk hasn't been collected yet today. Check back after the collection sessions.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Collection Sessions:</p>
                <p>🌅 Morning Session • 🌆 Evening Session</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {milkData.entries.map((entry, index) => (
                <div key={entry._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getSessionIcon(entry.session)}</span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionColor(entry.session)}`}>
                            {entry.session} Session
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar size={14} />
                            <span>{formatDate(entry.date)}</span>
                            <Clock size={14} className="ml-2" />
                            <span>{formatTime(entry.time)}</span>
                          </div>
                          <p>
                            Collected by: {entry.collectedByName} ({entry.collectedByUniqueId})
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        ₹{entry.totalAmount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">Total Amount</p>
                    </div>
                  </div>

                  {/* Milk Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cow Milk */}
                    {entry.cow && entry.cow.quantity > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🐄</span>
                          <span className="font-medium text-blue-800">Cow Milk</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{entry.cow.quantity.toFixed(1)}L</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fat:</span>
                            <span className="font-medium">{entry.cow.fat.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span className="font-medium">₹{entry.cow.rate.toFixed(2)}/L</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Amount:</span>
                            <span className="font-bold text-blue-600">₹{entry.cow.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Buffalo Milk */}
                    {entry.buffalo && entry.buffalo.quantity > 0 && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🐃</span>
                          <span className="font-medium text-orange-800">Buffalo Milk</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span className="font-medium">{entry.buffalo.quantity.toFixed(1)}L</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fat:</span>
                            <span className="font-medium">{entry.buffalo.fat.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rate:</span>
                            <span className="font-medium">₹{entry.buffalo.rate.toFixed(2)}/L</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span>Amount:</span>
                            <span className="font-bold text-orange-600">₹{entry.buffalo.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Entry Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                    <span>Entry #{index + 1} • {formatDateTime(entry.date, entry.time)}</span>
                    <span>Receipt Generated: {entry.receiptGenerated ? '✅ Yes' : '❌ No'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• This page shows your milk collection status for today only</li>
              <li>• Data is updated automatically when dairy staff collects your milk</li>
              <li>• The page resets at midnight (12:00 AM) for the next day</li>
              <li>• You can view but cannot edit the collection details</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchTodayMilkEntries}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Status
        </button>
      </div>
    </div>
  );
}
