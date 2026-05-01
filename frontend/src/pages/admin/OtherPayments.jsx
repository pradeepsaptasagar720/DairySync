import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

export default function OtherPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    searchTerm: "",
    category: "all",
    status: "all",
    dateFrom: "",
    dateTo: "",
    vendor: "all"
  });

  // Form state for add/edit
  const [formData, setFormData] = useState({
    description: "",
    category: "utilities",
    vendor: "",
    amount: "",
    dueDate: "",
    invoiceNumber: "",
    notes: ""
  });

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split('T')[0],
    upiId: "",
    bankName: "",
    ifscCode: "",
    accountNumber: "",
    transactionId: "",
    notes: ""
  });

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // Build query params
      const params = {};
      if (filters.searchTerm) params.searchTerm = filters.searchTerm;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.vendor !== 'all') params.vendor = filters.vendor;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const response = await api.get('/api/admin/other-expenses', { params });
      
      if (response.data.success) {
        setPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      alert('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: "",
      category: "all",
      status: "all",
      dateFrom: "",
      dateTo: "",
      vendor: "all"
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/admin/other-expenses', formData);
      
      if (response.data.success) {
        alert('Expense added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(error.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleEditExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/api/admin/other-expenses/${selectedPayment._id}`, formData);
      
      if (response.data.success) {
        alert('Expense updated successfully!');
        setShowEditModal(false);
        resetForm();
        fetchPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      alert(error.response?.data?.message || 'Failed to update expense');
    }
  };

  const handlePayExpense = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/api/admin/other-expenses/${selectedPayment._id}/pay`, paymentFormData);
      
      if (response.data.success) {
        alert('Payment processed successfully!');
        setShowPayModal(false);
        resetPaymentForm();
        fetchPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const response = await api.delete(`/api/admin/other-expenses/${id}`);
      
      if (response.data.success) {
        alert('Expense deleted successfully!');
        fetchPayments(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert(error.response?.data?.message || 'Failed to delete expense');
    }
  };

  const openEditModal = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      description: payment.description,
      category: payment.category,
      vendor: payment.vendor,
      amount: payment.amount,
      dueDate: payment.dueDate,
      invoiceNumber: payment.invoiceNumber,
      notes: payment.notes || ""
    });
    setShowEditModal(true);
  };

  const openPayModal = (payment) => {
    setSelectedPayment(payment);
    setShowPayModal(true);
  };

  const resetForm = () => {
    setFormData({
      description: "",
      category: "utilities",
      vendor: "",
      amount: "",
      dueDate: "",
      invoiceNumber: "",
      notes: ""
    });
    setSelectedPayment(null);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      upiId: "",
      bankName: "",
      ifscCode: "",
      accountNumber: "",
      transactionId: "",
      notes: ""
    });
    setSelectedPayment(null);
  };

  // Calculate summary
  const summary = {
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
    count: payments.length
  };

  // Get unique vendors for filter
  const uniqueVendors = [...new Set(payments.map(p => p.vendor))];

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      overdue: "bg-red-100 text-red-800"
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || statusClasses.pending}`;
  };

  const getCategoryBadge = (category) => {
    const categoryClasses = {
      utilities: "bg-blue-100 text-blue-800",
      maintenance: "bg-purple-100 text-purple-800",
      supplies: "bg-green-100 text-green-800",
      transport: "bg-orange-100 text-orange-800",
      equipment: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800"
    };
    return `px-2 py-1 text-xs font-medium rounded-full ${categoryClasses[category] || categoryClasses.other}`;
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Other Payments & Expenses</h1>
        <p className="text-gray-600">Manage miscellaneous payments, business expenses, and vendor bills</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="text-2xl font-bold text-gray-900">₹{summary.total.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{summary.count} records</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Paid</h3>
          <p className="text-2xl font-bold text-green-600">₹{summary.paid.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Completed</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">₹{summary.pending.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">₹{summary.overdue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Past due date</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleFilterChange}
              placeholder="Search by description, vendor, invoice..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="utilities">Utilities</option>
              <option value="maintenance">Maintenance</option>
              <option value="supplies">Supplies</option>
              <option value="transport">Transport</option>
              <option value="equipment">Equipment</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <select
              name="vendor"
              value={filters.vendor}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Vendors</option>
              {uniqueVendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Expense Records</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Add Expense
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No expenses found. Click "Add Expense" to create one.
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.description}</p>
                        <p className="text-xs text-gray-500">Invoice: {payment.invoiceNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getCategoryBadge(payment.category)}>
                        {payment.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{payment.vendor}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">₹{payment.amount.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(payment.status)}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {(payment.status === 'pending' || payment.status === 'overdue') && (
                          <button
                            onClick={() => openPayModal(payment)}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-medium"
                          >
                            Pay
                          </button>
                        )}
                        {payment.status !== 'paid' && (
                          <button
                            onClick={() => openEditModal(payment)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteExpense(payment._id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            
            <form onSubmit={handleAddExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Electricity Bill"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="utilities">Utilities</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="supplies">Supplies</option>
                      <option value="transport">Transport</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor *
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="Vendor name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Expense</h2>
            
            <form onSubmit={handleEditExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="utilities">Utilities</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="supplies">Supplies</option>
                      <option value="transport">Transport</option>
                      <option value="equipment">Equipment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor *
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleFormChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    name="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Process Payment</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600">Expense Details</p>
              <p className="font-medium text-gray-900">{selectedPayment.description}</p>
              <p className="text-sm text-gray-600">Vendor: {selectedPayment.vendor}</p>
              <p className="text-lg font-bold text-gray-900 mt-2">Amount: ₹{selectedPayment.amount.toLocaleString()}</p>
            </div>
            
            <form onSubmit={handlePayExpense}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    name="paymentMethod"
                    value={paymentFormData.paymentMethod}
                    onChange={handlePaymentFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={paymentFormData.paymentDate}
                    onChange={handlePaymentFormChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                {paymentFormData.paymentMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={paymentFormData.upiId}
                      onChange={handlePaymentFormChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="example@upi"
                    />
                  </div>
                )}

                {paymentFormData.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={paymentFormData.bankName}
                        onChange={handlePaymentFormChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={paymentFormData.ifscCode}
                        onChange={handlePaymentFormChange}
                        required
                        pattern="[A-Z]{4}0[A-Z0-9]{6}"
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="ABCD0123456"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={paymentFormData.accountNumber}
                        onChange={handlePaymentFormChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={paymentFormData.transactionId}
                    onChange={handlePaymentFormChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="TXN123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={paymentFormData.notes}
                    onChange={handlePaymentFormChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Payment notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    resetPaymentForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
