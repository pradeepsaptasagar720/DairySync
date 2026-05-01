import { PREDEFINED_FEEDS, validateFeedType } from '../constants/feedTypes';

/**
 * Feed Stock Data Model
 * Represents feed inventory with predefined feed types
 */
export class FeedStock {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.feedName = data.feedName || '';
    this.description = data.description || '';
    this.availableQuantity = data.availableQuantity || 0;
    this.purchasedRate = data.purchasedRate || 0; // Rate at which feed was purchased
    this.pricePerKg = data.pricePerKg || 0; // Selling price to farmers
    this.lastUpdated = data.lastUpdated || new Date();
    this.lastUpdatedBy = data.lastUpdatedBy || '';
    this.version = data.version || 1;
    this.syncStatus = data.syncStatus || 'synced'; // 'synced' | 'pending' | 'error'
    
    // Validate feed name against predefined types
    this.validate();
  }

  /**
   * Generate unique ID for feed stock
   */
  generateId() {
    return `feed_stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate feed stock data
   */
  validate() {
    const errors = [];

    // Validate feed name
    if (!this.feedName) {
      errors.push('Feed name is required');
    } else if (!validateFeedType(this.feedName)) {
      errors.push(`Invalid feed name. Must be one of: ${PREDEFINED_FEEDS.map(f => f.name).join(', ')}`);
    }

    // Validate quantity
    if (this.availableQuantity < 0) {
      errors.push('Available quantity cannot be negative');
    }

    // Validate price
    if (this.pricePerKg < 0) {
      errors.push('Selling price per kg cannot be negative');
    }

    // Validate purchased rate
    if (this.purchasedRate < 0) {
      errors.push('Purchased rate per kg cannot be negative');
    }

    if (errors.length > 0) {
      throw new Error(`FeedStock validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Update stock quantity
   * @param {number} newQuantity - New quantity value
   * @param {string} updatedBy - Employee who made the update
   */
  updateQuantity(newQuantity, updatedBy) {
    if (newQuantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    const previousQuantity = this.availableQuantity;
    this.availableQuantity = newQuantity;
    this.lastUpdated = new Date();
    this.lastUpdatedBy = updatedBy;
    this.version += 1;
    this.syncStatus = 'pending';

    return {
      previousQuantity,
      newQuantity,
      quantityChanged: newQuantity - previousQuantity
    };
  }

  /**
   * Update purchased rate per kg
   * @param {number} newRate - New purchased rate value
   * @param {string} updatedBy - Employee who made the update
   */
  updatePurchasedRate(newRate, updatedBy) {
    if (newRate < 0) {
      throw new Error('Purchased rate cannot be negative');
    }

    const previousRate = this.purchasedRate;
    this.purchasedRate = newRate;
    this.lastUpdated = new Date();
    this.lastUpdatedBy = updatedBy;
    this.version += 1;
    this.syncStatus = 'pending';

    return {
      previousRate,
      newRate,
      rateChanged: newRate - previousRate
    };
  }

  /**
   * Update price per kg (selling price)
   * @param {number} newPrice - New price value
   * @param {string} updatedBy - Employee who made the update
   */
  updatePrice(newPrice, updatedBy) {
    if (newPrice < 0) {
      throw new Error('Selling price cannot be negative');
    }

    const previousPrice = this.pricePerKg;
    this.pricePerKg = newPrice;
    this.lastUpdated = new Date();
    this.lastUpdatedBy = updatedBy;
    this.version += 1;
    this.syncStatus = 'pending';

    return {
      previousPrice,
      newPrice,
      priceChanged: newPrice - previousPrice
    };
  }

  /**
   * Reduce stock quantity (for feed approvals)
   * @param {number} quantity - Quantity to reduce
   * @param {string} reason - Reason for reduction
   */
  reduceStock(quantity, reason = 'Feed approved') {
    if (quantity <= 0) {
      throw new Error('Reduction quantity must be positive');
    }

    if (quantity > this.availableQuantity) {
      throw new Error(`Insufficient stock. Available: ${this.availableQuantity}, Requested: ${quantity}`);
    }

    const previousQuantity = this.availableQuantity;
    this.availableQuantity -= quantity;
    this.lastUpdated = new Date();
    this.version += 1;
    this.syncStatus = 'pending';

    return {
      previousQuantity,
      reducedQuantity: quantity,
      remainingQuantity: this.availableQuantity,
      reason
    };
  }

  /**
   * Check if stock is available for a given quantity
   * @param {number} requestedQuantity - Quantity to check
   * @returns {boolean} Whether stock is available
   */
  isStockAvailable(requestedQuantity) {
    return this.availableQuantity >= requestedQuantity;
  }

  /**
   * Get stock status
   * @returns {string} Stock status
   */
  getStockStatus() {
    if (this.availableQuantity === 0) {
      return 'out_of_stock';
    } else if (this.availableQuantity < 200) {
      return 'low_stock';
    } else {
      return 'in_stock';
    }
  }

  /**
   * Mark as synced
   */
  markAsSynced() {
    this.syncStatus = 'synced';
  }

  /**
   * Mark as sync error
   * @param {string} error - Error message
   */
  markAsSyncError(error) {
    this.syncStatus = 'error';
    this.syncError = error;
  }

  /**
   * Convert to plain object
   * @returns {object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      feedName: this.feedName,
      description: this.description,
      availableQuantity: this.availableQuantity,
      purchasedRate: this.purchasedRate,
      pricePerKg: this.pricePerKg,
      lastUpdated: this.lastUpdated,
      lastUpdatedBy: this.lastUpdatedBy,
      version: this.version,
      syncStatus: this.syncStatus,
      syncError: this.syncError
    };
  }

  /**
   * Create FeedStock from plain object
   * @param {object} data - Plain object data
   * @returns {FeedStock} FeedStock instance
   */
  static fromObject(data) {
    return new FeedStock(data);
  }

  /**
   * Create initial feed stocks for all predefined feeds
   * @returns {FeedStock[]} Array of FeedStock instances
   */
  static createInitialStocks() {
    return PREDEFINED_FEEDS.map(feed => new FeedStock({
      feedName: feed.name,
      description: feed.description,
      availableQuantity: 0,
      purchasedRate: 0,
      pricePerKg: 0,
      lastUpdatedBy: 'system',
      syncStatus: 'synced'
    }));
  }
}

export default FeedStock;