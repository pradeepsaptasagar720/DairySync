import api from './api';

class LoanService {
  constructor() {
    this.baseURL = '/api/loanfeed';
  }

  // Get all loans with filters
  async getLoans(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/loans`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Approve a loan
  async approveLoan(loanId, approvedAmount) {
    try {
      const response = await api.post(`${this.baseURL}/loans/${loanId}/approve`, {
        approvedAmount
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add payment to a loan
  async addPayment(loanId, paymentData) {
    try {
      const response = await api.post(`${this.baseURL}/loans/${loanId}/payment`, {
        paymentAmount: paymentData.amount,
        paymentMode: paymentData.paymentMode,
        notes: paymentData.notes
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Clear a loan
  async clearLoan(loanId) {
    try {
      const response = await api.post(`${this.baseURL}/loans/${loanId}/clear`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get loan history for a farmer
  async getLoanHistory(farmerId, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/loans/history/${farmerId}`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get loan statistics
  async getLoanStats(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/stats`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get loan history
  async getLoanFeedHistory(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/history`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get dashboard data
  async getDashboardData() {
    try {
      const response = await api.get(`${this.baseURL}/dashboard`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all farmers (for dropdowns)
  async getFarmers() {
    try {
      // This would typically be a separate endpoint, but for now we'll use a workaround
      const response = await api.get(`${this.baseURL}/loans?limit=1000`);
      if (response.data.success && response.data.data && response.data.data.loans) {
        const uniqueFarmers = response.data.data.loans.reduce((acc, loan) => {
          if (loan.farmer && !acc.find(f => f._id === loan.farmer._id)) {
            acc.push(loan.farmer);
          }
          return acc;
        }, []);
        return { success: true, data: uniqueFarmers };
      }
      return { success: true, data: [] };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Farmer-side methods
  // Get farmer loan summary
  async getFarmerLoanSummary(farmerId) {
    try {
      const response = await api.get(`/api/farmer/loans/summary/${farmerId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create loan request (farmer-side)
  async createLoanRequest(requestData) {
    try {
      const response = await api.post('/api/farmer/loans/request', requestData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.error?.message || error.response.data?.message || 'Server error',
        status: error.response.status,
        code: error.response.data?.error?.code
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        status: 0
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0
      };
    }
  }

  // Utility methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
  }

  formatDateTime(date) {
    return new Date(date).toLocaleString('en-IN');
  }

  getStatusColor(status) {
    const colors = {
      requested: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      partially_paid: 'bg-orange-100 text-orange-800',
      fully_cleared: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status) {
    const labels = {
      requested: 'Requested',
      approved: 'Approved',
      partially_paid: 'Partially Paid',
      fully_cleared: 'Fully Cleared',
      closed: 'Closed'
    };
    return labels[status] || status;
  }

  getTransactionTypeLabel(type) {
    const labels = {
      loan_approved: 'Loan Approved',
      partial_payment: 'Partial Payment',
      full_payment: 'Full Payment',
      loan_cleared: 'Loan Cleared',
      loan_closed: 'Loan Closed'
    };
    return labels[type] || type;
  }

  getPaymentModeLabel(mode) {
    const labels = {
      cash: 'Cash',
      bank_transfer: 'Bank Transfer',
      cheque: 'Cheque',
      upi: 'UPI',
      other: 'Other'
    };
    return labels[mode] || mode;
  }

  canApprove(loan) {
    return loan.status === 'requested';
  }

  canAddPayment(loan) {
    return ['approved', 'partially_paid'].includes(loan.status) && loan.totalDue > 0;
  }

  canClear(loan) {
    return loan.status === 'fully_cleared' && loan.totalDue === 0;
  }

  getPaymentProgress(totalReturned, approvedAmount) {
    if (!approvedAmount || approvedAmount === 0) return 0;
    return Math.min((totalReturned / approvedAmount) * 100, 100);
  }
}

export default new LoanService();