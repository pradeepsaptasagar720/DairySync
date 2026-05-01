# Design Document

## Overview

This design document outlines the implementation of comprehensive loan analytics for the admin dashboard. The system will provide detailed insights into loan requests, approvals, payments, and outstanding dues by extending the existing admin analytics infrastructure.

## Architecture

The loan analytics system will integrate with the existing admin dashboard architecture:

- **Backend**: Extend `getComprehensiveAnalytics` function in `admin.controller.js`
- **Frontend**: Add loan analytics components to `AdminAnalytics.jsx`
- **Data Source**: MongoDB aggregation queries on the `Loan` model
- **Visualization**: Recharts library for interactive charts and graphs

## Components and Interfaces

### Backend Components

#### 1. Loan Analytics Aggregation Service
```javascript
// Location: backend/src/services/loanAnalytics.service.js
class LoanAnalyticsService {
  static async getLoanOverviewStats(dateRange)
  static async getLoanStatusDistribution()
  static async getLoanTrends(period)
  static async getFarmerLoanAnalytics()
  static async getEmployeeLoanPerformance()
  static async getLoanPurposeAnalysis()
  static async getLoanRiskAssessment()
}
```

#### 2. Extended Admin Controller
```javascript
// Location: backend/src/controllers/admin.controller.js
// Extend getComprehensiveAnalytics function to include:
const loanAnalytics = {
  overview: {
    totalRequested: Number,
    totalApproved: Number,
    totalReturned: Number,
    totalOutstanding: Number,
    approvalRate: Number,
    recoveryRate: Number,
    activeBorrowers: Number,
    clearedBorrowers: Number
  },
  statusDistribution: [
    { status: String, count: Number, amount: Number, percentage: Number }
  ],
  trends: {
    requests: [{ date: String, count: Number, amount: Number }],
    approvals: [{ date: String, count: Number, amount: Number }],
    payments: [{ date: String, count: Number, amount: Number }]
  },
  topBorrowers: [
    { farmer: Object, totalRequested: Number, totalApproved: Number, outstanding: Number }
  ],
  employeePerformance: [
    { employee: Object, loansApproved: Number, totalAmount: Number, avgProcessingTime: Number }
  ],
  purposeAnalysis: [
    { purpose: String, count: Number, amount: Number, successRate: Number }
  ],
  riskMetrics: {
    overdueLoans: Number,
    riskScore: Number,
    concentrationRisk: Number
  }
}
```

### Frontend Components

#### 1. Loan Overview Cards
```jsx
// Location: frontend/src/pages/admin/sections/AdminAnalytics.jsx
// Add to overview cards section:
<LoanOverviewCards loanData={analytics.loans.overview} />
```

#### 2. Loan Status Distribution Chart
```jsx
<LoanStatusChart data={analytics.loans.statusDistribution} />
```

#### 3. Loan Trends Charts
```jsx
<LoanTrendsChart data={analytics.loans.trends} />
```

#### 4. Top Borrowers Table
```jsx
<TopBorrowersTable data={analytics.loans.topBorrowers} />
```

#### 5. Employee Performance Chart
```jsx
<EmployeeLoanPerformanceChart data={analytics.loans.employeePerformance} />
```

## Data Models

### Loan Analytics Data Structure

Based on the existing Loan model, the analytics will utilize these key fields:

```javascript
// Loan Model Fields for Analytics
{
  farmer: ObjectId,              // For farmer-specific analytics
  requestedAmount: Number,       // Total loan requests
  approvedAmount: Number,        // Total approved loans
  totalReturned: Number,         // Total payments received
  totalDue: Number,             // Outstanding dues
  status: String,               // Loan lifecycle status
  requestDate: Date,            // Request trends
  approvalDate: Date,           // Approval trends
  approvedBy: ObjectId,         // Employee performance
  purpose: String,              // Purpose analysis
  history: [                    // Payment tracking
    {
      transactionType: String,
      transactionAmount: Number,
      date: Date,
      processedBy: ObjectId
    }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Loan Amount Consistency
*For any* loan record, the sum of totalReturned and totalDue should equal the approvedAmount when the loan is approved
**Validates: Requirements 1.1, 1.3**

### Property 2: Status Progression Validity
*For any* loan, status transitions should follow the valid sequence: requested → approved → partially_paid → fully_cleared → closed
**Validates: Requirements 2.1**

### Property 3: Analytics Aggregation Accuracy
*For any* date range, the sum of individual loan amounts should equal the aggregate totals in analytics
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 4: Employee Performance Consistency
*For any* employee, the count of loans they approved should match the sum of their individual loan approval records
**Validates: Requirements 5.1, 5.2**

### Property 5: Farmer Analytics Accuracy
*For any* farmer, their total loan amounts in analytics should match the sum of their individual loan records
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Payment History Integrity
*For any* loan with payment history, the sum of payment transactions should equal the totalReturned amount
**Validates: Requirements 1.3, 3.3**

### Property 7: Risk Calculation Correctness
*For any* risk assessment, overdue loans should only include loans with positive totalDue and past due dates
**Validates: Requirements 8.1, 8.2**

## Error Handling

### Backend Error Handling
- Handle missing loan data gracefully with default values
- Validate date ranges for trend analysis
- Handle aggregation pipeline errors
- Provide fallback data when specific analytics fail

### Frontend Error Handling
- Display loading states during data fetching
- Show error messages for failed API calls
- Provide retry mechanisms for failed requests
- Handle missing or malformed data gracefully

## Testing Strategy

### Unit Tests
- Test individual aggregation functions with sample data
- Verify loan status calculations and transitions
- Test date range filtering and trend calculations
- Validate employee performance metrics

### Property-Based Tests
- Test loan amount consistency across all loan records
- Verify aggregation accuracy with randomly generated loan data
- Test status progression validity with various loan scenarios
- Validate employee and farmer analytics with multiple data sets

### Integration Tests
- Test complete analytics pipeline from database to frontend
- Verify API response structure and data integrity
- Test dashboard integration and chart rendering
- Validate real-time data updates and refresh functionality

## Implementation Plan

### Phase 1: Backend Analytics Service
1. Create `LoanAnalyticsService` with aggregation functions
2. Extend `getComprehensiveAnalytics` to include loan data
3. Add comprehensive error handling and validation
4. Write unit tests for all aggregation functions

### Phase 2: Frontend Integration
1. Add loan overview cards to dashboard
2. Implement loan status distribution chart
3. Create loan trends visualization
4. Add top borrowers and employee performance sections

### Phase 3: Advanced Features
1. Implement risk assessment metrics
2. Add purpose analysis charts
3. Create interactive filtering capabilities
4. Add data export functionality

### Phase 4: Testing and Optimization
1. Comprehensive testing of all components
2. Performance optimization for large datasets
3. User acceptance testing
4. Documentation and deployment