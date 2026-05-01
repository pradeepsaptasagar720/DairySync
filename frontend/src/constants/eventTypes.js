export const EVENT_TYPES = {
  // Loan events
  LOAN_REQUEST_CREATED: 'loan_request_created',
  LOAN_REQUEST_APPROVED: 'loan_request_approved',
  LOAN_REQUEST_REJECTED: 'loan_request_rejected',
  LOAN_PAYMENT_ADDED: 'loan_payment_added',
  LOAN_CLEARED: 'loan_cleared',
  LOAN_CLOSED: 'loan_closed',

  // Feed events
  FEED_REQUEST_CREATED: 'feed_request_created',
  FEED_REQUEST_APPROVED: 'feed_request_approved',
  FEED_REQUEST_DELIVERED: 'feed_request_delivered',
  FEED_STOCK_UPDATED: 'feed_stock_updated',
  FEED_STOCK_PRICE_CHANGED: 'feed_stock_price_changed',

  // Data synchronization events
  DATA_SYNC_STARTED: 'data_sync_started',
  DATA_SYNC_COMPLETED: 'data_sync_completed',
  DATA_SYNC_ERROR: 'data_sync_error',

  // Stock history events
  STOCK_HISTORY_ADDED: 'stock_history_added',

  // Receipt events
  RECEIPT_GENERATED: 'receipt_generated',

  // Dashboard events
  DASHBOARD_REFRESH: 'dashboard_refresh',

  // System events
  SYSTEM_ERROR: 'system_error',

  // General events
  USER_UPDATED: 'user_updated',
  NOTIFICATION_RECEIVED: 'notification_received'
};