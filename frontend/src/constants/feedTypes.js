// Predefined Feed Types - Immutable System Constants
// These feed types cannot be modified by any user role

export const PREDEFINED_FEEDS = Object.freeze([
  {
    id: 'cattle-feed',
    name: 'Cattle Feed',
    description: 'High-quality cattle feed for dairy cows',
    category: 'livestock'
  },
  {
    id: 'buffalo-feed',
    name: 'Buffalo Feed', 
    description: 'Specialized feed for buffaloes',
    category: 'livestock'
  },
  {
    id: 'mineral-mix',
    name: 'Mineral Mix',
    description: 'Essential minerals and vitamins',
    category: 'supplement'
  },
  {
    id: 'green-fodder',
    name: 'Green Fodder',
    description: 'Fresh green fodder for livestock',
    category: 'fodder'
  },
  {
    id: 'dry-fodder',
    name: 'Dry Fodder',
    description: 'Dried hay and straw',
    category: 'fodder'
  },
  {
    id: 'concentrate-feed',
    name: 'Concentrate Feed',
    description: 'High-energy concentrate feed',
    category: 'concentrate'
  }
]);

// Feed Type Validation
export const validateFeedType = (feedName) => {
  return PREDEFINED_FEEDS.some(feed => feed.name === feedName);
};

// Get Feed by Name
export const getFeedByName = (feedName) => {
  return PREDEFINED_FEEDS.find(feed => feed.name === feedName);
};

// Get Feed by ID
export const getFeedById = (feedId) => {
  return PREDEFINED_FEEDS.find(feed => feed.id === feedId);
};

// Urgency Levels for Feed Requests
export const URGENCY_LEVELS = Object.freeze({
  NORMAL: {
    value: 'Normal',
    label: 'Normal',
    color: 'blue',
    priority: 1
  },
  HIGH_PRIORITY: {
    value: 'High Priority',
    label: 'High Priority', 
    color: 'orange',
    priority: 2
  },
  URGENT: {
    value: 'Urgent',
    label: 'Urgent',
    color: 'red',
    priority: 3
  }
});

// Request Status Types
export const REQUEST_STATUS = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
});

// Payment Status Types
export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'Pending',
  PAID: 'Paid',
  OVERDUE: 'Overdue'
});

// Action Types for Stock History
export const STOCK_ACTION_TYPES = Object.freeze({
  STOCK_ADDED: 'STOCK_ADDED',
  FEED_APPROVED: 'FEED_APPROVED'
});