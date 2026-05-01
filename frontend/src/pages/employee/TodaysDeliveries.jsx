import { useState, useEffect } from "react";
import axios from "axios";

const TodaysDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    totalDeliveries: 0,
    totalCowMilk: 0,
    totalBuffaloMilk: 0,
    totalAmount: 0,
    completedDeliveries: 0,
    pendingDeliveries: 0,
    acceptedDeliveries: 0
  });

  useEffect(() => {
    fetchTodaysDeliveries();
  }, []);

  const fetchTodaysDeliveries = async () => {
    try {
      setLoading(true);
      setError("");
      
      const token = localStorage.getItem("token");
      const today = new Date().toISOString().split('T')[0];
      
      const response = await axios.get(
        `http://localhost:5002/api/employee/todays-deliveries?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setDeliveries(response.data.data.deliveries);
        setSummary(response.data.data.summary);
      } else {
        setError("Failed to fetch today's deliveries");
      }
    } catch (err) {
      console.error("Error fetching deliveries:", err);
      setError(err.response?.data?.error?.message || "Failed to fetch today's deliveries");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800';
      case 'Accepted':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Today's Orders</h1>
          <p className="text-gray-600 mt-2">Analytics and tracking for today's milk orders</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{summary.completedDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <span className="text-2xl">🐄</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cow Milk</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCowMilk}L</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <span className="text-2xl">🐃</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Buffalo Milk</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalBuffaloMilk}L</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total Amount Card */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm font-medium opacity-90">Total Revenue (Accepted Orders)</p>
              <p className="text-4xl font-bold mt-2">₹{summary.totalAmount.toFixed(2)}</p>
              <p className="text-xs opacity-75 mt-1">{summary.acceptedDeliveries} accepted orders</p>
            </div>
            <div className="p-4 bg-white bg-opacity-20 rounded-full">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Deliveries Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Details ({deliveries.length} orders)
            </h2>
          </div>

          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders today</h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no orders scheduled for today yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Milk Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Person
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Placed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Accepted
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    let currentSession = null;
                    return deliveries.map((delivery, index) => {
                      const showSessionHeader = currentSession !== delivery.session;
                      if (showSessionHeader) {
                        currentSession = delivery.session;
                      }
                      
                      return (
                        <>
                          {showSessionHeader && (
                            <tr key={`session-${delivery.session}`} className="bg-gradient-to-r from-blue-50 to-blue-100">
                              <td colSpan="8" className="px-6 py-4">
                                <div className="flex items-center">
                                  <span className="text-lg font-bold text-blue-900">
                                    {delivery.session === 'Morning' ? '🌅' : '🌆'} {delivery.session} Session
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}
                          <tr key={delivery._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                #{delivery._id.slice(-6).toUpperCase()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {delivery.buyer?.username || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {delivery.buyer?.mobile || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className="text-lg mr-2">
                                  {delivery.milkType === 'cow' ? '🐄' : '🐃'}
                                </span>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {delivery.milkType.charAt(0).toUpperCase() + delivery.milkType.slice(1)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {delivery.quantity}L @ ₹{delivery.rate}/L
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {delivery.deliveryPersonId?.username || delivery.handledBy?.username || 'Not assigned'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-bold text-green-600">
                                ₹{delivery.totalAmount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(delivery.status)}`}>
                                {delivery.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTime(delivery.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {delivery.acceptedAt ? formatTime(delivery.acceptedAt) : '-'}
                            </td>
                          </tr>
                        </>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysDeliveries;
