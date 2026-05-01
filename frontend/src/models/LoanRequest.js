import { LOAN_STATUS, LOAN_PURPOSES, LOAN_PRIORITY, TRANSACTION_TYPES } from '../constants/loanTypes';

/**
 * LoanRequest Model - Represents a farmer's loan request
 * Handles loan request creation, status management, and validation
 */
export class LoanRequest {
  constructor({
    id = null,
    farmerId,
    farmerName,
    farmerPhone,
    loanAmount,
    loanPurpose,
    description = '',
    requestDate = new Date(),
    status = LOAN_STATUS.REQUESTED,
    priority = LOAN_PRIORITY.NORMAL,
    approvalDate = null,
    approvedBy = null,
    approvedByName = null,
    rejectionReason = null,
    tenureMonths = 12,
    receiptId = null,
    lastUpdated = new Date(),
    isActive = false,
    closureDate = null,
    totalRepaid = 0,
    totalDue = 0,
    clearanceDate = null,
    clearedBy = null,
    clearedByName = null
  }) {
    this.id = id || this.generateId();
    this.farmerId = farmerId;
    this.farmerName = farmerName;
    this.farmerPhone = farmerPhone;
    this.loanAmount = parseFloat(loanAmount);
    this.loanPurpose = loanPurpose;
    this.description = description;
    this.requestDate = new Date(requestDate);
    this.status = status;
    this.priority = priority;
    this.approvalDate = approvalDate ? new Date(approvalDate) : null;
    this.approvedBy = approvedBy;
    this.approvedByName = approvedByName;
    this.rejectionReason = rejectionReason;
    this.tenureMonths = parseInt(tenureMonths);
    this.receiptId = receiptId;
    this.lastUpdated = new Date(lastUpdated);
    this.isActive = isActive;
    this.closureDate = closureDate ? new Date(closureDate) : null;
    this.totalRepaid = parseFloat(totalRepaid || 0);
    this.totalDue = parseFloat(totalDue || 0);
    this.clearanceDate = clearanceDate ? new Date(clearanceDate) : null;
    this.clearedBy = clearedBy;
    this.clearedByName = clearedByName;
  }

  /**
   * Generate unique loan request ID
   * @returns {string} Unique ID
   */
  generateId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `LOAN-${timestamp}-${random}`;
  }

  /**
   * Create a new loan request
   * @param {object} requestData - Loan request data
   * @returns {LoanRequest} New loan request instance
   */
  static createRequest(requestData) {
    const loanRequest = new LoanRequest({
      ...requestData,
      requestDate: new Date(),
      status: LOAN_STATUS.REQUESTED,
      lastUpdated: new Date()
    });

    // Validate the request
    loanRequest.validate();
    
    return loanRequest;
  }

  /**
   * Approve the loan request
   * @param {string} employeeId - Approving employee ID
   * @param {string} employeeName - Approving employee name
   * @param {string} receiptId - Generated receipt ID
   * @param {string} paymentMode - Payment mode for disbursement
   * @param {string} notes - Optional approval notes
   * @returns {object} Approval result
   */
  approve(employeeId, employeeName, receiptId, paymentMode = '', notes = '') {
    if (this.status !== LOAN_STATUS.REQUESTED) {
      throw new Error(`Cannot approve loan with status: ${this.status}`);
    }

    this.status = LOAN_STATUS.APPROVED;
    this.isActive = true;
    this.approvalDate = new Date();
    this.approvedBy = employeeId;
    this.approvedByName = employeeName;
    this.receiptId = receiptId;
    this.totalDue = this.loanAmount; // Initially, full amount is due (no interest)
    this.lastUpdated = new Date();

    return {
      success: true,
      loanId: this.id,
      approvalDate: this.approvalDate,
      approvedBy: this.approvedByName,
      receiptId: this.receiptId,
      totalDue: this.totalDue,
      paymentMode: paymentMode,
      notes: notes
    };
  }

  /**
   * Reject the loan request
   * @param {string} employeeId - Rejecting employee ID
   * @param {string} employeeName - Rejecting employee name
   * @param {string} reason - Rejection reason
   * @returns {object} Rejection result
   */
  reject(employeeId, employeeName, reason) {
    if (this.status !== LOAN_STATUS.REQUESTED) {
      throw new Error(`Cannot reject loan with status: ${this.status}`);
    }

    this.status = LOAN_STATUS.REJECTED;
    this.approvedBy = employeeId;
    this.approvedByName = employeeName;
    this.rejectionReason = reason;
    this.lastUpdated = new Date();

    return {
      success: true,
      loanId: this.id,
      rejectedBy: this.approvedByName,
      reason: this.rejectionReason
    };
  }

  /**
   * Process loan repayment (partial or full)
   * @param {number} repaymentAmount - Amount being repaid
   * @param {string} employeeId - Employee processing repayment
   * @param {string} employeeName - Employee name
   * @param {string} paymentMode - Payment mode
   * @param {Date} paymentDate - Payment date
   * @returns {object} Repayment result
   */
  processRepayment(repaymentAmount, employeeId, employeeName, paymentMode, paymentDate = new Date()) {
    if (this.status !== LOAN_STATUS.APPROVED && this.status !== LOAN_STATUS.PARTIALLY_PAID) {
      throw new Error(`Cannot process repayment for loan with status: ${this.status}`);
    }

    const amount = parseFloat(repaymentAmount);
    if (amount <= 0) {
      throw new Error('Repayment amount must be greater than 0');
    }

    if (amount > this.totalDue) {
      throw new Error(`Repayment amount (₹${amount}) cannot exceed total due (₹${this.totalDue})`);
    }

    const previousDue = this.totalDue;
    const previousBalance = this.totalDue;
    
    this.totalRepaid += amount;
    this.totalDue -= amount;
    
    // Update status based on remaining balance
    if (this.totalDue === 0) {
      this.status = LOAN_STATUS.FULLY_CLEARED;
      this.isActive = false;
    } else {
      this.status = LOAN_STATUS.PARTIALLY_PAID;
    }

    this.lastUpdated = new Date();

    return {
      success: true,
      loanId: this.id,
      repaymentAmount: amount,
      previousDue,
      previousBalance,
      newDue: this.totalDue,
      newBalance: this.totalDue,
      totalRepaid: this.totalRepaid,
      status: this.status,
      processedBy: employeeName,
      paymentMode,
      paymentDate,
      isFullyPaid: this.totalDue === 0
    };
  }

  /**
   * Clear the loan (mark as closed after full repayment)
   * @param {string} employeeId - Employee clearing the loan
   * @param {string} employeeName - Employee name
   * @returns {object} Clearance result
   */
  clearLoan(employeeId, employeeName) {
    if (this.status !== LOAN_STATUS.FULLY_CLEARED) {
      throw new Error(`Cannot clear loan with status: ${this.status}. Loan must be fully cleared first.`);
    }

    if (this.totalDue > 0) {
      throw new Error(`Cannot clear loan with total due: ₹${this.totalDue}`);
    }

    this.status = LOAN_STATUS.CLOSED;
    this.isActive = false;
    this.clearanceDate = new Date();
    this.clearedBy = employeeId;
    this.clearedByName = employeeName;
    this.lastUpdated = new Date();

    return {
      success: true,
      loanId: this.id,
      clearanceDate: this.clearanceDate,
      clearedBy: this.clearedByName,
      totalRepaid: this.totalRepaid
    };
  }

  /**
   * Get remaining balance (total due)
   * @returns {number} Remaining balance
   */
  getRemainingBalance() {
    return this.totalDue;
  }

  /**
   * Check if loan can be cleared
   * @returns {boolean} True if loan can be cleared
   */
  canBeCleared() {
    return this.status === LOAN_STATUS.FULLY_CLEARED && this.totalDue === 0;
  }

  /**
   * Check if repayment is allowed
   * @returns {boolean} True if repayment is allowed
   */
  canAcceptRepayment() {
    return this.status === LOAN_STATUS.APPROVED || this.status === LOAN_STATUS.PARTIALLY_PAID;
  }

  /**
   * Get loan priority score for sorting
   * @returns {number} Priority score
   */
  getPriorityScore() {
    const baseScore = this.priority;
    const ageInDays = (new Date() - this.requestDate) / (1000 * 60 * 60 * 24);
    
    // Increase priority for older requests
    const ageBonus = Math.min(ageInDays / 7, 2); // Max 2 points for age
    
    return baseScore + ageBonus;
  }

  /**
   * Get loan status display information
   * @returns {object} Status display info
   */
  getStatusInfo() {
    const statusMap = {
      [LOAN_STATUS.REQUESTED]: { color: 'blue', label: 'Requested' },
      [LOAN_STATUS.APPROVED]: { color: 'green', label: 'Approved' },
      [LOAN_STATUS.REJECTED]: { color: 'red', label: 'Rejected' },
      [LOAN_STATUS.PARTIALLY_PAID]: { color: 'yellow', label: 'Partially Paid' },
      [LOAN_STATUS.FULLY_CLEARED]: { color: 'purple', label: 'Fully Cleared' },
      [LOAN_STATUS.CLOSED]: { color: 'gray', label: 'Closed' }
    };

    return statusMap[this.status] || { color: 'gray', label: 'Unknown' };
  }

  /**
   * Validate loan request data
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.farmerId) {
      throw new Error('Farmer ID is required');
    }

    if (!this.farmerName || this.farmerName.trim().length === 0) {
      throw new Error('Farmer name is required');
    }

    if (!this.loanAmount || this.loanAmount <= 0) {
      throw new Error('Loan amount must be greater than 0');
    }

    if (this.loanAmount < 1000) {
      throw new Error('Minimum loan amount is ₹1,000');
    }

    if (this.loanAmount > 500000) {
      throw new Error('Maximum loan amount is ₹5,00,000');
    }

    if (!this.loanPurpose || !Object.values(LOAN_PURPOSES).includes(this.loanPurpose)) {
      throw new Error('Valid loan purpose is required');
    }

    if (this.description && this.description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }
  }

  /**
   * Convert to plain object for storage/transmission
   * @returns {object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      farmerId: this.farmerId,
      farmerName: this.farmerName,
      farmerPhone: this.farmerPhone,
      loanAmount: this.loanAmount,
      loanPurpose: this.loanPurpose,
      description: this.description,
      requestDate: this.requestDate.toISOString(),
      status: this.status,
      priority: this.priority,
      approvalDate: this.approvalDate ? this.approvalDate.toISOString() : null,
      approvedBy: this.approvedBy,
      approvedByName: this.approvedByName,
      rejectionReason: this.rejectionReason,
      tenureMonths: this.tenureMonths,
      receiptId: this.receiptId,
      lastUpdated: this.lastUpdated.toISOString(),
      isActive: this.isActive,
      closureDate: this.closureDate ? this.closureDate.toISOString() : null,
      totalRepaid: this.totalRepaid,
      totalDue: this.totalDue,
      clearanceDate: this.clearanceDate ? this.clearanceDate.toISOString() : null,
      clearedBy: this.clearedBy,
      clearedByName: this.clearedByName,
      remainingBalance: this.getRemainingBalance(),
      canBeCleared: this.canBeCleared(),
      canAcceptRepayment: this.canAcceptRepayment()
    };
  }

  /**
   * Create LoanRequest instance from plain object
   * @param {object} data - Plain object data
   * @returns {LoanRequest} LoanRequest instance
   */
  static fromObject(data) {
    return new LoanRequest(data);
  }

  /**
   * Filter loan requests by status
   * @param {LoanRequest[]} loans - Array of loan requests
   * @param {string} status - Status to filter by
   * @returns {LoanRequest[]} Filtered loans
   */
  static filterByStatus(loans, status) {
    return loans.filter(loan => loan.status === status);
  }

  /**
   * Filter loan requests by farmer
   * @param {LoanRequest[]} loans - Array of loan requests
   * @param {string} farmerId - Farmer ID to filter by
   * @returns {LoanRequest[]} Filtered loans
   */
  static filterByFarmer(loans, farmerId) {
    return loans.filter(loan => loan.farmerId === farmerId);
  }

  /**
   * Sort loan requests by priority and date
   * @param {LoanRequest[]} loans - Array of loan requests
   * @returns {LoanRequest[]} Sorted loans
   */
  static sortByPriority(loans) {
    return loans.sort((a, b) => {
      const priorityDiff = b.getPriorityScore() - a.getPriorityScore();
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.requestDate) - new Date(a.requestDate);
    });
  }
}