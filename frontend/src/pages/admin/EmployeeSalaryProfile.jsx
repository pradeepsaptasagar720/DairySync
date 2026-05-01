import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function EmployeeSalaryProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    totalPayments: 0
  });

  // Filter state
  const [filters, setFilters] = useState({
    employeeId: 'all',
    paymentMethod: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    month: '',
    year: ''
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchPaymentHistory();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/api/employee-salary/employees');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filters.employeeId && filters.employeeId !== 'all') {
        params.employeeId = filters.employeeId;
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }
      if (filters.month) {
        params.month = filters.month;
      }
      if (filters.year) {
        params.year = filters.year;
      }

      const response = await api.get('/api/employee-salary/payments', { params });
      
      let filteredPayments = response.data.data.payments || [];

      // Apply additional filters
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.paymentMethod === filters.paymentMethod);
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        filteredPayments = filteredPayments.filter(p => new Date(p.paymentDate) >= fromDate);
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredPayments = filteredPayments.filter(p => new Date(p.paymentDate) <= toDate);
      }

      setPayments(filteredPayments);

      // Calculate summary
      const totalPaid = filteredPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.netPay, 0);
      
      const pendingAmount = filteredPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.netPay, 0);

      setSummary({
        totalPaid,
        pendingAmount,
        totalPayments: filteredPayments.length
      });

    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      employeeId: 'all',
      paymentMethod: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      month: '',
      year: ''
    });
  };

  const getPaymentMethodDisplay = (payment) => {
    switch (payment.paymentMethod) {
      case 'cash':
        return 'Cash';
      case 'upi':
        return `UPI${payment.upiId ? ` (${payment.upiId})` : ''}`;
      case 'bank_transfer':
        return `Bank Transfer${payment.bankDetails?.bankName ? ` (${payment.bankDetails.bankName})` : ''}`;
      default:
        return payment.paymentMethod;
    }
  };

  const getTransactionId = (payment) => {
    if (payment.paymentMethod === 'upi') {
      return payment.upiTransactionId || 'N/A';
    } else if (payment.paymentMethod === 'bank_transfer') {
      return payment.paymentReference || 'N/A';
    }
    return 'N/A';
  };

  // Generate year options (current year and 5 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/payments/employee-salary')}
          className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
        >
          ← Back to Employee Payments
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Employee Payment History</h1>
        <p className="text-gray-600">View and filter all employee salary payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Payments</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalPayments}</p>
          <p className="text-sm text-gray-500 mt-1">Filtered results</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Paid Amount</p>
          <p className="text-3xl font-bold text-green-600">
            ₹{summary.totalPaid.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">Completed payments</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pending Amount</p>
          <p className="text-3xl font-bold text-yellow-600">
            ₹{summary.pendingAmount.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Employee Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee
            </label>
            <select
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.username} ({emp.uniqueId})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type
            </label>
            <select
              name="paymentMethod"
              value={filters.paymentMethod}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              name="year"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Years</option>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Date From Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Date To Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
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

      {/* Payment History Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Payment History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {payments.length} payment{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading payment history...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payments found matching the selected filters
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{payment.employeeName}</p>
                        <p className="text-xs text-gray-500">{payment.employeeUniqueId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {payment.billingPeriod.month}/{payment.billingPeriod.year}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      ₹{payment.netPay.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getPaymentMethodDisplay(payment)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                      {getTransactionId(payment)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
