# Design Document

## Overview

This design implements real-time feed stock management with automatic stock updates, comprehensive stock history tracking, and cross-component data synchronization. The solution ensures data consistency, provides complete audit trails, and maintains real-time UI updates without page reloads.

## Architecture

### Component Structure
```
Feed Stock Management System
├── Real-Time Stock Service
│   ├── Stock Update Handler
│   ├── Cross-Component Synchronizer
│   └── Data Consistency Manager
├── Stock History Service
│   ├── Audit Trail Logger
│   ├── History Record Creator
│   └── Immutable Storage Manager
└── UI Synchronization Layer
    ├── Feed Management Updates
    ├── Feed Stock Management Updates
    ├── Dashboard Analytics Updates
    └── Farmer Modal Updates
```

## Components and Interfaces

### 1. Real-Time Stock Service

**Purpose**: Manages real-time stock updates and cross-component synchronization

**Key Functions**:
- `updateStockRealTime(stockId, newQuantity, newPrice)` - Updates stock with real-time sync
- `reduceStockOnApproval(feedType, quantity)` - Reduces stock when feed is approved
- `validateStockAvailability(feedType, requestedQuantity)` - Validates stock before approval
- `syncAcrossComponents(stockData)` - Synchronizes data across all components

**State Management**:
```javascript
const [feedStocks, setFeedStocks] = useState([]);
const [stockUpdateInProgress, setStockUpdateInProgress] = useState(false);
const [syncStatus, setSyncStatus] = useState('idle');
```

### 2. Stock History Service

**Purpose**: Creates and manages immutable audit trails for all stock changes

**Key Functions**:
- `createFeedApprovalHistory(feedData, farmerData, approvalData)` - Logs feed approval history
- `createStockUpdateHistory(stockData, updateData, employeeData)` - Logs manual stock updates
- `validateHistoryIntegrity()` - Ensures history record integrity
- `getStockHistory(filters)` - Retrieves filtered stock history

**History Record Structure**:
```javascript
// Feed Approval History
{
  id: string,
  feedName: string,
  farmerName: string,
  farmerId: string,
  actionType: 'FEED_APPROVED',
  previousStockQuantity: number,
  approvedFeedQuantity: number,
  remainingStockQuantity: number,
  feedPricePerKg: number,
  totalFeedAmount: number,
  approvalDateTime: Date,
  approvedBy: string,
  approvedByEmployeeId: string,
  calculationFormula: 'Previous Stock - Approved Quantity = Remaining Stock',
  isImmutable: true
}

// Manual Stock Update History
{
  id: string,
  feedName: string,
  actionType: 'STOCK_ADDED',
  previousStockQuantity: number,
  addedStockQuantity: number,
  currentStockQuantity: number,
  previousPrice: number,
  updatedPrice: number,
  updateDateTime: Date,
  updatedBy: string,
  updatedByEmployeeId: string,
  calculationFormula: 'Previous Stock + Added Stock = Current Stock',
  isImmutable: true
}
```

### 3. UI Synchronization Layer

**Purpose**: Ensures real-time UI updates across all components

**Synchronization Points**:
- Feed Management page stock indicators
- Feed Stock Management table
- Dashboard analytics cards
- Farmer detail modals
- Stock history displays

**Update Mechanisms**:
```javascript
// Cross-component stock update
const updateStockAcrossComponents = (updatedStock) => {
  // Update Feed Management
  updateFeedManagementStock(updatedStock);
  
  // Update Feed Stock Management
  updateFeedStockManagementTable(updatedStock);
  
  // Update Dashboard Analytics
  updateDashboardAnalytics(updatedStock);
  
  // Update Farmer Modals
  updateFarmerModalData(updatedStock);
  
  // Update Stock History
  refreshStockHistory();
};
```

## Data Models

### Enhanced Feed Stock Model
```javascript
{
  id: string,
  feedName: string,
  availableQuantity: number,
  pricePerKg: number,
  category: string,
  lastUpdated: Date,
  lowStockThreshold: number,
  lastModifiedBy: string,
  version: number, // For optimistic locking
  syncStatus: 'synced' | 'syncing' | 'error'
}
```

### Stock History Model
```javascript
{
  id: string,
  feedId: string,
  feedName: string,
  actionType: 'FEED_APPROVED' | 'STOCK_ADDED',
  
  // Quantities
  previousQuantity: number,
  changedQuantity: number, // Positive for additions, negative for reductions
  currentQuantity: number,
  
  // Prices
  previousPrice?: number,
  currentPrice?: number,
  
  // Approval-specific fields
  farmerName?: string,
  farmerId?: string,
  totalAmount?: number,
  
  // Audit fields
  timestamp: Date,
  performedBy: string,
  performedByEmployeeId: string,
  calculationFormula: string,
  
  // Integrity
  isImmutable: true,
  checksum: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do.*

### Property 1: Real-Time Stock Consistency
*For any* stock update operation, all related UI components must reflect the updated stock quantity immediately without requiring page reload.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Automatic Stock Reduction Accuracy
*For any* approved feed request, the remaining stock quantity must equal the previous stock quantity minus the approved feed quantity.
**Validates: Requirements 2.1, 2.2, 2.5**

### Property 3: Stock History Completeness
*For any* stock change operation, exactly one immutable history record must be created with complete audit information.
**Validates: Requirements 3.7, 4.7, 5.3, 5.4**

### Property 4: Stock Validation Integrity
*For any* feed approval request, the system must prevent approval when requested quantity exceeds available stock.
**Validates: Requirements 2.3, 2.4, 2.6**

### Property 5: History Record Immutability
*For any* created stock history record, the record must never be editable or deletable after creation.
**Validates: Requirements 5.1, 5.5, 5.6**

### Property 6: Cross-Component Synchronization
*For any* stock update, all components displaying stock information must show consistent data simultaneously.
**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

## Implementation Strategy

### 1. Stock Update Workflow
```javascript
const approveFeeedRequest = async (request) => {
  try {
    // 1. Validate stock availability
    const validation = validateStockAvailability(request.feedType, request.requestedQuantity);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    
    // 2. Begin transaction
    const transaction = beginStockTransaction();
    
    // 3. Reduce stock quantity
    const updatedStock = await reduceStockQuantity(
      request.feedType, 
      request.requestedQuantity,
      transaction
    );
    
    // 4. Create approval record
    const approvalRecord = await createApprovalRecord(request, transaction);
    
    // 5. Create stock history
    await createStockHistory({
      actionType: 'FEED_APPROVED',
      feedData: updatedStock,
      approvalData: approvalRecord,
      transaction
    });
    
    // 6. Commit transaction
    await commitTransaction(transaction);
    
    // 7. Sync across components
    await syncStockAcrossComponents(updatedStock);
    
    return { success: true, updatedStock, approvalRecord };
    
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
};
```

### 2. Manual Stock Update Workflow
```javascript
const updateStockManually = async (stockId, newQuantity, newPrice, employeeId) => {
  try {
    // 1. Get current stock
    const currentStock = await getStockById(stockId);
    
    // 2. Begin transaction
    const transaction = beginStockTransaction();
    
    // 3. Update stock
    const updatedStock = await updateStock({
      id: stockId,
      availableQuantity: newQuantity,
      pricePerKg: newPrice,
      lastUpdated: new Date(),
      lastModifiedBy: employeeId
    }, transaction);
    
    // 4. Create stock history
    await createStockHistory({
      actionType: 'STOCK_ADDED',
      feedData: updatedStock,
      previousData: currentStock,
      employeeId,
      transaction
    });
    
    // 5. Commit transaction
    await commitTransaction(transaction);
    
    // 6. Sync across components
    await syncStockAcrossComponents(updatedStock);
    
    return { success: true, updatedStock };
    
  } catch (error) {
    await rollbackTransaction(transaction);
    throw error;
  }
};
```

### 3. Cross-Component Synchronization
```javascript
const syncStockAcrossComponents = async (updatedStock) => {
  // Update all components simultaneously
  await Promise.all([
    updateFeedManagementComponent(updatedStock),
    updateFeedStockManagementComponent(updatedStock),
    updateDashboardAnalytics(updatedStock),
    updateFarmerModals(updatedStock),
    refreshStockHistory()
  ]);
  
  // Emit real-time update event
  emitStockUpdateEvent(updatedStock);
};
```

## Error Handling

### Stock Update Errors
- **Insufficient Stock**: Prevent approval and show clear error message
- **Concurrent Updates**: Handle with optimistic locking and retry mechanisms
- **Transaction Failures**: Rollback all changes and maintain data consistency
- **Sync Failures**: Retry synchronization and show sync status

### History Logging Errors
- **History Creation Failure**: Prevent stock update and notify administrators
- **Integrity Violations**: Reject updates that would compromise audit trail
- **Storage Failures**: Implement backup logging mechanisms

## Testing Strategy

### Unit Tests
- Stock calculation accuracy
- History record creation
- Cross-component synchronization
- Error handling scenarios

### Property Tests
- Real-time stock consistency across components (100+ test cases)
- Stock reduction accuracy for all approval scenarios
- History record completeness and immutability
- Stock validation integrity across different stock levels
- Cross-component data synchronization

**Property Test Configuration**: Minimum 100 iterations per property test, tagged with feature name and property reference.