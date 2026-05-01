# Design Document

## Overview

The Loan and Feed Analytics Dashboard is a complete rebuild of the employee loan and feed management system. It transforms the existing tabbed interface into a comprehensive analytics-focused dashboard with three main sections: Loan Management, Feed Management, and Feed Stock Management. The system emphasizes data visualization, farmer-specific tracking, and real-time analytics.

## Architecture

### Component Structure
```
LoanFeedManagement/
├── AnalyticsDashboard/
│   ├── LoanAnalytics
│   └── FeedAnalytics
├── LoanSection/
│   ├── LoanRequestsButton
│   ├── ApprovedLoansButton
│   ├── LoanHistory
│   └── FarmerLoanDetails
├── FeedSection/
│   ├── FeedRequestsButton
│   ├── ApprovedFeedButton
│   ├── FeedSalesHistory
│   └── FarmerFeedDetails
└── FeedStockSection/
    ├── StockOverview
    └── StockManagement
```

### Data Flow
1. **Analytics Layer**: Aggregates data from loans and feed transactions
2. **Management Layer**: Handles CRUD operations for loans and feed requests
3. **History Layer**: Maintains farmer-specific transaction histories
4. **Stock Layer**: Manages feed inventory and pricing

## Components and Interfaces

### Main Dashboard Component
```typescript
interface LoanFeedDashboard {
  analytics: AnalyticsData
  loanSection: LoanSectionData
  feedSection: FeedSectionData
  stockSection: StockSectionData
  selectedFarmer?: FarmerDetails
  filters: FilterOptions
}
```

### Analytics Dashboard
```typescript
interface AnalyticsData {
  loanAnalytics: {
    totalFarmersWithLoans: number
    totalLoanAmount: number
    approvedLoans: number
    pendingLoans: number
  }
  feedAnalytics: {
    totalFarmersBuyingFeed: number
    totalFeedQuantitySold: number
    totalFeedRevenue: number
    activeFeedTypes: number
  }
}
```

### Loan Management
```typescript
interface LoanRequest {
  id: string
  farmerName: string
  farmerId: string
  requestedAmount: number
  requestDate: Date
  purpose: string
  status: 'pending' | 'approved' | 'rejected'
}

interface ApprovedLoan {
  id: string
  farmerName: string
  farmerId: string
  approvedAmount: number
  approvalDate: Date
  status: 'approved' | 'active' | 'closed'
  emiAmount?: number
  remainingAmount?: number
}

interface FarmerLoanHistory {
  farmerId: string
  farmerName: string
  currentPendingAmount: number
  totalLifetimeLoanAmount: number
  loanRecords: LoanRecord[]
}

interface LoanRecord {
  loanDate: Date
  loanAmount: number
  status: 'paid' | 'pending' | 'closed'
  loanId: string
}
```

### Feed Management
```typescript
interface FeedRequest {
  id: string
  farmerName: string
  farmerId: string
  feedType: string
  requestedQuantity: number
  requestedAmount: number
  requestDate: Date
  status: 'pending' | 'approved' | 'rejected'
}

interface ApprovedFeed {
  id: string
  farmerName: string
  farmerId: string
  feedType: string
  approvedQuantity: number
  feedAmount: number
  approvalDate: Date
  deliveryStatus: 'pending' | 'delivered'
}

interface FarmerFeedHistory {
  farmerId: string
  farmerName: string
  totalQuantityBought: number
  totalAmountSpent: number
  purchaseCount: number
  feedRecords: FeedRecord[]
}

interface FeedRecord {
  purchaseDate: Date
  feedType: string
  quantity: number
  amount: number
  feedId: string
}
```

### Feed Stock Management
```typescript
interface FeedStock {
  id: string
  feedName: string
  availableQuantity: number
  pricePerKg: number
  lastUpdated: Date
  category: 'cattle' | 'poultry' | 'mineral' | 'supplement'
}

interface StockUpdate {
  stockId: string
  newQuantity?: number
  newPrice?: number
  updateReason: string
}
```

## Data Models

### Farmer Aggregation Model
```typescript
interface FarmerAggregateData {
  farmerId: string
  farmerName: string
  loanSummary: {
    totalLoansReceived: number
    currentPendingAmount: number
    loanHistory: LoanRecord[]
  }
  feedSummary: {
    totalFeedPurchased: number
    totalAmountSpent: number
    feedHistory: FeedRecord[]
  }
}
```

### Analytics Calculation Model
```typescript
interface AnalyticsCalculator {
  calculateLoanAnalytics(loans: ApprovedLoan[]): LoanAnalytics
  calculateFeedAnalytics(feedSales: ApprovedFeed[]): FeedAnalytics
  getFarmerCount(transactions: Transaction[]): number
  aggregateByFarmer(transactions: Transaction[]): FarmerAggregateData[]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Analytics Consistency
*For any* set of approved loans and feed sales, the analytics dashboard totals should equal the sum of individual transaction amounts and the farmer count should not include duplicates across multiple transactions
**Validates: Requirements 7.1, 7.2, 7.3, 7.7**

### Property 2: Farmer History Accuracy
*For any* farmer with multiple loan or feed transactions, the history should correctly aggregate all transactions without duplication and maintain accurate running totals
**Validates: Requirements 3.3, 5.3**

### Property 3: Stock Level Consistency
*For any* feed stock item, the available quantity should accurately reflect initial stock minus approved feed allocations plus any stock updates
**Validates: Requirements 6.7**

### Property 4: Button Display Accuracy
*For any* loan or feed section button, the displayed counts and amounts should match the actual data in the corresponding request or approval lists
**Validates: Requirements 2.2, 2.5, 4.2, 4.5**

### Property 5: Filter Operation Correctness
*For any* applied filter (date range, farmer, feed type), the filtered results should contain only records that match all specified criteria
**Validates: Requirements 3.8, 5.8**

### Property 6: Farmer Selection Consistency
*For any* selected farmer, the displayed summary and detailed history should contain only transactions belonging to that specific farmer
**Validates: Requirements 3.4, 3.5, 5.4, 5.5**

### Property 7: Stock Update Validation
*For any* stock update operation, only existing feed stock records should be modifiable and all updates should maintain data integrity
**Validates: Requirements 6.4, 6.5, 6.6**

### Property 8: Dynamic Analytics Updates
*For any* change in approved loans or feed sales, the analytics dashboard should reflect the updated values immediately without requiring page refresh
**Validates: Requirements 7.5, 7.6**

## Error Handling

### Data Loading Errors
- Display user-friendly error messages for API failures
- Provide retry mechanisms for failed data fetches
- Show loading states during data operations
- Handle empty data states gracefully

### Validation Errors
- Validate stock update inputs (positive numbers only)
- Ensure filter date ranges are valid
- Prevent invalid farmer selections
- Validate feed quantity and price updates

### State Management Errors
- Handle concurrent data updates
- Prevent data corruption during farmer history aggregation
- Ensure analytics calculations remain consistent
- Manage filter state persistence

## Testing Strategy

### Unit Testing
- Test analytics calculation functions with various data sets
- Verify farmer history aggregation logic
- Test filter operations with edge cases
- Validate stock update calculations

### Property-Based Testing
- Generate random loan and feed data to test analytics consistency
- Test farmer history accuracy with multiple transaction scenarios
- Verify filter correctness across various criteria combinations
- Test stock level calculations with random update sequences

### Integration Testing
- Test complete user workflows from button clicks to data display
- Verify farmer selection and detail view functionality
- Test analytics dashboard updates after data changes
- Validate cross-section data consistency

### Performance Testing
- Test dashboard performance with large datasets
- Verify analytics calculation efficiency
- Test filter operation speed with extensive data
- Ensure responsive UI with heavy data loads