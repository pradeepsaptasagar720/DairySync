import { useState, useEffect } from 'react';
import { 
  CreditCard, User, DollarSign, CheckCircle, Clock, AlertCircle, 
  Search, Eye, ThumbsUp, ThumbsDown, X, FileText,
  TrendingUp, Archive, Minus, Phone
} from 'lucide-react';
import loanService from '../../services/LoanService';
import { useEventBus } from '../../hooks/useEventBus';
import { EVENT_TYPES } from '../../constants/eventTypes';
import { LOAN_STATUS, LOAN_PURPOSE_LABELS, PAYMENT_MODE_LABELS, TRANSACTION_TYPES } from '../../constants/loanTypes';

const LoanManagement = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [loanRequests, setLoanRequests] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRepaymentModal, setShowRepaymentModal] = useState(false);
  const [showClearanceModal, setShowClearanceModal] = useState(false);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [showLoanHistoryModal, setShowLoanHistoryModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Advanced filters
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [amountFilter, setAmountFilter] = useState({
    minAmount: '',
    maxAmount: ''
  });
  
  // Approval form state
  const [approvalForm, setApprovalForm] = useState({
    paymentMode: '',
    notes: ''
  });

  // Repayment form state
  const [repaymentForm, setRepaymentForm] = useState({
    amount: '',
    paymentMode: '',
    notes: ''
  });

  // Loan history state
  const [loanHistory, setLoanHistory] = useState([]);

  // Mock employee data (in real app, this would come from auth context)
  const employeeData = {
    id: 'EMP-001',
    name: 'Priya Sharma'
  };

  const { subscribe } = useEventBus('LoanManagement');

  useEffect(() => {
    loadInitialData();
    
    // Subscribe to real-time updates
    const unsubscribeLoanCreated = subscribe(EVENT_TYPES.LOAN_REQUEST_CREATED, handleLoanCreated);
    const unsubscribeLoanApproved = subscribe(EVENT_TYPES.LOAN_REQUEST_APPROVED, handleLoanApproved);
    const unsubscribeLoanRejected = subscribe(EVENT_TYPES.LOAN_REQUEST_REJECTED, handleLoanRejected);
    const unsubscribeRepaymentMade = subscribe(EVENT_TYPES.LOAN_REPAYMENT_MADE, handleRepaymentMade);
    const unsubscribeLoanCleared = subscribe(EVENT_TYPES.LOAN_CLEARED, handleLoanCleared);

    return () => {
      unsubscribeLoanCreated();
      unsubscribeLoanApproved();
      unsubscribeLoanRejected();
      unsubscribeRepaymentMade();
      unsubscribeLoanCleared();
    };
  }, [subscribe]);

  useEffect(() => {
    loadLoanRequests();
  }, [filter, searchTerm, dateFilter, amountFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await loadLoanRequests();
      await loadAnalytics();
      await loadLoanHistory();
      setLoading(false);
    } catch (error) {
      console.error('Error loading loan data:', error);
      showNotification('Error loading loan data', 'error');
      setLoading(false);
    }
  };

  const loadLoanRequests = async () => {
    try {
      const filters = {};
      
      // Status filter
      if (filter !== 'all') {
        filters.status = filter;
      }

      // Date filter
      if (dateFilter.startDate && dateFilter.endDate) {
        filters.startDate = new Date(dateFilter.startDate);
        filters.endDate = new Date(dateFilter.endDate);
      }

      let requests = loanService.getLoanRequests(filters);

      // Apply search filter (farmer name, ID, or phone)
      if (searchTerm) {
        requests = requests.filter(loan => 
          loan.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (loan.farmerPhone && loan.farmerPhone.includes(searchTerm))
        );
      }

      // Apply amount filter
      if (amountFilter.minAmount || amountFilter.maxAmount) {
        requests = requests.filter(loan => {
          const amount = loan.loanAmount;
          const min = amountFilter.minAmount ? parseFloat(amountFilter.minAmount) : 0;
          const max = amountFilter.maxAmount ? parseFloat(amountFilter.maxAmount) : Infinity;
          return amount >= min && amount <= max;
        });
      }

      setLoanRequests(requests);
    } catch (error) {
      console.error('Error loading loan requests:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = loanService.getLoanAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadLoanHistory = async () => {
    try {
      const history = loanService.getLoanHistory();
      setLoanHistory(history);
    } catch (error) {
      console.error('Error loading loan history:', error);
    }
  };

  const handleLoanCreated = (data) => {
    showNotification(`New loan request from ${data.farmerName}`, 'info');
    loadLoanRequests();
    loadAnalytics();
  };

  const handleLoanApproved = (data) => {
    showNotification(`Loan approved for ${data.loanRequest.farmerName}`, 'success');
    loadLoanRequests();
    loadAnalytics();
    loadLoanHistory();
    setShowApprovalModal(false);
    setSelectedLoan(null);
    resetApprovalForm();
  };

  const handleLoanRejected = (data) => {
    showNotification(`Loan rejected for ${data.loanRequest.farmerName}`, 'info');
    loadLoanRequests();
    loadAnalytics();
    loadLoanHistory();
    setShowRejectionModal(false);
    setSelectedLoan(null);
    setRejectionReason('');
  };

  const handleRepaymentMade = (data) => {
    const message = data.repaymentResult.isFullyPaid 
      ? `Loan fully repaid by ${data.loanRequest.farmerName}!`
      : `Partial repayment of Rs.${data.repaymentResult.repaymentAmount} received from ${data.loanRequest.farmerName}`;
    
    showNotification(message, 'success');
    loadLoanRequests();
    loadAnalytics();
    loadLoanHistory();
    setShowRepaymentModal(false);
    setSelectedLoan(null);
    resetRepaymentForm();
  };

  const handleLoanCleared = (data) => {
    showNotification(`Loan cleared for ${data.farmerName}`, 'success');
    loadLoanRequests();
    loadAnalytics();
    loadLoanHistory();
    setShowClearanceModal(false);
    setSelectedLoan(null);
  };

  const showNotification = (message, type = 'info', duration = 5000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const handleApproveLoan = async () => {
    // Comprehensive validation for loan approval
    if (!selectedLoan) {
      showNotification('No loan selected for approval processing', 'error');
      return;
    }

    // Validate loan status
    if (selectedLoan.status !== LOAN_STATUS.REQUESTED) {
      showNotification(
        `Cannot approve loan with status "${selectedLoan.status}". Only requested loans can be approved.`, 
        'error'
      );
      return;
    }

    // Validate payment mode selection
    if (!approvalForm.paymentMode || approvalForm.paymentMode.trim() === '') {
      showNotification('Payment mode is required for loan approval. Please select a disbursement method.', 'error');
      return;
    }

    // Validate payment mode is from allowed options
    const validPaymentModes = Object.keys(PAYMENT_MODE_LABELS);
    if (!validPaymentModes.includes(approvalForm.paymentMode)) {
      showNotification('Invalid payment mode selected. Please choose a valid disbursement method.', 'error');
      return;
    }

    // Validate loan amount is within limits
    if (selectedLoan.loanAmount < 1000) {
      showNotification('Loan amount is below minimum limit (Rs.1,000). Cannot approve this loan.', 'error');
      return;
    }

    if (selectedLoan.loanAmount > 500000) {
      showNotification('Loan amount exceeds maximum limit (Rs.5,00,000). Cannot approve this loan.', 'error');
      return;
    }

    // Validate notes field length (optional but if provided, should be reasonable)
    if (approvalForm.notes && approvalForm.notes.length > 500) {
      showNotification('Approval notes cannot exceed 500 characters. Please shorten your notes.', 'error');
      return;
    }

    // Validate farmer information exists
    if (!selectedLoan.farmerName || !selectedLoan.farmerId) {
      showNotification('Incomplete farmer information. Cannot approve loan without valid farmer details.', 'error');
      return;
    }

    try {
      setProcessing(true);
      await loanService.approveLoanRequest(
        selectedLoan.id,
        employeeData.id,
        employeeData.name,
        approvalForm.paymentMode,
        approvalForm.notes
      );
    } catch (error) {
      console.error('Error approving loan:', error);
      showNotification(error.message || 'Error approving loan', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectLoan = async () => {
    // Comprehensive validation for loan rejection
    if (!selectedLoan) {
      showNotification('No loan selected for rejection processing', 'error');
      return;
    }

    // Validate loan status
    if (selectedLoan.status !== LOAN_STATUS.REQUESTED) {
      showNotification(
        `Cannot reject loan with status "${selectedLoan.status}". Only requested loans can be rejected.`, 
        'error'
      );
      return;
    }

    // Validate rejection reason
    if (!rejectionReason || rejectionReason.trim() === '') {
      showNotification('Rejection reason is required. Please provide a clear reason for rejecting this loan.', 'error');
      return;
    }

    // Validate rejection reason length
    if (rejectionReason.trim().length < 10) {
      showNotification('Rejection reason must be at least 10 characters long. Please provide a detailed reason.', 'error');
      return;
    }

    if (rejectionReason.length > 500) {
      showNotification('Rejection reason cannot exceed 500 characters. Please shorten your reason.', 'error');
      return;
    }

    // Validate farmer information exists
    if (!selectedLoan.farmerName || !selectedLoan.farmerId) {
      showNotification('Incomplete farmer information. Cannot reject loan without valid farmer details.', 'error');
      return;
    }

    try {
      setProcessing(true);
      await loanService.rejectLoanRequest(
        selectedLoan.id,
        employeeData.id,
        employeeData.name,
        rejectionReason.trim()
      );
    } catch (error) {
      console.error('Error rejecting loan:', error);
      showNotification(error.message || 'Error rejecting loan', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessRepayment = async () => {
    // Comprehensive validation for repayment form
    if (!selectedLoan) {
      showNotification('No loan selected for repayment processing', 'error');
      return;
    }

    // Validate repayment amount field
    if (!repaymentForm.amount || repaymentForm.amount.trim() === '') {
      showNotification('Repayment amount is required. Please enter a valid amount.', 'error');
      return;
    }

    const amount = parseFloat(repaymentForm.amount);
    
    // Check if amount is a valid number
    if (isNaN(amount)) {
      showNotification('Please enter a valid numeric amount for repayment.', 'error');
      return;
    }

    // Check minimum amount validation
    if (amount <= 0) {
      showNotification('Repayment amount must be greater than Rs.0. Please enter a positive amount.', 'error');
      return;
    }

    // Check minimum repayment amount (Rs.100 as per business rules)
    if (amount < 100) {
      showNotification('Minimum repayment amount is Rs.100. Please enter at least Rs.100.', 'error');
      return;
    }

    // Check maximum amount validation (cannot exceed total due)
    if (amount > selectedLoan.totalDue) {
      showNotification(
        `Repayment amount (Rs.${amount.toLocaleString()}) cannot exceed total due amount (Rs.${selectedLoan.totalDue.toLocaleString()}). Please enter a valid amount.`, 
        'error'
      );
      return;
    }

    // Validate payment mode selection
    if (!repaymentForm.paymentMode || repaymentForm.paymentMode.trim() === '') {
      showNotification('Payment mode is required. Please select a payment method.', 'error');
      return;
    }

    // Validate payment mode is from allowed options
    const validPaymentModes = Object.keys(PAYMENT_MODE_LABELS);
    if (!validPaymentModes.includes(repaymentForm.paymentMode)) {
      showNotification('Invalid payment mode selected. Please choose a valid payment method.', 'error');
      return;
    }

    // Validate notes field length (optional but if provided, should be reasonable)
    if (repaymentForm.notes && repaymentForm.notes.length > 500) {
      showNotification('Notes cannot exceed 500 characters. Please shorten your notes.', 'error');
      return;
    }

    // Check loan status validation
    if (!selectedLoan.canAcceptRepayment()) {
      showNotification(
        `Cannot process repayment for loan with status "${selectedLoan.status}". Only approved or partially paid loans can accept repayments.`, 
        'error'
      );
      return;
    }

    try {
      setProcessing(true);
      await loanService.processLoanRepayment(
        selectedLoan.id,
        amount,
        employeeData.id,
        employeeData.name,
        repaymentForm.paymentMode
      );
    } catch (error) {
      console.error('Error processing repayment:', error);
      showNotification(error.message || 'Error processing repayment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleClearLoan = async () => {
    // Comprehensive validation for loan clearance
    if (!selectedLoan) {
      showNotification('No loan selected for clearance processing', 'error');
      return;
    }

    // Validate loan status
    if (selectedLoan.status !== LOAN_STATUS.FULLY_CLEARED) {
      showNotification(
        `Cannot clear loan with status "${selectedLoan.status}". Only fully cleared loans can be closed.`, 
        'error'
      );
      return;
    }

    // Validate total due amount
    if (selectedLoan.totalDue > 0) {
      showNotification(
        `Cannot clear loan with pending amount of Rs.${selectedLoan.totalDue.toLocaleString()}. Loan must be fully paid before clearance.`, 
        'error'
      );
      return;
    }

    // Validate using the model's method
    if (!selectedLoan.canBeCleared()) {
      showNotification('Loan cannot be cleared at this time. Please ensure all payments are completed and loan is fully cleared.', 'error');
      return;
    }

    // Validate farmer information exists
    if (!selectedLoan.farmerName || !selectedLoan.farmerId) {
      showNotification('Incomplete farmer information. Cannot clear loan without valid farmer details.', 'error');
      return;
    }

    try {
      setProcessing(true);
      await loanService.clearLoan(
        selectedLoan.id,
        employeeData.id,
        employeeData.name
      );
    } catch (error) {
      console.error('Error clearing loan:', error);
      showNotification(error.message || 'Error clearing loan', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const resetRepaymentForm = () => {
    setRepaymentForm({
      amount: '',
      paymentMode: '',
      notes: ''
    });
  };

  const resetApprovalForm = () => {
    setApprovalForm({
      paymentMode: '',
      notes: ''
    });
  };

  const handleRepaymentFormChange = (e) => {
    const { name, value } = e.target;
    
    // Real-time validation for amount field
    if (name === 'amount') {
      const numericValue = parseFloat(value);
      
      // Clear any existing validation errors when user starts typing
      if (value === '') {
        // Reset any validation styling
      } else if (isNaN(numericValue)) {
        // Invalid number - could show inline error
      } else if (numericValue <= 0) {
        // Negative or zero amount
      } else if (numericValue < 100) {
        // Below minimum amount
      } else if (selectedLoan && numericValue > selectedLoan.totalDue) {
        // Exceeds total due - could show inline warning
      }
    }
    
    setRepaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApprovalFormChange = (e) => {
    const { name, value } = e.target;
    setApprovalForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilter('all');
    setSearchTerm('');
    setDateFilter({ startDate: '', endDate: '' });
    setAmountFilter({ minAmount: '', maxAmount: '' });
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

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'text-gray-600',
      2: 'text-blue-600',
      3: 'text-orange-600',
      4: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Management</h1>
        <p className="text-gray-600">Review and manage farmer loan requests</p>
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

        {/* Enhanced Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Requested</p>
                <p className="text-3xl font-bold text-blue-600">{analytics.requestedLoans || 0}</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{analytics.approvedLoans || 0}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Partially Paid</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.partiallyPaidLoans || 0}</p>
              </div>
              <Minus className="h-10 w-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fully Cleared</p>
                <p className="text-3xl font-bold text-purple-600">{analytics.fullyClearedLoans || 0}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(analytics.totalApprovedAmount || 0)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Due</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(analytics.totalDueAmount || 0)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-4">
            {/* Search and Status Filter Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search by farmer name, loan ID, or phone number..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Limit search term length to prevent performance issues
                      if (value.length <= 100) {
                        setSearchTerm(value);
                      } else {
                        showNotification('Search term cannot exceed 100 characters', 'error', 3000);
                      }
                    }}
                    maxLength="100"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {['all', 'requested', 'approved', 'partially_paid', 'fully_cleared', 'rejected', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const endDate = dateFilter.endDate;
                      
                      if (!endDate || new Date(startDate) <= new Date(endDate)) {
                        setDateFilter(prev => ({ ...prev, startDate }));
                      } else {
                        showNotification('Start date cannot be after end date', 'error', 3000);
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => {
                      const endDate = e.target.value;
                      const startDate = dateFilter.startDate;
                      
                      if (!startDate || new Date(endDate) >= new Date(startDate)) {
                        setDateFilter(prev => ({ ...prev, endDate }));
                      } else {
                        showNotification('End date cannot be before start date', 'error', 3000);
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]} // Cannot select future dates
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range (Rs.)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={amountFilter.minAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      
                      if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 10000000)) {
                        setAmountFilter(prev => ({ ...prev, minAmount: value }));
                      } else {
                        showNotification('Please enter a valid minimum amount (0 - 1,00,00,000)', 'error', 3000);
                      }
                    }}
                    min="0"
                    max="10000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={amountFilter.maxAmount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = parseFloat(value);
                      const minValue = parseFloat(amountFilter.minAmount) || 0;
                      
                      if (value === '' || (!isNaN(numValue) && numValue >= minValue && numValue <= 10000000)) {
                        setAmountFilter(prev => ({ ...prev, maxAmount: value }));
                      } else if (!isNaN(numValue) && numValue < minValue) {
                        showNotification('Maximum amount cannot be less than minimum amount', 'error', 3000);
                      } else {
                        showNotification('Please enter a valid maximum amount (0 - 1,00,00,000)', 'error', 3000);
                      }
                    }}
                    min="0"
                    max="10000000"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loan Requests List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Loan Requests ({loanRequests.length})
            </h2>
          </div>

          {loanRequests.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No loan requests found</p>
              <p className="text-sm text-gray-400">
                {filter === 'all' ? 'No loan requests available' : `No ${filter} loan requests`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {loanRequests.map((loan) => (
                <div key={loan.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{loan.farmerName}</h3>
                        <p className="text-sm text-gray-500">ID: {loan.farmerId}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{loan.farmerPhone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {formatCurrency(loan.loanAmount)}
                      </div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1).replace('_', ' ')}
                      </div>
                      {(loan.status === LOAN_STATUS.APPROVED || loan.status === LOAN_STATUS.PARTIALLY_PAID) && (
                        <div className="text-sm text-orange-600 font-medium mt-1">
                          Total Due: {formatCurrency(loan.totalDue)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Purpose:</span>
                      <span className="ml-2 text-gray-900">
                        {LOAN_PURPOSE_LABELS[loan.loanPurpose]}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Request Date:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(loan.requestDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <span className={`ml-2 font-medium ${getPriorityColor(loan.priority)}`}>
                        {loan.priority === 4 ? 'Urgent' : loan.priority === 3 ? 'High' : loan.priority === 2 ? 'Normal' : 'Low'}
                      </span>
                    </div>

                    {(loan.status === LOAN_STATUS.APPROVED || loan.status === LOAN_STATUS.PARTIALLY_PAID) && (
                      <div>
                        <span className="text-gray-500">Total Due:</span>
                        <span className="ml-2 text-orange-600 font-semibold">{formatCurrency(loan.totalDue)}</span>
                      </div>
                    )}

                    {(loan.status === LOAN_STATUS.FULLY_CLEARED || loan.status === LOAN_STATUS.CLOSED) && (
                      <div>
                        <span className="text-gray-500">Total Repaid:</span>
                        <span className="ml-2 text-green-600 font-semibold">{formatCurrency(loan.totalRepaid)}</span>
                      </div>
                    )}
                  </div>

                  {loan.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {loan.description}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 flex-wrap">
                    {/* View Details Button - Always Available */}
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowLoanDetailsModal(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>

                    {/* View Loan History Button - Always Available */}
                    <button
                      onClick={() => {
                        setSelectedLoan(loan);
                        setShowLoanHistoryModal(true);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Loan History
                    </button>

                    {/* Approval/Rejection Buttons - Only for Requested Status */}
                    {loan.status === LOAN_STATUS.REQUESTED && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowApprovalModal(true);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Approve
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedLoan(loan);
                            setShowRejectionModal(true);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    )}

                    {/* Repayment Button - For Approved and Partially Paid Loans */}
                    {(loan.status === LOAN_STATUS.APPROVED || loan.status === LOAN_STATUS.PARTIALLY_PAID) && (
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowRepaymentModal(true);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                      >
                        <DollarSign className="h-4 w-4" />
                        Process Repayment
                      </button>
                    )}

                    {/* Clear Loan Button - Only for Fully Cleared Loans */}
                    {loan.status === LOAN_STATUS.FULLY_CLEARED && loan.canBeCleared() && (
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowClearanceModal(true);
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <Archive className="h-4 w-4" />
                        Clear & Close
                      </button>
                    )}
                  </div>

                  {loan.status === LOAN_STATUS.REJECTED && loan.rejectionReason && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Rejection Reason:</strong> {loan.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approval Confirmation Modal */}
        {showApprovalModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Approve Loan Request</h3>
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    resetApprovalForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Please review the loan details and select payment mode for approval:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Farmer:</span>
                    <span className="font-medium">{selectedLoan.farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purpose:</span>
                    <span className="font-medium">{LOAN_PURPOSE_LABELS[selectedLoan.loanPurpose]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenure:</span>
                    <span className="font-medium">{selectedLoan.tenureMonths} months</span>
                  </div>
                </div>

                {/* Approval Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Mode for Disbursement *
                    </label>
                    <select
                      name="paymentMode"
                      value={approvalForm.paymentMode}
                      onChange={handleApprovalFormChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        !approvalForm.paymentMode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select payment mode</option>
                      {Object.entries(PAYMENT_MODE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {!approvalForm.paymentMode && (
                      <p className="text-xs text-red-600 mt-1">Payment mode is required for loan approval</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approval Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={approvalForm.notes}
                      onChange={handleApprovalFormChange}
                      rows="2"
                      maxLength="500"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                        approvalForm.notes && approvalForm.notes.length > 500 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Add any notes about this approval..."
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">Optional approval comments</p>
                      <p className={`text-xs ${approvalForm.notes && approvalForm.notes.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {approvalForm.notes ? approvalForm.notes.length : 0}/500 characters
                      </p>
                    </div>
                    {approvalForm.notes && approvalForm.notes.length > 500 && (
                      <p className="text-xs text-red-600 mt-1">Notes cannot exceed 500 characters</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApproveLoan}
                  disabled={
                    processing || 
                    !approvalForm.paymentMode ||
                    (approvalForm.notes && approvalForm.notes.length > 500)
                  }
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Approval
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowApprovalModal(false);
                    resetApprovalForm();
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

        {/* Rejection Modal */}
        {showRejectionModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reject Loan Request</h3>
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this loan request:
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Farmer:</span>
                    <span className="font-medium">{selectedLoan.farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.loanAmount)}</span>
                  </div>
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  rows="3"
                  maxLength="500"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                    rejectionReason && (rejectionReason.trim().length < 10 || rejectionReason.length > 500) 
                      ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                <div className="flex justify-between mt-1">
                  <div>
                    {rejectionReason && rejectionReason.trim().length < 10 && (
                      <p className="text-xs text-red-600">Reason must be at least 10 characters long</p>
                    )}
                    {rejectionReason && rejectionReason.length > 500 && (
                      <p className="text-xs text-red-600">Reason cannot exceed 500 characters</p>
                    )}
                    {!rejectionReason && (
                      <p className="text-xs text-red-600">Rejection reason is required</p>
                    )}
                  </div>
                  <p className={`text-xs ${rejectionReason && rejectionReason.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {rejectionReason ? rejectionReason.length : 0}/500 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRejectLoan}
                  disabled={
                    processing || 
                    !rejectionReason.trim() ||
                    rejectionReason.trim().length < 10 ||
                    rejectionReason.length > 500
                  }
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4" />
                      Confirm Rejection
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
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

        {/* Repayment Modal */}
        {showRepaymentModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Process Loan Repayment</h3>
                <button
                  onClick={() => {
                    setShowRepaymentModal(false);
                    resetRepaymentForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                {/* Loan Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Loan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Farmer:</span>
                      <span className="font-medium">{selectedLoan.farmerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedLoan.loanAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Repaid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalRepaid)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-medium">Total Due:</span>
                      <span className="font-bold text-orange-600">{formatCurrency(selectedLoan.totalDue)}</span>
                    </div>
                  </div>
                </div>

                {/* Repayment Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repayment Amount (Rs.) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={repaymentForm.amount}
                      onChange={handleRepaymentFormChange}
                      min="100"
                      max={selectedLoan.totalDue}
                      step="1"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        repaymentForm.amount && (
                          isNaN(parseFloat(repaymentForm.amount)) || 
                          parseFloat(repaymentForm.amount) <= 0 || 
                          parseFloat(repaymentForm.amount) < 100 ||
                          parseFloat(repaymentForm.amount) > selectedLoan.totalDue
                        ) ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter repayment amount"
                      required
                    />
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-gray-500">
                        Range: Rs.100 - Rs.{selectedLoan.totalDue.toLocaleString()} (Total Due)
                      </p>
                      {repaymentForm.amount && isNaN(parseFloat(repaymentForm.amount)) && (
                        <p className="text-xs text-red-600">Please enter a valid number</p>
                      )}
                      {repaymentForm.amount && parseFloat(repaymentForm.amount) <= 0 && (
                        <p className="text-xs text-red-600">Amount must be greater than Rs.0</p>
                      )}
                      {repaymentForm.amount && parseFloat(repaymentForm.amount) > 0 && parseFloat(repaymentForm.amount) < 100 && (
                        <p className="text-xs text-red-600">Minimum repayment amount is Rs.100</p>
                      )}
                      {repaymentForm.amount && parseFloat(repaymentForm.amount) > selectedLoan.totalDue && (
                        <p className="text-xs text-red-600">Amount cannot exceed total due (Rs.{selectedLoan.totalDue.toLocaleString()})</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Mode *
                    </label>
                    <select
                      name="paymentMode"
                      value={repaymentForm.paymentMode}
                      onChange={handleRepaymentFormChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        !repaymentForm.paymentMode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select payment mode</option>
                      {Object.entries(PAYMENT_MODE_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {!repaymentForm.paymentMode && (
                      <p className="text-xs text-red-600 mt-1">Payment mode is required</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={repaymentForm.notes}
                      onChange={handleRepaymentFormChange}
                      rows="2"
                      maxLength="500"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        repaymentForm.notes && repaymentForm.notes.length > 500 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Add any notes about this repayment..."
                    />
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-gray-500">Optional additional information</p>
                      <p className={`text-xs ${repaymentForm.notes && repaymentForm.notes.length > 450 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {repaymentForm.notes ? repaymentForm.notes.length : 0}/500 characters
                      </p>
                    </div>
                    {repaymentForm.notes && repaymentForm.notes.length > 500 && (
                      <p className="text-xs text-red-600 mt-1">Notes cannot exceed 500 characters</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleProcessRepayment}
                  disabled={
                    processing || 
                    !repaymentForm.amount || 
                    !repaymentForm.paymentMode ||
                    isNaN(parseFloat(repaymentForm.amount)) ||
                    parseFloat(repaymentForm.amount) <= 0 ||
                    parseFloat(repaymentForm.amount) < 100 ||
                    parseFloat(repaymentForm.amount) > selectedLoan.totalDue ||
                    (repaymentForm.notes && repaymentForm.notes.length > 500)
                  }
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Process Repayment
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowRepaymentModal(false);
                    resetRepaymentForm();
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

        {/* Loan Clearance Modal */}
        {showClearanceModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Clear & Close Loan</h3>
                <button
                  onClick={() => setShowClearanceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to clear and close this loan? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Farmer:</span>
                    <span className="font-medium">{selectedLoan.farmerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Repaid:</span>
                    <span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalRepaid)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-purple-600">Fully Cleared</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Once cleared, this loan will be marked as closed and moved to the archive.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClearLoan}
                  disabled={processing}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Clear & Close
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowClearanceModal(false)}
                  disabled={processing}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {showLoanDetailsModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Loan Details</h3>
                <button
                  onClick={() => setShowLoanDetailsModal(false)}
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
                        <span className="font-medium">{selectedLoan.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formatCurrency(selectedLoan.loanAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Purpose:</span>
                        <span className="font-medium">{LOAN_PURPOSE_LABELS[selectedLoan.loanPurpose]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tenure:</span>
                        <span className="font-medium">{selectedLoan.tenureMonths} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Due:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(selectedLoan.totalDue)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Farmer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedLoan.farmerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Farmer ID:</span>
                        <span className="font-medium">{selectedLoan.farmerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedLoan.farmerPhone}</span>
                      </div>
                    </div>
                  </div>

                  {selectedLoan.description && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Description</h4>
                      <p className="text-sm text-gray-700">{selectedLoan.description}</p>
                    </div>
                  )}
                </div>

                {/* Status and History */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedLoan.status)}`}>
                          {selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Request Date:</span>
                        <span className="font-medium">{new Date(selectedLoan.requestDate).toLocaleDateString()}</span>
                      </div>
                      {selectedLoan.approvalDate && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approval Date:</span>
                          <span className="font-medium">{new Date(selectedLoan.approvalDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedLoan.approvedByName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Approved By:</span>
                          <span className="font-medium">{selectedLoan.approvedByName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {(selectedLoan.status === LOAN_STATUS.APPROVED || 
                    selectedLoan.status === LOAN_STATUS.PARTIALLY_PAID || 
                    selectedLoan.status === LOAN_STATUS.FULLY_CLEARED || 
                    selectedLoan.status === LOAN_STATUS.CLOSED) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Repayment Status</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Repaid:</span>
                          <span className="font-medium text-green-600">{formatCurrency(selectedLoan.totalRepaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Due:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(selectedLoan.totalDue)}</span>
                        </div>
                        {selectedLoan.receiptId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Receipt ID:</span>
                            <span className="font-medium">{selectedLoan.receiptId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loan History */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Transaction History</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {loanHistory
                        .filter(record => record.loanId === selectedLoan.id)
                        .map((record, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{record.description}</span>
                                {record.amount > 0 && (
                                  <span className="ml-2 text-green-600">Rs.{record.amount.toLocaleString()}</span>
                                )}
                              </div>
                              <span className="text-gray-500">
                                {new Date(record.transactionDate).toLocaleDateString()}
                              </span>
                            </div>
                            {record.actionByName && (
                              <div className="text-gray-500 mt-1">
                                By: {record.actionByName}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLoanDetailsModal(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loan History Modal */}
        {showLoanHistoryModal && selectedLoan && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Loan History - {selectedLoan.farmerName}
                </h3>
                <button
                  onClick={() => setShowLoanHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Loan Summary */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Loan Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Loan ID:</span>
                    <div className="font-medium">{selectedLoan.id}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Amount:</span>
                    <div className="font-medium">{formatCurrency(selectedLoan.loanAmount)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Repaid:</span>
                    <div className="font-medium text-green-600">{formatCurrency(selectedLoan.totalRepaid)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Due:</span>
                    <div className="font-medium text-orange-600">{formatCurrency(selectedLoan.totalDue)}</div>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Transaction History</h4>
                
                {loanHistory
                  .filter(record => record.loanId === selectedLoan.id)
                  .length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No transaction history found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loanHistory
                      .filter(record => record.loanId === selectedLoan.id)
                      .map((record, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  record.transactionType === TRANSACTION_TYPES.LOAN_APPROVED ? 'bg-green-100 text-green-800' :
                                  record.transactionType === TRANSACTION_TYPES.PARTIAL_REPAYMENT ? 'bg-blue-100 text-blue-800' :
                                  record.transactionType === TRANSACTION_TYPES.FULL_REPAYMENT ? 'bg-purple-100 text-purple-800' :
                                  record.transactionType === TRANSACTION_TYPES.LOAN_CLEARED ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {record.transactionType.charAt(0).toUpperCase() + record.transactionType.slice(1).replace('_', ' ')}
                                </span>
                                {record.amount > 0 && (
                                  <span className="text-lg font-semibold text-gray-900">
                                    Rs.{record.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-gray-700 mb-2">{record.description}</p>
                              
                              {record.metadata?.calculationDisplay && (
                                <div className="bg-blue-50 p-2 rounded text-sm text-blue-800 font-mono">
                                  Calculation: {record.metadata.calculationDisplay}
                                </div>
                              )}
                              
                              {record.paymentMode && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Payment Mode: {PAYMENT_MODE_LABELS[record.paymentMode]}
                                </div>
                              )}
                              
                              {record.actionByName && (
                                <div className="text-sm text-gray-600 mt-1">
                                  Processed by: {record.actionByName}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right text-sm text-gray-500">
                              <div>{new Date(record.transactionDate).toLocaleDateString()}</div>
                              <div>{new Date(record.transactionDate).toLocaleTimeString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLoanHistoryModal(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanManagement;
