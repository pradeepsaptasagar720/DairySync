import { validateFeedType, URGENCY_LEVELS, REQUEST_STATUS, PAYMENT_STATUS } from '../constants/feedTypes';

/**
 * Feed Request Data Model
 * Represents a farmer's feed booking request
 */
export class FeedRequest {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.farmerId = data.farmerId || '';
    this.farmerName = data.farmerName || '';
    this.feedName = data.feedName || '';
    this.requestedQuantity = data.requestedQuantity || 0;
    this.pricePerKg = data.pricePerKg || 0;
    this.totalAmount = data.totalAmount || 0;
    this.urgencyLevel = data.urgencyLevel || URGENCY_LEVELS.NORMAL.value;
    this.notes = data.notes || '';
    this.requestDate = data.requestDate || new Date();
    this.status = data.status || REQUEST_STATUS.PENDING;
    this.paymentStatus = data.paymentStatus || PAYMENT_STATUS.PENDING;
    
    // Approval details (filled when approved)
    this.approvedBy = data.approvedBy || '';
    this.approvedByName = data.approvedByName || '';
    this.approvalDate = data.approvalDate || null;
    this.receiptId = data.receiptId || '';
    
    // Calculate total amount if not provided
    if (!this.totalAmount && this.requestedQuantity && this.pricePerKg) {
      this.totalAmount = this.requestedQuantity * this.pricePerKg;
    }
    
    this.validate();
  }

  /**
   * Generate unique ID for feed request
   */
  generateId() {
    return `feed_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate feed request data
   */
  validate() {
    const errors = [];

    // Validate farmer ID
    if (!this.farmerId) {
      errors.push('Farmer ID is required');
    }

    // Validate farmer name
    if (!this.farmerName) {
      errors.push('Farmer name is required');
    }

    // Validate feed name
    if (!this.feedName) {
      errors.push('Feed name is required');
    } else if (!validateFeedType(this.feedName)) {
      errors.push('Invalid feed name');
    }

    // Validate quantity
    if (this.requestedQuantity <= 0) {
      errors.push('Requested quantity must be positive');
    }

    // Validate price
    if (this.pricePerKg < 0) {
      errors.push('Price per kg cannot be negative');
    }

    // Validate urgency level
    const validUrgencyLevels = Object.values(URGENCY_LEVELS).map(level => level.value);
    if (!validUrgencyLevels.includes(this.urgencyLevel)) {
      errors.push(`Invalid urgency level. Must be one of: ${validUrgencyLevels.join(', ')}`);
    }

    // Validate status
    const validStatuses = Object.values(REQUEST_STATUS);
    if (!validStatuses.includes(this.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    if (errors.length > 0) {
      throw new Error(`FeedRequest validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Update total amount based on quantity and price
   */
  updateTotalAmount() {
    this.totalAmount = this.requestedQuantity * this.pricePerKg;
    return this.totalAmount;
  }

  /**
   * Approve the feed request
   * @param {string} employeeId - ID of approving employee
   * @param {string} employeeName - Name of approving employee
   * @param {string} receiptId - Generated receipt ID
   */
  approve(employeeId, employeeName, receiptId = '') {
    if (this.status !== REQUEST_STATUS.PENDING) {
      throw new Error('Only pending requests can be approved');
    }

    this.status = REQUEST_STATUS.APPROVED;
    this.approvedBy = employeeId;
    this.approvedByName = employeeName;
    this.approvalDate = new Date();
    this.receiptId = receiptId;

    return {
      requestId: this.id,
      approvedBy: employeeName,
      approvalDate: this.approvalDate,
      receiptId: this.receiptId
    };
  }

  /**
   * Reject the feed request
   * @param {string} employeeId - ID of rejecting employee
   * @param {string} employeeName - Name of rejecting employee
   * @param {string} reason - Reason for rejection
   */
  reject(employeeId, employeeName, reason = '') {
    if (this.status !== REQUEST_STATUS.PENDING) {
      throw new Error('Only pending requests can be rejected');
    }

    this.status = REQUEST_STATUS.REJECTED;
    this.approvedBy = employeeId;
    this.approvedByName = employeeName;
    this.approvalDate = new Date();
    this.rejectionReason = reason;

    return {
      requestId: this.id,
      rejectedBy: employeeName,
      rejectionDate: this.approvalDate,
      reason: this.rejectionReason
    };
  }

  /**
   * Get urgency level details
   * @returns {object} Urgency level information
   */
  getUrgencyDetails() {
    return Object.values(URGENCY_LEVELS).find(level => level.value === this.urgencyLevel) || URGENCY_LEVELS.NORMAL;
  }

  /**
   * Get priority score for sorting
   * @returns {number} Priority score (higher = more urgent)
   */
  getPriorityScore() {
    const urgencyDetails = this.getUrgencyDetails();
    const urgencyScore = urgencyDetails.priority * 100;
    
    // Add time-based priority (older requests get higher priority)
    const daysSinceRequest = (new Date() - new Date(this.requestDate)) / (1000 * 60 * 60 * 24);
    const timeScore = Math.floor(daysSinceRequest * 10);
    
    return urgencyScore + timeScore;
  }

  /**
   * Check if request is overdue (pending for more than specified days)
   * @param {number} days - Number of days to consider overdue
   * @returns {boolean} Whether request is overdue
   */
  isOverdue(days = 3) {
    if (this.status !== REQUEST_STATUS.PENDING) {
      return false;
    }

    const daysSinceRequest = (new Date() - new Date(this.requestDate)) / (1000 * 60 * 60 * 24);
    return daysSinceRequest > days;
  }

  /**
   * Get formatted request summary
   * @returns {string} Formatted summary
   */
  getSummary() {
    return `${this.farmerName} requested ${this.requestedQuantity}kg of ${this.feedName} (${this.urgencyLevel})`;
  }

  /**
   * Convert to plain object
   * @returns {object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      farmerId: this.farmerId,
      farmerName: this.farmerName,
      feedName: this.feedName,
      requestedQuantity: this.requestedQuantity,
      pricePerKg: this.pricePerKg,
      totalAmount: this.totalAmount,
      urgencyLevel: this.urgencyLevel,
      notes: this.notes,
      requestDate: this.requestDate,
      status: this.status,
      paymentStatus: this.paymentStatus,
      approvedBy: this.approvedBy,
      approvedByName: this.approvedByName,
      approvalDate: this.approvalDate,
      receiptId: this.receiptId,
      rejectionReason: this.rejectionReason
    };
  }

  /**
   * Create FeedRequest from plain object
   * @param {object} data - Plain object data
   * @returns {FeedRequest} FeedRequest instance
   */
  static fromObject(data) {
    return new FeedRequest(data);
  }

  /**
   * Create a new feed request
   * @param {object} requestData - Request data
   * @returns {FeedRequest} New FeedRequest instance
   */
  static createRequest(requestData) {
    return new FeedRequest({
      ...requestData,
      requestDate: new Date(),
      status: REQUEST_STATUS.PENDING,
      paymentStatus: PAYMENT_STATUS.PENDING
    });
  }
}

export default FeedRequest;