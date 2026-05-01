import { useState, useEffect } from 'react';
import { 
  CreditCard, User, DollarSign, CheckCircle, Clock, AlertCircle, 
  Search, Eye, X, FileText, TrendingUp, Phone, Plus, 
  Calendar, IndianRupee, Users, Filter, History, 
  ThumbsUp, Ban, Archive
} from 'lucide-react';
import LoanService from '../../services/LoanService';

const LoanManagement = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [loans, setLoans] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLoans, setTotalLoans] = useState(0);
  const itemsPerPage = 10;

  // Form states
  const [approvalForm, setApprovalForm] = useState({
    approvedAmount: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'cash',
    notes: ''
  });

  // History data
  const [loanHistory, setLoanHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    approved: { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    partially_paid: { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    fully_cleared: { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
    closed: { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 }
  });

  const [totalStats, setTotalStats] = useState({
    totalApproved: 0,
    totalReturned: 0,
    totalDue: 0,
    activeFarmers: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadLoans();
  }, [filter, searchTerm, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLoans(),
        loadFarmers(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadLoans = async () => {
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        status: filter !== 'all' ? filter : undefined,
        search: searchTerm || undefined
      };

      const response = await LoanService.getLoans(params);
      if (response.success && response.data) {
        setLoans(response.data.loans || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalLoans(response.data.pagination?.total || 0);
      } else {
        setLoans([]);
        setTotalPages(1);
        setTotalLoans(0);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      showNotification('Error loading loans', 'error');
      setLoans([]);
      setTotalPages(1);
      setTotalLoans(0);
    }
  };

  const loadFarmers = async () => {
    try {
      const response = await LoanService.getFarmers();
      if (response.success && response.data) {
        setFarmers(response.data);
      } else {
        setFarmers([]);
      }
    } catch (error) {
      console.error('Error loading farmers:', error);
      setFarmers([]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await LoanService.getLoanStats();
      if (response.success && response.data) {
        const loanStats = response.data.loanStats || {};
        setStats({
          approved: loanStats.approved || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
          partially_paid: loanStats.partially_paid || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
          fully_cleared: loanStats.fully_cleared || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 },
          closed: loanStats.closed || { count: 0, totalApproved: 0, totalReturned: 0, totalDue: 0 }
        });

        // Calculate totals
        const totals = Object.values(loanStats).reduce((acc, stat) => {
          acc.totalApproved += stat.totalApproved || 0;
          acc.totalReturned += stat.totalReturned || 0;
          acc.totalDue += stat.totalDue || 0;
          acc.activeFarmers += stat.count || 0;
          return acc;
        }, { totalApproved: 0, totalReturned: 0, totalDue: 0, activeFarmers: 0 });

        setTotalStats(totals);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Keep default stats on error
    }
  };

  const handleApproveLoan = async () => {
    if (!approvalForm.approvedAmount || parseFloat(approvalForm.approvedAmount) <= 0) {
      showNotification('Please enter a valid approved amount', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await LoanService.approveLoan(selectedLoan._id, parseFloat(approvalForm.approvedAmount));

      if (response.success) {
        showNotification('Loan approved successfully', 'success');
        setShowApprovalModal(false);
        resetApprovalForm();
        loadLoans();
        loadStats();
        setSelectedLoan(null);
      }
    } catch (error) {
      console.error('Error approving loan:', error);
      showNotification(error.message || 'Error approving loan', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    if (parseFloat(paymentForm.amount) > selectedLoan.totalDue) {
      showNotification('Payment amount cannot exceed total due amount', 'error');
      return;
    }

    try {
      setProcessing(true);
      const response = await LoanService.addPayment(selectedLoan._id, {
        amount: parseFloat(paymentForm.amount),
        paymentMode: paymentForm.paymentMode,
        notes: paymentForm.notes
      });

      if (response.success) {
        showNotification('Payment added successfully', 'success');
        setShowPaymentModal(false);
        resetPaymentForm();
        loadLoans();
        loadStats();
        setSelectedLoan(null);
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      showNotification(error.message || 'Error adding payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearLoan = async (loan) => {
    if (!confirm('Are you sure you want to clear this loan? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await LoanService.clearLoan(loan._id);

      if (response.success) {
        showNotification('Loan cleared successfully', 'success');
        loadLoans();
        loadStats();
      }
    } catch (error) {
      console.error('Error clearing loan:', error);
      showNotification(error.message || 'Error clearing loan', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const loadLoanHistory = async (farmerId) => {
    try {
      setHistoryLoading(true);
      const response = await LoanService.getLoanHistory(farmerId);
      if (response.success && response.data) {
        setLoanHistory(response.data.history || []);
      } else {
        setLoanHistory([]);
      }
    } catch (error) {
      console.error('Error loading loan history:', error);
      showNotification('Error loading loan history', 'error');
      setLoanHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetApprovalForm = () => {
    setApprovalForm({
      approvedAmount: ''
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount: '',
      paymentMode: 'cash',
      notes: ''
    });
  };

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-IN');
  };

  const getStatusColor = (status) => {
    const colors = {
      requested: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      approved: 'text-blue-600 bg-blue-50 border-blue-200',
      partially_paid: 'text-orange-600 bg-orange-50 border-orange-200',
      fully_cleared: 'text-green-600 bg-green-50 border-green-200',
      closed: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      requested: 'Requested',
      approved: 'Approved',
      partially_paid: 'Partially Paid',
      fully_cleared: 'Fully Cleared',
      closed: 'Closed'
    };
    return labels[status] || status;
  };

  const getProgressPercentage = (totalReturned, approvedAmount) => {
    if (!approvedAmount || approvedAmount === 0) return 0;
    return Math.min((totalReturned / approvedAmount) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Loan Management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600">Manage farmer loan requests, approvals, and payments</p>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Approved</p>
              <p className="text-3xl font-bold text-blue-600">{formatCurrency(totalStats.totalApproved)}</p>
              <p className="text-sm text-gray-500">{totalStats.activeFarmers} farmers</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Returned</p>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(totalStats.totalReturned)}</p>
              <p className="text-sm text-gray-500">Payments received</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Due</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(totalStats.totalDue)}</p>
              <p className="text-sm text-gray-500">Outstanding amount</p>
            </div>
            <AlertCircle className="h-10 w-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Loans</p>
              <p className="text-3xl font-bold text-purple-600">{totalLoans}</p>
              <p className="text-sm text-gray-500">All time</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by farmer name, mobile, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {['all', 'requested', 'approved', 'partially_paid', 'fully_cleared', 'closed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Loans ({totalLoans})
          </h2>
        </div>

        {loans.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No loans found</p>
            <p className="text-sm text-gray-400">
              {filter === 'all' ? 'No loans available' : `No ${getStatusLabel(filter).toLowerCase()} loans`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {loans.map((loan) => (
              <div key={loan._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{loan.farmer.username}</h3>
                      <p className="text-sm text-gray-500">ID: {loan.farmer.uniqueId}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{loan.farmer.mobile}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {formatCurrency(loan.requestedAmount)}
                    </div>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                      {getStatusLabel(loan.status)}
                    </div>
                    {loan.approvedAmount && (
                      <div className="text-sm text-blue-600 font-medium mt-1">
                        Approved: {formatCurrency(loan.approvedAmount)}
                      </div>
                    )}
                    {loan.totalDue > 0 && (
                      <div className="text-sm text-orange-600 font-medium mt-1">
                        Due: {formatCurrency(loan.totalDue)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Purpose:</span>
                    <span className="ml-2 text-gray-900">{loan.purpose}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-500">Request Date:</span>
                    <span className="ml-2 text-gray-900">{formatDateTime(loan.requestDate)}</span>
                  </div>

                  {loan.approvalDate && (
                    <div>
                      <span className="text-gray-500">Approval Date:</span>
                      <span className="ml-2 text-gray-900">{formatDateTime(loan.approvalDate)}</span>
                    </div>
                  )}

                  {loan.totalReturned > 0 && (
                    <div>
                      <span className="text-gray-500">Returned:</span>
                      <span className="ml-2 text-green-600 font-medium">{formatCurrency(loan.totalReturned)}</span>
                    </div>
                  )}
                </div>

                {/* Payment Progress */}
                {loan.approvedAmount && loan.totalReturned > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Payment Progress</span>
                      <span>{formatCurrency(loan.totalReturned)} / {formatCurrency(loan.approvedAmount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage(loan.totalReturned, loan.approvedAmount)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setShowDetailsModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>

                  {LoanService.canApprove(loan) && (
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setApprovalForm({ approvedAmount: loan.requestedAmount.toString() });
                        setShowApprovalModal(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      Approve Loan
                    </button>
                  )}

                  {LoanService.canAddPayment(loan) && (
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowPaymentModal(true);
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Add Payment
                    </button>
                  )}

                  {LoanService.canClear(loan) && (
                    <button
                      onClick={() => handleClearLoan(loan)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Clear Loan
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      loadLoanHistory(loan.farmer._id);
                      setShowHistoryModal(true);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalLoans)} of {totalLoans} loans
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Approval Modal */}
      {showApprovalModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Approve Loan</h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  resetApprovalForm();
                  setSelectedLoan(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Loan Request Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Farmer:</span>
                  <span className="font-medium">{selectedLoan.farmer.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedLoan.requestedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purpose:</span>
                  <span className="font-medium">{selectedLoan.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Request Date:</span>
                  <span className="font-medium">{formatDateTime(selectedLoan.requestDate)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approved Amount (Rs.) *
                </label>
                <input
                  type="number"
                  value={approvalForm.approvedAmount}
                  onChange={(e) => setApprovalForm(prev => ({ ...prev, approvedAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter approved amount"
                  min="1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Requested: {formatCurrency(selectedLoan.requestedAmount)}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleApproveLoan}
                disabled={processing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-4 w-4" />
                    Approve Loan
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  resetApprovalForm();
                  setSelectedLoan(null);
                }}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                  setSelectedLoan(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Loan Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Farmer:</span>
                  <span className="font-medium">{selectedLoan.farmer.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Approved Amount:</span>
                  <span className="font-medium">{formatCurrency(selectedLoan.approvedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Returned:</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalReturned)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="text-gray-600">Total Due:</span>
                  <span className="font-bold text-orange-600">{formatCurrency(selectedLoan.totalDue)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (Rs.) *
                </label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter payment amount"
                  min="1"
                  max={selectedLoan.totalDue}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(selectedLoan.totalDue)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode *
                </label>
                <select
                  value={paymentForm.paymentMode}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Add payment notes..."
                  rows="2"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddPayment}
                disabled={processing}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    Add Payment
                  </>
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                  setSelectedLoan(null);
                }}
                disabled={processing}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loan History Modal */}
      {showHistoryModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Loan History - {selectedLoan.farmer.username}
              </h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedLoan(null);
                  setLoanHistory([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {historyLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading history...</p>
              </div>
            ) : loanHistory.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No transaction history found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loanHistory.map((entry, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          entry.transactionType === 'loan_approved' ? 'bg-green-100 text-green-800' :
                          entry.transactionType === 'partial_payment' ? 'bg-orange-100 text-orange-800' :
                          entry.transactionType === 'full_payment' ? 'bg-blue-100 text-blue-800' :
                          entry.transactionType === 'loan_cleared' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {LoanService.getTransactionTypeLabel(entry.transactionType)}
                        </span>
                        {entry.paymentMode && (
                          <span className="text-xs text-gray-500">
                            via {LoanService.getPaymentModeLabel(entry.paymentMode)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDateTime(entry.date)}
                      </span>
                    </div>
                    
                    <div className="text-sm">
                      <div className="flex items-center gap-4 mb-1">
                        <span>Previous Due: <strong>{formatCurrency(entry.previousDue)}</strong></span>
                        <span className={entry.transactionAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {entry.transactionAmount >= 0 ? '+' : ''}{formatCurrency(entry.transactionAmount)}
                        </span>
                        <span>= Current Due: <strong>{formatCurrency(entry.currentDue)}</strong></span>
                      </div>
                      
                      {entry.notes && (
                        <p className="text-gray-600 mt-2">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedLoan(null);
                  setLoanHistory([]);
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details Modal */}
      {showDetailsModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Loan Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLoan(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loan Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Loan Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loan ID:</span>
                      <span className="font-medium">{selectedLoan._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedLoan.requestedAmount)}</span>
                    </div>
                    {selectedLoan.approvedAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved Amount:</span>
                        <span className="font-medium text-blue-600">{formatCurrency(selectedLoan.approvedAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purpose:</span>
                      <span className="font-medium">{selectedLoan.purpose}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Farmer Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedLoan.farmer.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farmer ID:</span>
                      <span className="font-medium">{selectedLoan.farmer.uniqueId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mobile:</span>
                      <span className="font-medium">{selectedLoan.farmer.mobile}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Payment Information */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Status & Dates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedLoan.status)}`}>
                        {getStatusLabel(selectedLoan.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Request Date:</span>
                      <span className="font-medium">{formatDateTime(selectedLoan.requestDate)}</span>
                    </div>
                    {selectedLoan.approvalDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approval Date:</span>
                        <span className="font-medium">{formatDateTime(selectedLoan.approvalDate)}</span>
                      </div>
                    )}
                    {selectedLoan.clearanceDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Clearance Date:</span>
                        <span className="font-medium">{formatDateTime(selectedLoan.clearanceDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedLoan.approvedAmount && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Returned:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalReturned)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Due:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedLoan.totalDue)}</span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(getProgressPercentage(selectedLoan.totalReturned, selectedLoan.approvedAmount))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${getProgressPercentage(selectedLoan.totalReturned, selectedLoan.approvedAmount)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLoan.notes && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Notes</h4>
                    <p className="text-sm text-gray-700">{selectedLoan.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedLoan(null);
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;