import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function EmployeeSalaryManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalPayroll: 0,
    paidAmount: 0,
    pendingAmount: 0,
    employeeCount: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    employeeId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'cash',
    upiId: '',
    bankName: '',
    ifscCode: '',
    accountNumber: '',
    notes: ''
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchPayments();
  }, [statusFilter]);

  const fetchEmployees = async () => {
    try {
      console.log('🔍 Fetching employees from API...');
      const response = await api.get('/api/employee-salary/employees');
      console.log('✅ API Response:', response);
      console.log('✅ Response data:', response.data);
      console.log('✅ Employees array:', response.data.data);
      console.log('✅ Number of employees:', response.data.data?.length || 0);
      
      setEmployees(response.data.data || []);
      
      if (!response.data.data || response.data.data.length === 0) {
        console.warn('⚠️ No active employees found in the system');
      } else {
        console.log('✅ Employees loaded successfully:', response.data.data.map(e => e.username));
      }
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      console.error('❌ Error response:', error.response);
      alert('Failed to fetch employees. Please try again.');
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/employee-salary/payments', {
        params: { status: statusFilter }
      });
      setPayments(response.data.data.payments);
      setSummary(response.data.data.summary);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // If employee is selected, auto-fill salary
    if (name === 'employeeId' && value) {
      const selectedEmployee = employees.find(emp => emp._id === value);
      if (selectedEmployee && selectedEmployee.salary) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          amount: selectedEmployee.salary.toString()
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await api.post('/api/employee-salary/process', formData);
      
      alert('Payment processed successfully!');
      setShowPaymentModal(false);
      setFormData({
        employeeId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amount: '',
        paymentMethod: 'cash',
        upiId: '',
        bankName: '',
        ifscCode: '',
        accountNumber: '',
        notes: ''
      });
      fetchPayments();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const viewEmployeeProfile = (employeeId) => {
    navigate(`/admin/employee/${employeeId}/salary`);
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
        <h1 className="text-2xl font-bold text-gray-900">Employee Payment Management</h1>
        <p className="text-gray-600">Manage employee salary and bonus payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Payroll</p>
          <p className="text-2xl font-bold text-gray-900">₹{summary.totalPayroll.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Paid</p>
          <p className="text-2xl font-bold text-green-600">₹{summary.paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">₹{summary.pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Employees</p>
          <p className="text-2xl font-bold text-gray-900">{summary.employeeCount}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Process Salary
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Salary Breakdown</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.employeeName}</p>
                        <p className="text-sm text-gray-500">ID: {payment.employeeUniqueId}</p>
                        <p className="text-sm text-gray-500">📱 {payment.employeeMobile}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{payment.paymentType}</p>
                      <p className="text-xs text-gray-500">
                        {payment.billingPeriod.month}/{payment.billingPeriod.year}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">Salary: ₹{payment.baseSalary.toLocaleString()}</p>
                      {payment.totalBonuses > 0 && (
                        <p className="text-xs text-green-600">Bonus: ₹{payment.totalBonuses.toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">₹{payment.netPay.toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
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
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewEmployeeProfile(payment.employee)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Process Employee Payment</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name *
                  </label>
                  <select
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Employee</option>
                    {employees.length === 0 ? (
                      <option value="" disabled>No active employees found</option>
                    ) : (
                      employees.map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.username} - {emp.uniqueId} {emp.employeeRole ? `(${emp.employeeRole})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No active employees available. Please add employees first.
                    </p>
                  )}
                </div>

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                {/* Salary (Auto-filled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Salary *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    readOnly={!!formData.employeeId}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formData.employeeId ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    placeholder={formData.employeeId ? 'Auto-filled from employee record' : 'Select employee first'}
                  />
                  {formData.employeeId && formData.amount && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Salary auto-filled from employee hiring record
                    </p>
                  )}
                  {formData.employeeId && !formData.amount && (
                    <p className="text-sm text-yellow-600 mt-1">
                      ⚠ No salary set for this employee. Please update employee record.
                    </p>
                  )}
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                {/* Conditional Fields - UPI */}
                {formData.paymentMethod === 'upi' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UPI ID *
                    </label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="example@upi"
                    />
                  </div>
                )}

                {/* Conditional Fields - Bank Transfer */}
                {formData.paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
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
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]+"
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Enter account number"
                      />
                    </div>
                  </>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Add any notes..."
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Process Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
