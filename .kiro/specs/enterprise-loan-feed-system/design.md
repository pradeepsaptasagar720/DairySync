# Enterprise Loan & Feed Management System Design

## Architecture Overview

The Enterprise Loan & Feed Management System follows a modular, event-driven architecture with strict role separation and real-time data synchronization. The system is built from scratch with no legacy dependencies.

### Core Principles

1. **Single Source of Truth**: Centralized data management with atomic transactions
2. **Real-Time Synchronization**: Event-driven updates across all components
3. **Role-Based Access Control**: Strict separation between Farmer, Employee, and Dashboard roles
4. **Immutable Audit Trails**: Complete history tracking for compliance
5. **Predefined Data Integrity**: Fixed feed types with validation enforcement

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Enterprise Feed & Loan System                │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Layer                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Farmer Pages  │ │ Employee Pages  │ │ Dashboard Pages │   │
│  │                 │ │                 │ │                 │   │
│  │ • BookFeed      │ │ • FeedStock     │ │ • Analytics     │   │
│  │ • RequestLoan   │ │ • FeedApproval  │ │ • Metrics       │   │
│  │ • ViewReceipts  │ │ • LoanApproval  │ │ • Reports       │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Real-Time Event Layer                                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Event Bus: Stock Updates, Approvals, History Changes       │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer                                                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Feed Service    │ │ Loan Service    │ │ History Service │   │
│  │ • Stock Mgmt    │ │ • Request Mgmt  │ │ • Audit Trails  │   │
│  │ • Validation    │ │ • Approval Flow │ │ • Immutable Log │   │
│  │ • Real-time Sync│ │ • Receipt Gen   │ │ • Compliance    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Centralized State Management with Atomic Transactions      │ │
│  │ • Feed Stock Data  • Loan Data  • History Data             │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Models

### Feed Stock Model

```javascript
const FeedStock = {
  id: String,                    // Unique identifier
  feedName: String,              // Predefined feed name (read-only)
  description: String,           // Feed description (read-only)
  availableQuantity: Number,     // Current stock quantity (kg)
  pricePerKg: Number,           // Current price per kg
  lastUpdated: Date,            // Last modification timestamp
  lastUpdatedBy: String,        // Employee who last updated
  version: Number,              // Optimistic locking version
  syncStatus: String,           // 'synced' | 'pending' | 'error'
  
  // Predefined feed types (system constants)
  PREDEFINED_FEEDS: [
    { name: "Cattle Feed", description: "High-quality cattle feed for dairy cows" },
    { name: "Buffalo Feed", description: "Specialized feed for buffaloes" },
    { name: "Mineral Mix", description: "Essential minerals and vitamins" },
    { name: "Green Fodder", description: "Fresh green fodder for livestock" },
    { name: "Dry Fodder", description: "Dried hay and straw" },
    { name: "Concentrate Feed", description: "High-energy concentrate feed" }
  ]
};
```

### Feed Request Model

```javascript
const FeedRequest = {
  id: String,                    // Unique request identifier
  farmerId: String,              // Requesting farmer ID
  farmerName: String,            // Farmer name for display
  feedName: String,              // Selected predefined feed
  requestedQuantity: Number,     // Quantity in kg
  pricePerKg: Number,           // Price at time of request
  totalAmount: Number,          // Calculated total cost
  urgencyLevel: String,         // 'Normal' | 'High Priority' | 'Urgent'
  notes: String,                // Optional farmer notes
  requestDate: Date,            // Request timestamp
  status: String,               // 'Pending' | 'Approved' | 'Rejected'
  paymentStatus: String,        // 'Pending' | 'Paid' | 'Overdue'
  
  // Approval details (filled when approved)
  approvedBy: String,           // Employee ID who approved
  approvedByName: String,       // Employee name
  approvalDate: Date,           // Approval timestamp
  receiptId: String,            // Generated receipt ID
};
```

### Stock History Model

```javascript
const StockHistory = {
  id: String,                    // Unique history record ID
  feedName: String,              // Feed name
  actionType: String,            // 'STOCK_ADDED' | 'FEED_APPROVED'
  previousStock: Number,         // Stock before change
  quantityChanged: Number,       // Amount added or reduced
  currentStock: Number,          // Stock after change
  pricePerKg: Number,           // Price at time of change
  
  // Action-specific details
  employeeId: String,           // For STOCK_ADDED actions
  employeeName: String,         // Employee who made change
  farmerId: String,             // For FEED_APPROVED actions (optional)
  farmerName: String,           // Farmer name (optional)
  requestId: String,            // Related request ID (optional)
  
  timestamp: Date,              // When change occurred
  formula: String,              // Calculation formula for audit
  isImmutable: Boolean,         // Always true - prevents editing
};
```

### Loan Request Model

```javascript
const LoanRequest = {
  id: String,                    // Unique loan request ID
  farmerId: String,              // Requesting farmer ID
  farmerName: String,            // Farmer name
  requestedAmount: Number,       // Loan amount requested
  purpose: String,              // Loan purpose description
  requestDate: Date,            // Request timestamp
  status: String,               // 'Pending' | 'Approved' | 'Rejected'
  
  // Approval details
  approvedBy: String,           // Employee ID who approved
  approvedByName: String,       // Employee name
  approvedAmount: Number,       // Approved amount (may differ from requested)
  approvalDate: Date,           // Approval timestamp
  
  // Repayment tracking
  totalRepaid: Number,          // Amount repaid so far
  pendingAmount: Number,        // Remaining balance
  repaymentHistory: Array,      // Array of repayment records
};
```

### Receipt Model

```javascript
const Receipt = {
  id: String,                    // Unique receipt ID
  receiptNumber: String,         // Human-readable receipt number
  farmerId: String,              // Farmer ID
  farmerName: String,            // Farmer name
  feedRequestId: String,         // Related feed request
  
  // Feed details
  feedName: String,              // Feed purchased
  quantity: Number,              // Quantity approved
  pricePerKg: Number,           // Price per kg
  totalAmount: Number,          // Total cost
  urgencyLevel: String,         // Request urgency
  
  // Receipt metadata
  generatedDate: Date,          // Receipt generation timestamp
  approvedBy: String,           // Approving employee
  approvedByName: String,       // Employee name
  pdfUrl: String,               // Generated PDF URL (optional)
};
```

## Component Architecture

### Farmer Components

#### 1. BookFeed Component

**Purpose**: Allow farmers to book feed with real-time validation and confirmation flow

**Key Features**:
- Real-time stock availability dashboard
- Predefined feed selection dropdown
- Quantity validation with popup blocking
- Urgency level selection with visual indicators
- Booking confirmation flow
- Feed analytics dashboard

**State Management**:
```javascript
const BookFeedState = {
  availableFeeds: Array,         // Real-time stock data
  selectedFeed: Object,          // Currently selected feed
  quantity: Number,              // Entered quantity
  urgencyLevel: String,          // Selected urgency
  notes: String,                // Optional notes
  validationError: String,       // Validation messages
  isConfirming: Boolean,         // Confirmation modal state
  isSubmitting: Boolean,         // Submission state
};
```

#### 2. RequestLoan Component

**Purpose**: Allow farmers to request loans with proper validation

**Key Features**:
- Loan amount input with validation
- Purpose description field
- Request history display
- Pending loan status tracking

### Employee Components

#### 1. FeedStockManagement Component

**Purpose**: Manage feed stock quantities and prices with real-time updates

**Key Features**:
- Predefined feed list (read-only names)
- Quantity and price editing
- Real-time stock updates
- Stock history tracking modal
- Cross-component synchronization

**State Management**:
```javascript
const FeedStockState = {
  feedStocks: Array,             // Current stock data
  editingFeed: Object,           // Feed being edited
  stockHistory: Array,           // Historical changes
  isUpdating: Boolean,           // Update in progress
  syncStatus: String,            // Synchronization status
};
```

#### 2. FeedApprovalManagement Component

**Purpose**: Review and approve feed requests with automatic stock reduction

**Key Features**:
- Pending requests list with urgency indicators
- Request details modal
- Approval/rejection workflow
- Automatic stock reduction
- Receipt generation trigger

**State Management**:
```javascript
const FeedApprovalState = {
  pendingRequests: Array,        // Requests awaiting approval
  selectedRequest: Object,       // Request being reviewed
  isApproving: Boolean,          // Approval in progress
  stockValidation: Object,       // Stock availability check
};
```

#### 3. LoanApprovalManagement Component

**Purpose**: Review and approve loan requests

**Key Features**:
- Pending loan requests list
- Loan details review
- Approval workflow with amount modification
- Repayment tracking setup

### Dashboard Components

#### 1. FeedAnalytics Component

**Purpose**: Display feed-related analytics and metrics (read-only)

**Key Features**:
- Total feed stock overview
- Feed consumption trends
- Approval rate metrics
- Stock movement analytics

#### 2. LoanAnalytics Component

**Purpose**: Display loan-related analytics and metrics (read-only)

**Key Features**:
- Total loans outstanding
- Farmer loan distribution
- Repayment rate analytics
- Loan approval trends

## Real-Time Synchronization Design

### Event-Driven Architecture

The system uses an event bus pattern for real-time synchronization:

```javascript
// Event Types
const EventTypes = {
  FEED_STOCK_UPDATED: 'feed_stock_updated',
  FEED_REQUEST_APPROVED: 'feed_request_approved',
  FEED_REQUEST_CREATED: 'feed_request_created',
  STOCK_HISTORY_ADDED: 'stock_history_added',
  LOAN_REQUEST_CREATED: 'loan_request_created',
  LOAN_APPROVED: 'loan_approved',
  RECEIPT_GENERATED: 'receipt_generated'
};

// Event Bus Implementation
class EventBus {
  constructor() {
    this.listeners = {};
  }
  
  subscribe(eventType, callback) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }
  
  emit(eventType, data) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach(callback => callback(data));
    }
  }
  
  unsubscribe(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(
        listener => listener !== callback
      );
    }
  }
}
```

### Cross-Component Synchronization

1. **Feed Stock Updates**: When employee updates stock, all farmer components receive real-time updates
2. **Feed Approvals**: When employee approves request, stock reduces across all components
3. **History Updates**: All history changes trigger updates in relevant components
4. **Dashboard Analytics**: Real-time metric updates when underlying data changes

## Service Layer Design

### FeedService

```javascript
class FeedService {
  // Stock management
  async updateFeedStock(feedId, quantity, price, employeeId) {
    // Atomic transaction with history logging
    // Real-time event emission
    // Cross-component synchronization
  }
  
  async getFeedStockAvailability() {
    // Real-time stock data for farmers
  }
  
  async validateQuantityRequest(feedName, requestedQuantity) {
    // Real-time validation against current stock
  }
  
  async createFeedRequest(requestData) {
    // Create request without stock reduction
    // Emit request created event
  }
  
  async approveFeedRequest(requestId, employeeId) {
    // Validate stock availability
    // Reduce stock atomically
    // Create history record
    // Generate receipt
    // Emit approval events
  }
}
```

### HistoryService

```javascript
class HistoryService {
  async createStockHistory(historyData) {
    // Create immutable history record
    // Validate data integrity
    // Emit history added event
  }
  
  async getStockHistory(feedName, dateRange) {
    // Retrieve history with filtering
  }
  
  async getFeedApprovalHistory(farmerId) {
    // Get farmer-specific approval history
  }
}
```

### ReceiptService

```javascript
class ReceiptService {
  async generateReceipt(feedRequestId) {
    // Create receipt record
    // Generate PDF (optional)
    // Emit receipt generated event
  }
  
  async getFarmerReceipts(farmerId) {
    // Get farmer's receipt history
  }
}
```

## Data Flow Patterns

### Feed Booking Flow

1. **Farmer Views Stock**: Real-time stock availability dashboard
2. **Farmer Selects Feed**: Dropdown with predefined feeds only
3. **Farmer Enters Quantity**: Real-time validation against available stock
4. **Validation Check**: Popup blocking if quantity exceeds stock
5. **Confirmation Flow**: Clear confirmation before submission
6. **Request Creation**: Store request without stock reduction
7. **Employee Notification**: Request appears in employee approval queue

### Feed Approval Flow

1. **Employee Reviews Request**: Pending requests with urgency indicators
2. **Stock Validation**: Check current stock availability
3. **Approval Action**: Employee approves request
4. **Atomic Stock Reduction**: Reduce stock quantity immediately
5. **History Logging**: Create FEED_APPROVED history record
6. **Receipt Generation**: Auto-generate receipt for farmer
7. **Real-Time Updates**: Sync changes across all components
8. **Farmer Notification**: Receipt available in farmer dashboard

### Stock Update Flow

1. **Employee Updates Stock**: Modify quantity or price
2. **Validation**: Ensure non-negative quantities
3. **Atomic Update**: Update stock with version control
4. **History Logging**: Create STOCK_ADDED history record
5. **Event Emission**: Broadcast stock update event
6. **Cross-Component Sync**: Update all farmer and dashboard components
7. **Real-Time Refresh**: Immediate UI updates without page reload

## Security and Access Control

### Role-Based Permissions

```javascript
const Permissions = {
  FARMER: [
    'view_stock_availability',
    'create_feed_request',
    'create_loan_request',
    'view_own_receipts',
    'view_own_history'
  ],
  
  EMPLOYEE: [
    'manage_feed_stock',
    'approve_feed_requests',
    'approve_loan_requests',
    'view_all_requests',
    'generate_receipts'
  ],
  
  DASHBOARD: [
    'view_analytics',
    'view_metrics',
    'view_reports'
  ]
};
```

### Data Validation Rules

1. **Feed Names**: Strictly validate against predefined list
2. **Quantities**: Non-negative numbers only
3. **Stock Availability**: Real-time validation before any operation
4. **User Permissions**: Role-based access enforcement
5. **Data Integrity**: Atomic transactions with rollback capability

## Error Handling and Recovery

### Error Types and Handling

1. **Validation Errors**: User-friendly messages with correction guidance
2. **Stock Insufficient**: Clear error with current availability display
3. **Network Errors**: Retry mechanisms with user feedback
4. **Concurrent Updates**: Optimistic locking with conflict resolution
5. **System Errors**: Graceful degradation with error logging

### Recovery Mechanisms

1. **Transaction Rollback**: Automatic rollback on failure
2. **State Synchronization**: Re-sync on connection restore
3. **Offline Handling**: Queue operations for later processing
4. **Data Consistency**: Validation and repair mechanisms

## Performance Optimization

### Caching Strategy

1. **Feed Stock Data**: Cache with real-time invalidation
2. **User Permissions**: Session-based caching
3. **History Data**: Paginated loading with caching
4. **Analytics Data**: Computed metrics with refresh intervals

### Real-Time Optimization

1. **Event Debouncing**: Prevent excessive updates
2. **Selective Updates**: Update only affected components
3. **Lazy Loading**: Load data on demand
4. **Connection Pooling**: Efficient resource utilization

This design provides a comprehensive foundation for implementing the enterprise loan & feed management system with all required features, real-time synchronization, and strict data integrity.