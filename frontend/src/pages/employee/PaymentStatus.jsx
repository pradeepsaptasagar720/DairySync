import { useState, useEffect } from "react";
import api from "../../services/api";

export default function PaymentStatus() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("farmers");

  useEffect(() => {
    fetchPayments();
  }, [activeTab]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "farmers" ? "/api/employee/payments/farmers" : "/api/employee/payments/buyers";
      const res = await api.get(endpoint);
      setPayments(res.data.data || []);
    } catch (err) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Overdue": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateTotalAmount = () => {
    return payments.reduce((sum, payment) => sum + payment.totalAmount, 0);
  };

  const getPendingAmount = () => {
    return payments
      .filter(payment => payment.status === "Pending")
      .reduce((sum, payment) => sum + payment.totalAmount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading payment status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-6 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">💰 Payment Status</h1>
        <p className="text-indigo-100">Monitor payment status for farmers and buyers</p>
      </div>

      {/* Tab Selection */}
      <div className="bg-white p-6 rounded-xl shadow">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setActiveTab("farmers")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "farmers"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            👨‍🌾 Farmer Payments
          </button>
          <button
            onClick={() => setActiveTab("buyers")}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === "buyers"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🛍️ Buyer Payments
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Total Payments</h3>
            <p className="text-2xl font-bold text-blue-900">{payments.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Total Amount</h3>
            <p className="text-2xl font-bold text-green-900">₹{calculateTotalAmount().toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Pending Amount</h3>
            <p className="text-2xl font-bold text-yellow-900">₹{getPendingAmount().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Payments Found</h2>
          <p className="text-gray-600">
            No {activeTab === "farmers" ? "farmer" : "buyer"} payments have been recorded yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === "farmers" ? "Farmer" : "Buyer"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => {
                  const person = activeTab === "farmers" ? payment.farmer : payment.buyer;
                  return (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-lg">
                              {activeTab === "farmers" ? "👨‍🌾" : "🛍️"}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {person?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {payment._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {person?.mobile || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{(payment.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.billingPeriod || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button className="text-indigo-600 hover:text-indigo-900">
                            View Details
                          </button>
                          {payment.status === "Pending" && (
                            <button className="text-green-600 hover:text-green-900">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}