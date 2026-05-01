// src/pages/admin/BuyerPayments.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function BuyerPayments() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");

  // Fetch buyer payments from API
  useEffect(() => {
    fetchBuyerPayments();
  }, []);

  const fetchBuyerPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/buyer-payments");
      if (response.data.success) {
        setPayments(response.data.data.payments);
        setSummary(response.data.data.summary);
      }
    } catch (error) {
      console.error("Error fetching buyer payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const buyerName = payment.buyer?.username || "";
    const buyerId = payment.buyer?.uniqueId || "";
    const matchesSearch = buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyerId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || payment.status.toLowerCase() === filterStatus;
    const matchesPaymentMethod = filterPaymentMethod === "all" || payment.paymentMethod === filterPaymentMethod;
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: "bg-green-100 text-green-800",
      approved: "bg-blue-100 text-blue-800",
      "out for delivery": "bg-purple-100 text-purple-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status.toLowerCase()] || statusClasses.pending}`;
  };

  const getPaymentStatusBadge = (paymentCompleted) => {
    return paymentCompleted 
      ? "bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full"
      : "bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded-full";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link to="/admin/payments" className="text-blue-600 hover:text-blue-800 mr-2">
            ← Back to Payments
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Amount Paid by Buyers</h1>
        <p className="text-gray-600">Track payments received from buyers for milk purchases</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by buyer name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="out for delivery">Out for Delivery</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={filterPaymentMethod}
          onChange={(e) => setFilterPaymentMethod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Payment Methods</option>
          <option value="cod">COD</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
        </select>
        <button 
          onClick={fetchBuyerPayments}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-1">₹{summary.totalAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Paid Amount</h3>
            <p className="text-2xl font-bold text-green-600">₹{summary.paidAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.onlinePayments} online + {summary.codCompleted} COD</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">Pending Amount</h3>
            <p className="text-2xl font-bold text-yellow-600">₹{summary.pendingAmount.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.codPending} COD pending</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">COD Orders</h3>
            <p className="text-2xl font-bold text-blue-600">{summary.codPayments}</p>
            <p className="text-xs text-gray-500 mt-1">{summary.codCompleted} completed</p>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.buyer?.username || "N/A"}</div>
                      <div className="text-sm text-gray-500">ID: {payment.buyer?.uniqueId || "N/A"}</div>
                      <div className="text-sm text-gray-500">📱 {payment.buyer?.mobile || "N/A"}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.milkType.charAt(0).toUpperCase() + payment.milkType.slice(1)} Milk</div>
                    <div className="text-sm text-gray-500">{payment.quantity}L @ ₹{payment.rate}/L</div>
                    <div className="text-xs text-gray-400">{new Date(payment.deliveryDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">₹{payment.totalAmount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{payment.paymentMethod.toUpperCase()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getPaymentStatusBadge(payment.paymentCompleted)}>
                      {payment.paymentCompleted ? "Paid" : "Pending"}
                    </span>
                    {payment.paymentDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(payment.status)}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No payment records found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}