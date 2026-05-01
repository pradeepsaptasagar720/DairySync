# Design Document

## Overview

This design implements a comprehensive Feed Stock Setup and Farmer Feed Booking workflow with strict feed name control, real-time stock synchronization, validation, urgency handling, approval flow, and receipt generation. The system ensures enterprise-level dairy management standards with predefined feed types, real-time validation, and complete audit trails.

## Architecture

### System Architecture
```
Comprehensive Feed Management System
├── Employee Feed Stock Management
│   ├── Predefined Feed Configuration
│   ├── Stock Quantity & Price Management
│   └── Approval Workflow Engine
├── Farmer Feed Booking System
│   ├── Stock Availability Dashboard
│   ├── Feed Booking Form with Validation
│   ├── Urgency Level Management
│   └── Booking Confirmation Flow
├── Real-Time Synchronization Engine
│   ├── Cross-Component Data Sync
│   ├── Stock Update Propagation
│   └── Validation State Management
├── Receipt Generation System
│   ├── Automatic Receipt Creation
│   ├── PDF Generation Engine
│   └── Receipt History Management
└── Feed Analytics Dashboard
    ├── Consumption Pattern Analysis
    ├── Cost Tracking & Reporting
    └── Seasonal Trend Analysis
```

## Components and Interfaces

### 1. Predefined Feed Configuration System

**Purpose**: Manages the fixed list of 6 feed types with descriptions and categories

**Predefined Feed Types**:
```javascript
const PREDEFINED_FEEDS = [
  {
    id: 'FEED_001',
    name: 'Cattle Feed',
    description: 'High-quality cattle feed for dairy cows',
    category: 'livestock',
    isEditable: false
  },
  {
    id: 'FEED_002',
    name: 'Buffalo Feed',
    description: 'Specialized feed for buffaloes',
    category: 'livestock',
    isEditable: false
  },
  {
    id: 'FEED_003',
    name: 'Mineral Mix',
    description: 'Essential minerals and vitamins',
    category: 'supplement',
    isEditable: false
  },
  {
    id: 'FEED_004',
    name: 'Green Fodder',
    description: 'Fresh green fodder for livestock',
    category: 'fodder',
    isEditable: false
  },
  {
    id: 'FEED_005',
    name: 'Dry Fodder',
    description: 'Dried hay and straw',
    category: 'fodder',
    isEditable: false
  },
  {
    id: 'FEED_006',
    name: 'Concentrate Feed',
    description: 'High-energy concentrate feed',
    category: 'concentrate',
    isEditable: false
  }
];
```

### 2. Employee Feed Stock Management

**Purpose**: Allows employees to manage stock quantities and prices for predefined feeds

**Key Functions**:
- `updateFeedStock(feedId, quantity, pricePerKg)` - Updates stock with validation
- `validateStockUpdate(feedId, quantity, price)` - Validates stock update parameters
- `getFeedStockList()` - Retrieves current stock levels for all feeds
- `syncStockAcrossComponents(updatedStock)` - Propagates stock updates

**Stock Management Interface**:
```javascript
const FeedStockManagement = {
  // Read-only feed information
  feedName: string,
  description: string,
  category: string,
  
  // Editable stock information
  availableQuantity: number,
  pricePerKg: number,
  lastUpdated: Date,
  lastModifiedBy: string,
  
  // System fields
  id: string,
  version: number,
  syncStatus: 'synced' | 'syncing' | 'error'
};
```

### 3. Farmer Stock Availability Dashboard

**Purpose**: Displays real-time stock availability to farmers with proper visibility rules

**Key Functions**:
- `getAvailableFeeds()` - Returns feeds with stock > 0
- `getOutOfStockFeeds()` - Returns feeds with stock = 0
- `calculateEstimatedAmount(feedId, quantity)` - Calculates total cost
- `validateQuantityAvailability(feedId, requestedQuantity)` - Real-time validation

**Stock Display Rules**:
```javascript
const getStockDisplayInfo = (feed) => {
  if (feed.availableQuantity > 0) {
    return {
      showPrice: true,
      showQuantity: true,
      enableBooking: true,
      status: 'available',
      displayPrice: feed.pricePerKg
    };
  } else {
    return {
      showPrice: false,
      showQuantity: true,
      enableBooking: false,
      status: 'out-of-stock',
      displayPrice: '—'
    };
  }
};
```

### 4. Feed Booking System with Urgency Levels

**Purpose**: Handles farmer feed booking with validation and urgency classification

**Urgency Level Configuration**:
```javascript
const URGENCY_LEVELS = {
  NORMAL: {
    value: 'normal',
    label: 'Normal',
    color: 'blue',
    priority: 1,
    description: 'Standard feed requirement'
  },
  HIGH_PRIORITY: {
    value: 'high-priority',
    label: 'High Priority',
    color: 'orange',
    priority: 2,
    description: 'Urgent feed requirement'
  },
  URGENT: {
    value: 'urgent',
    label: 'Urgent',
    color: 'red',
    priority: 3,
    description: 'Critical feed requirement'
  }
};
```

**Booking Form Structure**:
```javascript
const FeedBookingForm = {
  feedType: string, // Dropdown with predefined feeds
  requestedQuantity: number, // With real-time validation
  urgencyLevel: 'normal' | 'high-priority' | 'urgent',
  notes: string, // Optional
  estimatedTotalAmount: number, // Auto-calculated
  
  // Validation state
  isQuantityValid: boolean,
  availableStock: number,
  validationMessage: string
};
```

### 5. Real-Time Validation Engine

**Purpose**: Provides immediate validation feedback for quantity inputs

**Validation Functions**:
```javascript
const validateQuantityInput = (feedId, requestedQuantity) => {
  const feed = getCurrentFeedStock(feedId);
  
  if (requestedQuantity <= 0) {
    return {
      isValid: false,
      message: 'Quantity must be greater than 0',
      blockInput: true
    };
  }
  
  if (requestedQuantity > feed.availableQuantity) {
    return {
      isValid: false,
      message: 'Requested quantity exceeds available stock',
      blockInput: true,
      showPopup: true
    };
  }
  
  return {
    isValid: true,
    message: 'Quantity is valid',
    blockInput: false
  };
};
```

### 6. Booking Confirmation System

**Purpose**: Provides clear confirmation flow before creating feed requests

**Confirmation Flow**:
```javascript
const BookingConfirmation = {
  // Display information
  feedName: string,
  requestedQuantity: number,
  pricePerKg: number,
  totalAmount: number,
  urgencyLevel: string,
  notes: string,
  
  // Confirmation actions
  confirmBooking: () => Promise<FeedRequest>,
  cancelBooking: () => void,
  
  // UI state
  isConfirming: boolean,
  showConfirmationPopup: boolean
};
```

### 7. Feed Request Management

**Purpose**: Creates and manages feed request records

**Feed Request Model**:
```javascript
const FeedRequest = {
  id: string,
  farmerId: string,
  farmerName: string,
  feedId: string,
  feedName: string,
  requestedQuantity: number,
  pricePerKg: number,
  totalAmount: number,
  urgencyLevel: 'normal' | 'high-priority' | 'urgent',
  notes: string,
  requestDateTime: Date,
  requestStatus: 'pending' | 'approved' | 'rejected',
  paymentStatus: 'pending' | 'paid' | 'cancelled',
  
  // Approval information (filled after approval)
  approvedBy: string,
  approvedDateTime: Date,
  approvalNotes: string
};
```

### 8. Employee Approval Workflow

**Purpose**: Manages employee approval process with automatic stock reduction

**Approval Functions**:
```javascript
const approveFeeedRequest = async (requestId, employeeId) => {
  try {
    // 1. Validate current stock availability
    const request = await getFeedRequest(requestId);
    const currentStock = await getFeedStock(request.feedId);
    
    if (currentStock.availableQuantity < request.requestedQuantity) {
      throw new Error('Insufficient stock for approval');
    }
    
    // 2. Begin transaction
    const transaction = beginTransaction();
    
    // 3. Reduce stock quantity
    const updatedStock = await reduceStockQuantity(
      request.feedId,
      request.requestedQuantity,
      transaction
    );
    
    // 4. Update request status
    const approvedRequest = await updateRequestStatus(
      requestId,
      'approved',
      employeeId,
      transaction
    );
    
    // 5. Generate receipt
    const receipt = await generateFeedReceipt(
      approvedRequest,
      transaction
    );
    
    // 6. Commit transaction
    await commitTransaction(transaction);
    
    // 7. Sync across components
    await syncStockAcrossComponents(updatedStock);
    
    return { success: true, approvedRequest, receipt };
    
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
};
```

### 9. Receipt Generation System

**Purpose**: Automatically generates receipts after feed approval

**Receipt Model**:
```javascript
const FeedReceipt = {
  receiptId: string,
  receiptNumber: string, // Human-readable format
  farmerId: string,
  farmerName: string,
  feedName: string,
  approvedQuantity: number,
  pricePerKg: number,
  totalAmount: number,
  urgencyLevel: string,
  approvalDateTime: Date,
  approvedBy: string,
  
  // Receipt metadata
  generatedDateTime: Date,
  receiptStatus: 'generated' | 'downloaded' | 'printed',
  pdfPath: string,
  
  // Formatting
  receiptFormat: 'pdf' | 'html',
  isDownloadable: boolean
};
```

**Receipt Generation Functions**:
```javascript
const generateFeedReceipt = async (approvedRequest) => {
  const receiptData = {
    receiptNumber: generateReceiptNumber(),
    ...approvedRequest,
    generatedDateTime: new Date(),
    receiptStatus: 'generated'
  };
  
  // Generate PDF
  const pdfPath = await generateReceiptPDF(receiptData);
  receiptData.pdfPath = pdfPath;
  receiptData.isDownloadable = true;
  
  // Save receipt record
  const receipt = await saveReceipt(receiptData);
  
  return receipt;
};
```

### 10. Feed Analytics Dashboard

**Purpose**: Provides comprehensive analytics for farmer feed consumption patterns

**Analytics Components**:
```javascript
const FeedAnalytics = {
  // Consumption analytics
  totalQuantityByFeedType: Map<string, number>,
  totalAmountSpent: number,
  monthlyConsumptionTrends: Array<MonthlyData>,
  yearlyConsumptionTrends: Array<YearlyData>,
  
  // Urgency analytics
  urgencyLevelDistribution: Map<string, number>,
  averageUrgencyByMonth: Array<UrgencyData>,
  
  // Cost analytics
  averageFeedPrices: Map<string, number>,
  costAnalysisByFeedType: Array<CostData>,
  seasonalPriceVariations: Array<SeasonalData>,
  
  // Booking patterns
  bookingFrequency: Map<string, number>,
  seasonalBookingPatterns: Array<SeasonalPattern>,
  peakBookingTimes: Array<TimePattern>
};
```

**Analytics Functions**:
```javascript
const generateFeedAnalytics = (farmerId, dateRange) => {
  const bookings = getFarmerBookings(farmerId, dateRange);
  const receipts = getFarmerReceipts(farmerId, dateRange);
  
  return {
    consumptionAnalytics: calculateConsumptionTrends(bookings),
    costAnalytics: calculateCostAnalysis(receipts),
    urgencyAnalytics: analyzeUrgencyPatterns(bookings),
    seasonalAnalytics: calculateSeasonalPatterns(bookings),
    downloadableReports: generateReports(bookings, receipts)
  };
};
```

## Data Models

### Enhanced Feed Stock Model
```javascript
{
  id: string,
  name: string, // Predefined, non-editable
  description: string, // Predefined, non-editable
  category: string, // Predefined, non-editable
  availableQuantity: number, // Editable by employee
  pricePerKg: number, // Editable by employee
  lastUpdated: Date,
  lastModifiedBy: string,
  version: number,
  syncStatus: 'synced' | 'syncing' | 'error',
  isEditable: false // Always false for feed names
}
```

### Feed Request Model
```javascript
{
  id: string,
  farmerId: string,
  farmerName: string,
  feedId: string,
  feedName: string,
  requestedQuantity: number,
  pricePerKg: number,
  totalAmount: number,
  urgencyLevel: 'normal' | 'high-priority' | 'urgent',
  notes: string,
  requestDateTime: Date,
  requestStatus: 'pending' | 'approved' | 'rejected',
  paymentStatus: 'pending' | 'paid' | 'cancelled',
  approvedBy: string,
  approvedDateTime: Date,
  receiptId: string
}
```

### Feed Receipt Model
```javascript
{
  receiptId: string,
  receiptNumber: string,
  farmerId: string,
  farmerName: string,
  feedName: string,
  approvedQuantity: number,
  pricePerKg: number,
  totalAmount: number,
  urgencyLevel: string,
  approvalDateTime: Date,
  approvedBy: string,
  generatedDateTime: Date,
  pdfPath: string,
  isDownloadable: boolean,
  downloadCount: number
}
```

## Real-Time Synchronization Strategy

### Cross-Component Sync Implementation
```javascript
const syncFeedDataAcrossComponents = async (updatedData) => {
  // Update all components simultaneously
  await Promise.all([
    updateEmployeeFeedStockManagement(updatedData),
    updateFarmerStockAvailabilityDashboard(updatedData),
    updateFeedBookingForm(updatedData),
    updateFeedAnalyticsDashboard(updatedData),
    refreshReceiptHistory(updatedData)
  ]);
  
  // Emit real-time update events
  emitStockUpdateEvent(updatedData);
  emitBookingUpdateEvent(updatedData);
};
```

### Validation State Synchronization
```javascript
const syncValidationState = (feedId, availableQuantity) => {
  // Update all active booking forms
  const activeBookingForms = getActiveBookingForms();
  
  activeBookingForms.forEach(form => {
    if (form.selectedFeedId === feedId) {
      form.updateAvailableStock(availableQuantity);
      form.revalidateQuantity();
    }
  });
};
```

## Error Handling and Data Integrity

### Validation Error Handling
- **Quantity Exceeds Stock**: Block input and show popup immediately
- **Zero Stock Booking**: Disable booking form and show out-of-stock message
- **Concurrent Stock Updates**: Handle with optimistic locking and retry
- **Network Failures**: Maintain local state and sync when connection restored

### Data Integrity Rules
- **Single Source of Truth**: All stock data originates from employee management
- **Atomic Transactions**: All approval operations are transactional
- **Validation Consistency**: Same validation rules across all components
- **Audit Trail**: Complete logging of all stock and booking changes

## Testing Strategy

### Unit Tests
- Predefined feed configuration validation
- Real-time quantity validation logic
- Receipt generation accuracy
- Analytics calculation correctness

### Integration Tests
- Cross-component synchronization
- Approval workflow with stock reduction
- Receipt generation after approval
- Analytics data consistency

### Property Tests
- Stock availability consistency across components
- Booking validation integrity for all scenarios
- Receipt generation completeness
- Analytics calculation accuracy across different data sets

**Property Test Configuration**: Minimum 100 iterations per property test, tagged with feature name and property reference.