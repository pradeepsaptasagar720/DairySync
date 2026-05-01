import { validateFeedType, STOCK_ACTION_TYPES } from '../constants/feedTypes';

/**
 * Stock History Data Model
 * Represents immutable audit trail of all stock changes
 */
export class StockHistory {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.feedName = data.feedName || '';
    this.actionType = data.actionType || '';
    this.previousStock = data.previousStock || 0;
    this.quantityChanged = data.quantityChanged || 0;
    this.currentStock = data.currentStock || 0;
    this.pricePerKg = data.pricePerKg || 0;
    
    // Action-specific details
    this.employeeId = data.employeeId || '';
    this.employeeName = data.employeeName || '';
    this.farmerId = data.farmerId || '';
    this.farmerName = data.farmerName || '';
    this.requestId = data.requestId || '';
    
    this.timestamp = data.timestamp || new Date();
    this.formula = data.formula || '';
    this.isImmutable = true; // Always true - prevents editing
    this.notes = data.notes || '';
    
    // Generate formula if not provided
    if (!this.formula) {
      this.generateFormula();
    }
    
    this.validate();
  }

  /**
   * Generate unique ID for stock history record
   */
  generateId() {
    return `stock_hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate stock history data
   */
  validate() {
    const errors = [];

    // Validate feed name
    if (!this.feedName) {
      errors.push('Feed name is required');
    } else if (!validateFeedType(this.feedName)) {
      errors.push('Invalid feed name');
    }

    // Validate action type
    const validActionTypes = Object.values(STOCK_ACTION_TYPES);
    if (!validActionTypes.includes(this.actionType)) {
      errors.push(`Invalid action type. Must be one of: ${validActionTypes.join(', ')}`);
    }

    // Validate stock values
    if (this.previousStock < 0 || this.currentStock < 0) {
      errors.push('Stock quantities cannot be negative');
    }

    // Validate price
    if (this.pricePerKg < 0) {
      errors.push('Price per kg cannot be negative');
    }

    // Validate action-specific requirements
    if (this.actionType === STOCK_ACTION_TYPES.STOCK_ADDED) {
      if (!this.employeeId || !this.employeeName) {
        errors.push('Employee information is required for STOCK_ADDED actions');
      }
      if (this.quantityChanged <= 0) {
        errors.push('Quantity changed must be positive for STOCK_ADDED actions');
      }
    }

    if (this.actionType === STOCK_ACTION_TYPES.FEED_APPROVED) {
      if (!this.farmerId || !this.farmerName) {
        errors.push('Farmer information is required for FEED_APPROVED actions');
      }
      if (!this.requestId) {
        errors.push('Request ID is required for FEED_APPROVED actions');
      }
      if (this.quantityChanged >= 0) {
        errors.push('Quantity changed must be negative for FEED_APPROVED actions');
      }
    }

    if (errors.length > 0) {
      throw new Error(`StockHistory validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Generate calculation formula for audit trail
   */
  generateFormula() {
    if (this.actionType === STOCK_ACTION_TYPES.STOCK_ADDED) {
      this.formula = `Previous Stock (${this.previousStock}) + Added Stock (${this.quantityChanged}) = Current Stock (${this.currentStock})`;
    } else if (this.actionType === STOCK_ACTION_TYPES.FEED_APPROVED) {
      const reducedQuantity = Math.abs(this.quantityChanged);
      this.formula = `Previous Stock (${this.previousStock}) - Approved Quantity (${reducedQuantity}) = Remaining Stock (${this.currentStock})`;
    }
  }

  /**
   * Get formatted action description
   * @returns {string} Human-readable action description
   */
  getActionDescription() {
    if (this.actionType === STOCK_ACTION_TYPES.STOCK_ADDED) {
      return `${this.employeeName} added ${this.quantityChanged}kg of ${this.feedName}`;
    } else if (this.actionType === STOCK_ACTION_TYPES.FEED_APPROVED) {
      const reducedQuantity = Math.abs(this.quantityChanged);
      return `${this.employeeName} approved ${reducedQuantity}kg of ${this.feedName} for ${this.farmerName}`;
    }
    return 'Unknown action';
  }

  /**
   * Get formatted timestamp
   * @returns {string} Formatted date and time
   */
  getFormattedTimestamp() {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(this.timestamp));
  }

  /**
   * Get total amount for feed approval actions
   * @returns {number} Total amount
   */
  getTotalAmount() {
    if (this.actionType === STOCK_ACTION_TYPES.FEED_APPROVED) {
      const quantity = Math.abs(this.quantityChanged);
      return quantity * this.pricePerKg;
    }
    return 0;
  }

  /**
   * Check if this is a recent change (within specified hours)
   * @param {number} hours - Number of hours to consider recent
   * @returns {boolean} Whether change is recent
   */
  isRecent(hours = 24) {
    const hoursAgo = (new Date() - new Date(this.timestamp)) / (1000 * 60 * 60);
    return hoursAgo <= hours;
  }

  /**
   * Convert to plain object
   * @returns {object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      feedName: this.feedName,
      actionType: this.actionType,
      previousStock: this.previousStock,
      quantityChanged: this.quantityChanged,
      currentStock: this.currentStock,
      pricePerKg: this.pricePerKg,
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      farmerId: this.farmerId,
      farmerName: this.farmerName,
      requestId: this.requestId,
      timestamp: this.timestamp,
      formula: this.formula,
      isImmutable: this.isImmutable,
      notes: this.notes
    };
  }

  /**
   * Create StockHistory from plain object
   * @param {object} data - Plain object data
   * @returns {StockHistory} StockHistory instance
   */
  static fromObject(data) {
    return new StockHistory(data);
  }

  /**
   * Create stock addition history record
   * @param {object} data - Stock addition data
   * @returns {StockHistory} New StockHistory instance
   */
  static createStockAddition(data) {
    return new StockHistory({
      ...data,
      actionType: STOCK_ACTION_TYPES.STOCK_ADDED,
      timestamp: new Date()
    });
  }

  /**
   * Create feed approval history record
   * @param {object} data - Feed approval data
   * @returns {StockHistory} New StockHistory instance
   */
  static createFeedApproval(data) {
    return new StockHistory({
      ...data,
      actionType: STOCK_ACTION_TYPES.FEED_APPROVED,
      quantityChanged: -Math.abs(data.quantityChanged), // Ensure negative for reduction
      timestamp: new Date()
    });
  }

  /**
   * Get history records filtered by feed name
   * @param {StockHistory[]} historyRecords - Array of history records
   * @param {string} feedName - Feed name to filter by
   * @returns {StockHistory[]} Filtered history records
   */
  static filterByFeedName(historyRecords, feedName) {
    return historyRecords.filter(record => record.feedName === feedName);
  }

  /**
   * Get history records filtered by date range
   * @param {StockHistory[]} historyRecords - Array of history records
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {StockHistory[]} Filtered history records
   */
  static filterByDateRange(historyRecords, startDate, endDate) {
    return historyRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= startDate && recordDate <= endDate;
    });
  }

  /**
   * Sort history records by timestamp (newest first)
   * @param {StockHistory[]} historyRecords - Array of history records
   * @returns {StockHistory[]} Sorted history records
   */
  static sortByTimestamp(historyRecords) {
    return [...historyRecords].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export default StockHistory;