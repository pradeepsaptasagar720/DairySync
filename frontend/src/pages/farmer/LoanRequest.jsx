import { useState, useEffect } from 'react';
import { 
  CreditCard, DollarSign, FileText, CheckCircle, AlertCircle, Clock, 
  Plus, User, Calendar, TrendingUp, History, Send
} from 'lucide-react';
import loanService from '../../services/LoanService';
import { useAuth } from '../../hooks/useAuth';
import { useEventBus } from '../../hooks/useEventBus';
import { EVENT_TYPES } from '../../constants/eventTypes';
import { LOAN_PURPOSE_LABELS, LOAN_STATUS } from '../../constants/loanTypes';

const LoanRequest = () => {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Loan data state
  const [loanSummary, setLoanSummary] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalApproved: 0,
    totalRepaid: 0,
    currentTotalDue: 0,
    loans: []
  });

  // Form state
  const [formData, setFormData] = useState({
    loanAmount: '',
    loanPurpose: '',
    description: ''
  });

  // Get farmer data from auth context
  const farmerData = {
    id: user?.id,
    name: user?.username || user?.name,
    phone: user?.mobile || user?.phone
  };

  const getFarmerId = () => {
    if (user?.id || user?._id) return user.id || user._id;
    // Fallback: decode from JWT for old sessions without id stored
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id;
      } catch (_) {}
    }
    return null;
  };

  const { subscribe, emit } = useEventBus('LoanRequest');

  useEffect(() => {
    if (user?.role !== 'farmer') return;
    const farmerId = getFarmerId();
    if (!farmerId) return;
    loadInitialData();
    
    // Subscribe to real-time updates
    const unsubscribeLoanCreated = subscribe(EVENT_TYPES.LOAN_REQUEST_CREATED, handleLoanCreated);
    const unsubscribeLoanApproved = subscribe(EVENT_TYPES.LOAN_REQUEST_APPROVED, handleLoanApproved);
    const unsubscribeLoanRejected = subscribe(EVENT_TYPES.LOAN_REQUEST_REJECTED, handleLoanRejected);

    return () => {
      unsubscribeLoanCreated();
      unsubscribeLoanApproved();
      unsubscribeLoanRejected();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await loadFarmerLoanSummary();
    } catch (error) {
      console.error('Error loading loan data:', error);
      showNotification('Error loading loan data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFarmerLoanSummary = async () => {
    const farmerId = getFarmerId();
    if (!farmerId) return;
    try {
      const summary = await loanService.getFarmerLoanSummary(farmerId);
      setLoanSummary(summary.data);
    } catch (error) {
      console.error('Error loading farmer loan summary:', error);
    }
  };

  const handleLoanCreated = (data) => {
    if (data.farmerId === farmerData.id) {
      showNotification('Loan request submitted successfully!', 'success');
      loadFarmerLoanSummary();
      setShowRequestForm(false);
      resetForm();
    }
  };

  const handleLoanApproved = (data) => {
    if (data.loanRequest.farmerId === farmerData.id) {
      showNotification(`Loan approved! Amount: ₹${data.loanRequest.loanAmount}`, 'success');
      loadFarmerLoanSummary();
    }
  };

  const handleLoanRejected = (data) => {
    if (data.loanRequest.farmerId === farmerData.id) {
      showNotification(`Loan request rejected: ${data.rejectionResult.rejectionReason}`, 'error');
      loadFarmerLoanSummary();
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitLoanRequest = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate form
      if (!formData.loanAmount || !formData.loanPurpose) {
        showNotification('Please fill in all required fields', 'error');
        return;
      }

      const amount = parseFloat(formData.loanAmount);
      if (amount < 1000 || amount > 500000) {
        showNotification('Loan amount must be between ₹1,000 and ₹5,00,000', 'error');
        return;
      }

      // Create loan request
      const requestData = {
        farmerId: getFarmerId(),
        farmerName: user?.username || user?.name,
        farmerPhone: user?.mobile || user?.phone,
        loanAmount: amount,
        loanPurpose: formData.loanPurpose,
        description: formData.description
      };

      if (!requestData.farmerId) {
        // Fallback: try to decode id from JWT token
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            requestData.farmerId = payload.id;
          } catch (_) {}
        }
      }

      if (!requestData.farmerId) {
        showNotification('User session error. Please log out and log back in.', 'error');
        return;
      }

      await loanService.createLoanRequest(requestData);
      showNotification('Loan request submitted successfully!', 'success');
      setShowRequestForm(false);
      resetForm();
      await loadFarmerLoanSummary();

    } catch (error) {
      console.error('Error submitting loan request:', error);
      showNotification(error.message || 'Error submitting loan request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      loanAmount: '',
      loanPurpose: '',
      description: ''
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      [LOAN_STATUS.REQUESTED]: 'text-blue-600 bg-blue-50 border-blue-200',
      [LOAN_STATUS.APPROVED]: 'text-green-600 bg-green-50 border-green-200',
      [LOAN_STATUS.REJECTED]: 'text-red-600 bg-red-50 border-red-200',
      [LOAN_STATUS.PARTIALLY_PAID]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      [LOAN_STATUS.FULLY_CLEARED]: 'text-purple-600 bg-purple-50 border-purple-200',
      [LOAN_STATUS.CLOSED]: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (!user || user.role !== 'farmer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be logged in as a farmer to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Loan Request...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Management</h1>
          <p className="text-gray-600">Submit and track your loan requests</p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {notification.type === 'info' && <Clock className="h-5 w-5" />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-3xl font-bold text-blue-600">{loanSummary.activeLoans}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-3xl font-bold text-yellow-600">{formatCurrency(loanSummary.currentTotalDue)}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Approved</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(loanSummary.totalApproved)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Repaid</p>
                <p className="text-3xl font-bold text-purple-600">{formatCurrency(loanSummary.totalRepaid)}</p>
              </div>
              <History className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowRequestForm(!showRequestForm)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            {showRequestForm ? 'Cancel Request' : 'Request New Loan'}
          </button>
        </div>

        {/* Loan Request Form */}
        {showRequestForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Loan Request</h2>
            
            <form onSubmit={handleSubmitLoanRequest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Amount (₹) *
                  </label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleInputChange}
                    min="1000"
                    max="500000"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter loan amount"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: ₹1,000 | Maximum: ₹5,00,000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loan Purpose *
                  </label>
                  <select
                    name="loanPurpose"
                    value={formData.loanPurpose}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select loan purpose</option>
                    {Object.entries(LOAN_PURPOSE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  maxLength="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Provide additional details about your loan request..."
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRequestForm(false);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loan History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Your Loan History</h2>
          
          {loanSummary.loans.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No loan requests found</p>
              <p className="text-sm text-gray-400">Submit your first loan request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loanSummary.loans.map((loan) => (
                <div key={loan.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-900">
                        {formatCurrency(loan.loanAmount)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(loan.requestDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Purpose:</span>
                      <span className="ml-2 text-gray-900">
                        {LOAN_PURPOSE_LABELS[loan.loanPurpose]}
                      </span>
                    </div>
                    
                    {(loan.status === LOAN_STATUS.APPROVED || loan.status === LOAN_STATUS.PARTIALLY_PAID) && (
                      <>
                        <div>
                          <span className="text-gray-500">Total Repaid:</span>
                          <span className="ml-2 text-green-600 font-semibold">{formatCurrency(loan.totalRepaid)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Total Due:</span>
                          <span className="ml-2 text-orange-600 font-semibold">{formatCurrency(loan.totalDue)}</span>
                        </div>
                      </>
                    )}

                    {(loan.status === LOAN_STATUS.FULLY_CLEARED || loan.status === LOAN_STATUS.CLOSED) && (
                      <div>
                        <span className="text-gray-500">Total Repaid:</span>
                        <span className="ml-2 text-green-600 font-semibold">{formatCurrency(loan.totalRepaid)}</span>
                      </div>
                    )}
                    
                    {loan.status === LOAN_STATUS.REJECTED && loan.rejectionReason && (
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Reason:</span>
                        <span className="ml-2 text-red-600">{loan.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                  
                  {loan.description && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">{loan.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanRequest;