import { TRANSACTION_TYPES, PAYMENT_MODES } from '../constants/loanTypes';

/**
 * LoanHistory Model - Tracks loan history and repayment records
 * Maintains audit trail for all loan-related activities
 */
export class LoanHistory {
  constructor({
    id = null,
    loanId,
    farmerId,
    farmerName,
    transactionType,
    transactionDate = new Date(),
    actionBy = null,
    actionByName = null,
    amount = 0,
    previousBalance = 0,
    newBalance = 0,
    description = '',
    paymentMode = null,
    metadata = {}
  }) {
    this.id = id || this.generateId();
    this.loanId = loanId;
    this.farmerId = farmerId;
    this.farmerName = farmerName;
    this.transactionType = transactionType;
    this.transactionDate = new Date(transactionDate);
    this.actionBy = actionBy;
    this.actionByName = actionByName;
    this.amount = parseFloat(amount);
    this.previousBalance = parseFloat(previousBalance);
    this.newBalance = parseFloat(newBalance);
    this.description = description;
    this.paymentMode = paymentMode;
    this.metadata = metadata;
  }

  /**
   * Generate unique history record ID
   * @returns {string} Unique ID
   */
  generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `HIST-${timestamp}-${random}`;
  }

  /**
   * Create loan approval history record
   * @param {object} data - History data
   * @returns {LoanHistory} History record
   */
  static createLoanApproval(data) {
    return new LoanHistory({
      ...data,
      transactionType: TRANSACTION_TYPES.LOAN_APPROVED,
      transactionDate: new Date(),
      description: `Loan approved: ₹${data.amount} for ${data.farmerName} - Total Due: ₹${data.newBalance}`,
      paymentMode: data.paymentMode,
      metadata: {
        tenureMonths: data.tenureMonths,
        receiptId: data.receiptId,
        totalDue: data.newBalance,
        paymentMode: data.paymentMode,
        notes: data.notes
      }
    });
  }

  /**
   * Create loan rejection history record
   * @param {object} data - History data
   * @returns {LoanHistory} History record
   */
  static createLoanRejection(data) {
    return new LoanHistory({
      ...data,
      transactionType: TRANSACTION_TYPES.LOAN_REJECTED,
      transactionDate: new Date(),
      description: `Loan rejected for ${data.farmerName}: ${data.rejectionReason}`,
      metadata: {
        rejectionReason: data.rejectionReason
      }
    });
  }

  /**
   * Create partial repayment history record
   * @param {object} data - History data
   * @returns {LoanHistory} History record
   */
  static createPartialRepayment(data) {
    return new LoanHistory({
      ...data,
      transactionType: TRANSACTION_TYPES.PARTIAL_REPAYMENT,
      transactionDate: new Date(),
      description: `Partial repayment: Previous Due (₹${data.previousBalance}) − Payment (₹${data.amount}) = Current Due (₹${data.newBalance})`,
      paymentMode: data.paymentMode,
      metadata: {
        paymentMode: data.paymentMode,
        remainingBalance: data.newBalance,
        calculationDisplay: `₹${data.previousBalance} − ₹${data.amount} = ₹${data.newBalance}`
      }
    });
  }

  /**
   * Create full repayment history record
   * @param {object} data - History data
   * @returns {LoanHistory} History record
   */
  static createFullRepayment(data) {
    return new LoanHistory({
      ...data,
      transactionType: TRANSACTION_TYPES.FULL_REPAYMENT,
      transactionDate: new Date(),
      description: `Full repayment: Previous Due (₹${data.previousBalance}) − Final Payment (₹${data.amount}) = Loan Fully Cleared (₹0)`,
      paymentMode: data.paymentMode,
      metadata: {
        paymentMode: data.paymentMode,
        totalRepaid: data.totalRepaid,
        calculationDisplay: `₹${data.previousBalance} − ₹${data.amount} = ₹0 (Fully Cleared)`
      }
    });
  }

  /**
   * Create loan clearance history record
   * @param {object} data - History data
   * @returns {LoanHistory} History record
   */
  static createLoanClearance(data) {
    return new LoanHistory({
      ...data,
      transactionType: TRANSACTION_TYPES.LOAN_CLEARED,
      transactionDate: new Date(),
      description: `Loan cleared and closed by ${data.actionByName}`,
      metadata: {
        clearanceDate: data.clearanceDate,
        totalRepaid: data.totalRepaid
      }
    });
  }

  /**
   * Get transaction type display information
   * @returns {object} Transaction type display info
   */
  getTransactionTypeInfo() {
    const transactionMap = {
      [TRANSACTION_TYPES.LOAN_APPROVED]: { color: 'green', label: 'Loan Approved', icon: 'CheckCircle' },
      [TRANSACTION_TYPES.LOAN_REJECTED]: { color: 'red', label: 'Loan Rejected', icon: 'XCircle' },
      [TRANSACTION_TYPES.PARTIAL_REPAYMENT]: { color: 'blue', label: 'Partial Repayment', icon: 'DollarSign' },
      [TRANSACTION_TYPES.FULL_REPAYMENT]: { color: 'purple', label: 'Full Repayment', icon: 'CheckCircle2' },
      [TRANSACTION_TYPES.LOAN_CLEARED]: { color: 'gray', label: 'Loan Cleared', icon: 'Archive' }
    };

    return transactionMap[this.transactionType] || { color: 'gray', label: 'Unknown', icon: 'Info' };
  }

  /**
   * Convert to plain object for storage/transmission
   * @returns {object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      loanId: this.loanId,
      farmerId: this.farmerId,
      farmerName: this.farmerName,
      transactionType: this.transactionType,
      transactionDate: this.transactionDate.toISOString(),
      actionBy: this.actionBy,
      actionByName: this.actionByName,
      amount: this.amount,
      previousBalance: this.previousBalance,
      newBalance: this.newBalance,
      description: this.description,
      paymentMode: this.paymentMode,
      metadata: this.metadata
    };
  }

  /**
   * Create LoanHistory instance from plain object
   * @param {object} data - Plain object data
   * @returns {LoanHistory} LoanHistory instance
   */
  static fromObject(data) {
    return new LoanHistory(data);
  }

  /**
   * Filter history by loan ID
   * @param {LoanHistory[]} history - Array of history records
   * @param {string} loanId - Loan ID to filter by
   * @returns {LoanHistory[]} Filtered history
   */
  static filterByLoanId(history, loanId) {
    return history.filter(record => record.loanId === loanId);
  }

  /**
   * Filter history by farmer ID
   * @param {LoanHistory[]} history - Array of history records
   * @param {string} farmerId - Farmer ID to filter by
   * @returns {LoanHistory[]} Filtered history
   */
  static filterByFarmerId(history, farmerId) {
    return history.filter(record => record.farmerId === farmerId);
  }

  /**
   * Filter history by date range
   * @param {LoanHistory[]} history - Array of history records
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {LoanHistory[]} Filtered history
   */
  static filterByDateRange(history, startDate, endDate) {
    return history.filter(record => {
      const recordDate = new Date(record.transactionDate);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  /**
   * Sort history by date (newest first)
   * @param {LoanHistory[]} history - Array of history records
   * @returns {LoanHistory[]} Sorted history
   */
  static sortByDate(history) {
    return history.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
  }
}