import eventBus from './EventBus';
import { EVENT_TYPES } from '../constants/eventTypes';
import { FeedStock } from '../models/FeedStock';
import { FeedRequest } from '../models/FeedRequest';
import { StockHistory } from '../models/StockHistory';
import { PREDEFINED_FEEDS, REQUEST_STATUS } from '../constants/feedTypes';

/**
 * Feed Service - Manages feed stock, requests, and approvals
 * Implements real-time synchronization and atomic transactions
 */
class FeedService {
  constructor() {
    this.feedStocks = new Map();
    this.feedRequests = new Map();
    this.stockHistory = [];
    this.isInitialized = false;
    
    // Initialize with predefined feeds
    this.initializeFeedStocks();
  }

  /**
   * Initialize feed stocks with predefined feed types
   */
  initializeFeedStocks() {
    try {
      // Load from localStorage if available
      const savedStocks = localStorage.getItem('feedStocks');
      if (savedStocks) {
        const stocksData = JSON.parse(savedStocks);
        stocksData.forEach(stockData => {
          const feedStock = FeedStock.fromObject(stockData);
          this.feedStocks.set(feedStock.feedName, feedStock);
        });
      } else {
        // Create initial stocks for predefined feeds
        const initialStocks = FeedStock.createInitialStocks();
        initialStocks.forEach(stock => {
          this.feedStocks.set(stock.feedName, stock);
        });
        this.saveFeedStocks();
      }

      // Load feed requests
      const savedRequests = localStorage.getItem('feedRequests');
      if (savedRequests) {
        const requestsData = JSON.parse(savedRequests);
        requestsData.forEach(requestData => {
          const feedRequest = FeedRequest.fromObject(requestData);
          this.feedRequests.set(feedRequest.id, feedRequest);
        });
      }

      // Load stock history
      const savedHistory = localStorage.getItem('stockHistory');
      if (savedHistory) {
        const historyData = JSON.parse(savedHistory);
        this.stockHistory = historyData.map(histData => StockHistory.fromObject(histData));
      }

      this.isInitialized = true;
      console.log('[FeedService] Initialized with', this.feedStocks.size, 'feed types');
      
      // Safely emit initialization complete event
      this.safeEmit(EVENT_TYPES.DATA_SYNC_COMPLETED, {
        service: 'FeedService',
        feedStocksCount: this.feedStocks.size,
        requestsCount: this.feedRequests.size,
        historyCount: this.stockHistory.length
      });
    } catch (error) {
      console.error('[FeedService] Initialization failed:', error);
      this.safeEmit(EVENT_TYPES.DATA_SYNC_ERROR, {
        service: 'FeedService',
        error: error.message
      });
    }
  }

  /**
   * Safely emit events, checking if eventType is valid
   * @private
   */
  safeEmit(eventType, data) {
    try {
      if (typeof eventType === 'string' && eventType.length > 0) {
        eventBus.emit(eventType, data);
      } else {
        console.warn('[FeedService] Invalid event type:', eventType, typeof eventType);
      }
    } catch (error) {
      console.error('[FeedService] Failed to emit event:', eventType, error);
    }
  }

  /**
   * Get all feed stocks
   * @returns {FeedStock[]} Array of feed stocks
   */
  getAllFeedStocks() {
    return Array.from(this.feedStocks.values());
  }

  /**
   * Get feed stock by name
   * @param {string} feedName - Feed name
   * @returns {FeedStock|null} Feed stock or null if not found
   */
  getFeedStock(feedName) {
    return this.feedStocks.get(feedName) || null;
  }

  /**
   * Update feed stock quantity and/or price
   * @param {string} feedName - Feed name
   * @param {object} updates - Updates to apply
   * @param {string} employeeId - Employee making the update
   * @param {string} employeeName - Employee name
   * @returns {Promise<object>} Update result
   */
  async updateFeedStock(feedName, updates, employeeId, employeeName) {
    try {
      this.safeEmit(EVENT_TYPES.DATA_SYNC_STARTED, { operation: 'updateFeedStock', feedName });

      const feedStock = this.feedStocks.get(feedName);
      if (!feedStock) {
        throw new Error(`Feed stock not found: ${feedName}`);
      }

      const previousStock = feedStock.availableQuantity;
      const previousPrice = feedStock.pricePerKg;
      let stockChanged = false;
      let priceChanged = false;

      // Update quantity if provided
      if (updates.quantity !== undefined) {
        const updateResult = feedStock.updateQuantity(updates.quantity, employeeName);
        stockChanged = true;

        // Create stock history record for quantity change
        if (updateResult.quantityChanged !== 0) {
          const historyRecord = StockHistory.createStockAddition({
            feedName,
            previousStock: updateResult.previousQuantity,
            quantityChanged: updateResult.quantityChanged,
            currentStock: updateResult.newQuantity,
            pricePerKg: feedStock.pricePerKg,
            employeeId,
            employeeName,
            notes: `Stock updated by ${employeeName}`
          });

          this.stockHistory.push(historyRecord);
          this.saveStockHistory();

          // Emit stock history event
          this.safeEmit(EVENT_TYPES.STOCK_HISTORY_ADDED, {
            historyRecord: historyRecord.toObject(),
            feedName,
            actionType: 'STOCK_ADDED'
          });
        }
      }

      // Update purchased rate if provided
      if (updates.purchasedRate !== undefined) {
        feedStock.updatePurchasedRate(updates.purchasedRate, employeeName);
        priceChanged = true;
      }

      // Update selling price if provided
      if (updates.price !== undefined) {
        feedStock.updatePrice(updates.price, employeeName);
        priceChanged = true;
      }

      // Mark as synced and save
      feedStock.markAsSynced();
      this.saveFeedStocks();

      const result = {
        success: true,
        feedName,
        previousStock,
        currentStock: feedStock.availableQuantity,
        previousPrice,
        currentPrice: feedStock.pricePerKg,
        stockChanged,
        priceChanged,
        updatedBy: employeeName,
        timestamp: new Date()
      };

      // Emit real-time update events
      if (stockChanged) {
        this.safeEmit(EVENT_TYPES.FEED_STOCK_UPDATED, {
          feedStock: feedStock.toObject(),
          changes: { quantity: true },
          updatedBy: employeeName
        });
      }

      if (priceChanged) {
        this.safeEmit(EVENT_TYPES.FEED_STOCK_PRICE_CHANGED, {
          feedStock: feedStock.toObject(),
          changes: { price: true },
          updatedBy: employeeName
        });
      }

      this.safeEmit(EVENT_TYPES.DATA_SYNC_COMPLETED, { operation: 'updateFeedStock', result });

      return result;
    } catch (error) {
      console.error('[FeedService] Update feed stock failed:', error);
      this.safeEmit(EVENT_TYPES.DATA_SYNC_ERROR, {
        operation: 'updateFeedStock',
        feedName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get real-time stock availability for farmers
   * @returns {object[]} Array of stock availability data
   */
  getStockAvailability() {
    return this.getAllFeedStocks().map(stock => ({
      feedName: stock.feedName,
      description: stock.description,
      availableQuantity: stock.availableQuantity,
      pricePerKg: stock.pricePerKg,
      stockStatus: stock.getStockStatus(),
      isAvailable: stock.availableQuantity > 0,
      lastUpdated: stock.lastUpdated
    }));
  }

  /**
   * Validate quantity request against available stock
   * @param {string} feedName - Feed name
   * @param {number} requestedQuantity - Requested quantity
   * @returns {object} Validation result
   */
  validateQuantityRequest(feedName, requestedQuantity) {
    const feedStock = this.feedStocks.get(feedName);
    
    if (!feedStock) {
      return {
        isValid: false,
        error: `Feed not found: ${feedName}`,
        availableQuantity: 0
      };
    }

    const isValid = feedStock.isStockAvailable(requestedQuantity);
    
    return {
      isValid,
      error: isValid ? null : `Requested quantity (${requestedQuantity}kg) exceeds available stock (${feedStock.availableQuantity}kg)`,
      availableQuantity: feedStock.availableQuantity,
      requestedQuantity,
      feedName
    };
  }

  /**
   * Create a new feed request
   * @param {object} requestData - Feed request data
   * @returns {Promise<FeedRequest>} Created feed request
   */
  async createFeedRequest(requestData) {
    try {
      this.safeEmit(EVENT_TYPES.DATA_SYNC_STARTED, { operation: 'createFeedRequest' });

      // Validate quantity against current stock
      const validation = this.validateQuantityRequest(requestData.feedName, requestData.requestedQuantity);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get current price
      const feedStock = this.feedStocks.get(requestData.feedName);
      const currentPrice = feedStock.pricePerKg;

      // Create feed request
      const feedRequest = FeedRequest.createRequest({
        ...requestData,
        pricePerKg: currentPrice,
        totalAmount: requestData.requestedQuantity * currentPrice
      });

      // Store request
      this.feedRequests.set(feedRequest.id, feedRequest);
      this.saveFeedRequests();

      // Emit request created event
      this.safeEmit(EVENT_TYPES.FEED_REQUEST_CREATED, {
        feedRequest: feedRequest.toObject(),
        farmerId: feedRequest.farmerId,
        feedName: feedRequest.feedName
      });

      this.safeEmit(EVENT_TYPES.DATA_SYNC_COMPLETED, { 
        operation: 'createFeedRequest',
        requestId: feedRequest.id 
      });

      return feedRequest;
    } catch (error) {
      console.error('[FeedService] Create feed request failed:', error);
      this.safeEmit(EVENT_TYPES.DATA_SYNC_ERROR, {
        operation: 'createFeedRequest',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Approve a feed request with automatic stock reduction
   * @param {string} requestId - Request ID
   * @param {string} employeeId - Approving employee ID
   * @param {string} employeeName - Approving employee name
   * @returns {Promise<object>} Approval result
   */
  async approveFeedRequest(requestId, employeeId, employeeName) {
    try {
      this.safeEmit(EVENT_TYPES.DATA_SYNC_STARTED, { operation: 'approveFeedRequest', requestId });

      const feedRequest = this.feedRequests.get(requestId);
      if (!feedRequest) {
        throw new Error(`Feed request not found: ${requestId}`);
      }

      if (feedRequest.status !== REQUEST_STATUS.PENDING) {
        throw new Error(`Request is not pending: ${feedRequest.status}`);
      }

      // Validate current stock availability
      const validation = this.validateQuantityRequest(feedRequest.feedName, feedRequest.requestedQuantity);
      if (!validation.isValid) {
        throw new Error(`Insufficient stock for approval: ${validation.error}`);
      }

      // Get feed stock
      const feedStock = this.feedStocks.get(feedRequest.feedName);
      
      // Reduce stock atomically
      const stockReduction = feedStock.reduceStock(
        feedRequest.requestedQuantity,
        `Feed approved for ${feedRequest.farmerName}`
      );

      // Generate receipt ID
      const receiptId = this.generateReceiptId();

      // Approve the request
      const approvalResult = feedRequest.approve(employeeId, employeeName, receiptId);

      // Create stock history record for approval
      const historyRecord = StockHistory.createFeedApproval({
        feedName: feedRequest.feedName,
        previousStock: stockReduction.previousQuantity,
        quantityChanged: -feedRequest.requestedQuantity, // Negative for reduction
        currentStock: stockReduction.remainingQuantity,
        pricePerKg: feedRequest.pricePerKg,
        employeeId,
        employeeName,
        farmerId: feedRequest.farmerId,
        farmerName: feedRequest.farmerName,
        requestId: feedRequest.id,
        notes: `Feed approved: ${feedRequest.requestedQuantity}kg for ${feedRequest.farmerName}`
      });

      this.stockHistory.push(historyRecord);

      // Mark stock as synced and save all data
      feedStock.markAsSynced();
      this.saveFeedStocks();
      this.saveFeedRequests();
      this.saveStockHistory();

      const result = {
        success: true,
        requestId: feedRequest.id,
        feedName: feedRequest.feedName,
        farmerName: feedRequest.farmerName,
        approvedQuantity: feedRequest.requestedQuantity,
        previousStock: stockReduction.previousQuantity,
        remainingStock: stockReduction.remainingQuantity,
        totalAmount: feedRequest.totalAmount,
        receiptId,
        approvedBy: employeeName,
        approvalDate: feedRequest.approvalDate
      };

      // Emit real-time events
      this.safeEmit(EVENT_TYPES.FEED_REQUEST_APPROVED, {
        feedRequest: feedRequest.toObject(),
        stockReduction: stockReduction,
        approvalResult: result
      });

      this.safeEmit(EVENT_TYPES.FEED_STOCK_UPDATED, {
        feedStock: feedStock.toObject(),
        changes: { quantity: true },
        reason: 'feed_approval',
        updatedBy: employeeName
      });

      this.safeEmit(EVENT_TYPES.STOCK_HISTORY_ADDED, {
        historyRecord: historyRecord.toObject(),
        feedName: feedRequest.feedName,
        actionType: 'FEED_APPROVED'
      });

      this.safeEmit(EVENT_TYPES.RECEIPT_GENERATED, {
        receiptId,
        feedRequest: feedRequest.toObject(),
        farmerId: feedRequest.farmerId
      });

      this.safeEmit(EVENT_TYPES.DATA_SYNC_COMPLETED, { 
        operation: 'approveFeedRequest',
        result 
      });

      return result;
    } catch (error) {
      console.error('[FeedService] Approve feed request failed:', error);
      this.safeEmit(EVENT_TYPES.DATA_SYNC_ERROR, {
        operation: 'approveFeedRequest',
        requestId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all feed requests
   * @param {object} filters - Optional filters
   * @returns {FeedRequest[]} Array of feed requests
   */
  getFeedRequests(filters = {}) {
    let requests = Array.from(this.feedRequests.values());

    // Apply filters
    if (filters.status) {
      requests = requests.filter(req => req.status === filters.status);
    }

    if (filters.farmerId) {
      requests = requests.filter(req => req.farmerId === filters.farmerId);
    }

    if (filters.feedName) {
      requests = requests.filter(req => req.feedName === filters.feedName);
    }

    // Sort by priority (urgent first, then by date)
    requests.sort((a, b) => {
      const priorityDiff = b.getPriorityScore() - a.getPriorityScore();
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.requestDate) - new Date(a.requestDate);
    });

    return requests;
  }

  /**
   * Get stock history
   * @param {object} filters - Optional filters
   * @returns {StockHistory[]} Array of stock history records
   */
  getStockHistory(filters = {}) {
    let history = [...this.stockHistory];

    // Apply filters
    if (filters.feedName) {
      history = StockHistory.filterByFeedName(history, filters.feedName);
    }

    if (filters.startDate && filters.endDate) {
      history = StockHistory.filterByDateRange(history, filters.startDate, filters.endDate);
    }

    // Sort by timestamp (newest first)
    return StockHistory.sortByTimestamp(history);
  }

  /**
   * Generate unique receipt ID
   * @returns {string} Receipt ID
   */
  generateReceiptId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RCP-${timestamp}-${random}`;
  }

  /**
   * Save feed stocks to localStorage
   */
  saveFeedStocks() {
    try {
      const stocksData = this.getAllFeedStocks().map(stock => stock.toObject());
      localStorage.setItem('feedStocks', JSON.stringify(stocksData));
    } catch (error) {
      console.error('[FeedService] Failed to save feed stocks:', error);
    }
  }

  /**
   * Save feed requests to localStorage
   */
  saveFeedRequests() {
    try {
      const requestsData = Array.from(this.feedRequests.values()).map(req => req.toObject());
      localStorage.setItem('feedRequests', JSON.stringify(requestsData));
    } catch (error) {
      console.error('[FeedService] Failed to save feed requests:', error);
    }
  }

  /**
   * Save stock history to localStorage
   */
  saveStockHistory() {
    try {
      const historyData = this.stockHistory.map(hist => hist.toObject());
      localStorage.setItem('stockHistory', JSON.stringify(historyData));
    } catch (error) {
      console.error('[FeedService] Failed to save stock history:', error);
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  clearAllData() {
    this.feedStocks.clear();
    this.feedRequests.clear();
    this.stockHistory = [];
    
    localStorage.removeItem('feedStocks');
    localStorage.removeItem('feedRequests');
    localStorage.removeItem('stockHistory');
    
    this.initializeFeedStocks();
    
    this.safeEmit(EVENT_TYPES.DASHBOARD_REFRESH, { reason: 'data_cleared' });
  }

  /**
   * Reset feed stocks to empty state (remove all quantities and prices)
   */
  resetFeedStocksToEmpty() {
    // Clear localStorage first
    localStorage.removeItem('feedStocks');
    localStorage.removeItem('feedRequests');
    localStorage.removeItem('stockHistory');
    
    // Clear current data
    this.feedStocks.clear();
    this.feedRequests.clear();
    this.stockHistory = [];
    
    // Reinitialize with empty stocks
    const initialStocks = FeedStock.createInitialStocks();
    initialStocks.forEach(stock => {
      this.feedStocks.set(stock.feedName, stock);
    });
    
    // Save empty state
    this.saveFeedStocks();
    this.saveFeedRequests();
    this.saveStockHistory();
    
    console.log('[FeedService] Reset to empty state - all quantities and prices set to 0');
    
    this.safeEmit(EVENT_TYPES.DASHBOARD_REFRESH, { reason: 'reset_to_empty' });
    this.safeEmit(EVENT_TYPES.DATA_SYNC_COMPLETED, { 
      operation: 'resetFeedStocksToEmpty',
      feedStocksCount: this.feedStocks.size 
    });
  }
}

// Create singleton instance
const feedService = new FeedService();

export default feedService;