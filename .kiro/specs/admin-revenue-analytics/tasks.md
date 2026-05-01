# Implementation Plan: Admin Revenue Analytics

## Overview

This implementation plan breaks down the Admin Revenue Analytics feature into discrete, incremental coding tasks. Each task builds on previous work and includes testing to validate functionality early. The implementation follows a backend-first approach to ensure data APIs are ready before building the frontend.

## Tasks

- [x] 1. Set up backend infrastructure and data models
  - Create OtherExpense model for tracking miscellaneous expenses
  - Create FeedSale model for tracking feed sales to farmers
  - Create FeedPurchase model for tracking feed stock purchases by employees
  - Add indexes to existing models for efficient date-range queries
  - Create RevenueAggregationService for data aggregation logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 1.1 Write property test for data aggregation completeness
  - **Property 1: Data Aggregation Completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7**

- [x] 2. Implement core calculation functions
  - [x] 2.1 Create calculation utilities for net collected, net paid, feed profit/loss, and overall profit/loss
    - Implement calculateNetCollected(transportAmount, buyerPayments, feedSales)
    - Implement calculateNetPaid(farmerPayments, employeeSalaries, otherExpenses, feedPurchases)
    - Implement calculateFeedProfitLoss(feedSales, feedPurchases)
    - Implement calculateProfitLoss(netCollected, netPaid)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write property tests for calculation functions
    - **Property 2: Net Collected Calculation**
    - **Property 3: Net Paid Calculation**
    - **Property 4: Profit/Loss Calculation**
    - **Property 5: Feed Profit/Loss Calculation**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

- [x] 3. Implement backend API endpoints
  - [x] 3.1 Create GET /api/admin/revenue-analytics endpoint
    - Implement controller function to aggregate data from all seven sources (including feed sales and purchases)
    - Apply date range filters (dateFrom, dateTo, month, year)
    - Return summary (including feedSalesToFarmers, feedStockPurchases, feedProfitLoss), breakdown, and chart data
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_
  
  - [x] 3.2 Create GET /api/admin/revenue-analytics/comparison endpoint
    - Calculate previous period based on current period
    - Compute percentage changes for all metrics (including feed profit/loss)
    - _Requirements: 7.1, 7.2_
  
  - [ ]* 3.3 Write property tests for date range filtering
    - **Property 7: Date Range Filtering**
    - **Property 8: Invalid Date Range Rejection**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6**
  
  - [ ]* 3.4 Write property tests for comparison calculations
    - **Property 14: Previous Period Calculation**
    - **Property 15: Percentage Change Calculation**
    - **Validates: Requirements 7.1, 7.2**

- [ ] 4. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement frontend page structure
  - [x] 5.1 Create RevenueAnalytics main component
    - Set up component state for data, filters, loading, and errors
    - Implement useEffect hook for initial data fetch
    - Add error boundary for graceful error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 10.1, 10.2, 10.4_
  
  - [x] 5.2 Add "Revenue Analytics" link to AdminSidebar component
    - Add navigation link with icon
    - Implement active state highlighting
    - _Requirements: 9.1, 9.4_
  
  - [ ]* 5.3 Write unit tests for access control
    - **Property 18: Access Control**
    - **Validates: Requirements 9.3**

- [ ] 6. Implement filter controls
  - [ ] 6.1 Create FilterControls component
    - Add date range inputs (dateFrom, dateTo)
    - Add month and year dropdowns
    - Add custom period selector
    - Implement filter validation (start date ≤ end date)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  
  - [ ] 6.2 Implement filter state management and debouncing
    - Add debounce logic for filter changes (500ms)
    - Trigger data refresh on filter apply
    - _Requirements: 10.1, 10.5_
  
  - [ ]* 6.3 Write property test for request debouncing
    - **Property 22: Request Debouncing**
    - **Validates: Requirements 10.5**

- [ ] 7. Implement summary cards display
  - [ ] 7.1 Create SummaryCard component
    - Accept title, amount, icon, color, and trend props
    - Implement currency formatting with ₹ symbol and 2 decimal places
    - Add conditional color styling for profit/loss cards (feed and overall)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 4.12, 2.5, 2.6, 2.7_
  
  - [ ] 7.2 Render all eleven summary cards in RevenueAnalytics
    - Transported Milk Total Amount
    - Employee Salaries Paid
    - Farmer Payments Total
    - Buyer Payments Received
    - Other Expenses Total
    - Feed Sales to Farmers
    - Feed Stock Purchases
    - Net Collected Amount
    - Net Paid Amount
    - Feed Profit/Loss (with color coding)
    - Overall Profit/Loss (with color coding)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_
  
  - [ ]* 7.3 Write property tests for summary card display
    - **Property 6: Profit/Loss Color Coding**
    - **Property 9: Summary Cards Completeness**
    - **Property 10: Currency Formatting**
    - **Validates: Requirements 2.5, 2.6, 2.7, 4.1-4.12**

- [ ] 8. Implement trend chart visualization
  - [ ] 8.1 Create TrendChart component using Recharts
    - Display line chart with profit/loss over time
    - Use green color for positive values, red for negative
    - Add tooltip for data point details
    - Handle empty state when no data available
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 8.2 Write property test for chart color coding
    - **Property 11: Chart Data Point Color Coding**
    - **Validates: Requirements 5.2**

- [ ] 9. Implement breakdown tables
  - [ ] 9.1 Create BreakdownTable component
    - Accept title, data, columns, and pagination props
    - Display table with date, description, amount, payment method columns
    - Implement pagination controls
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [ ] 9.2 Render breakdown tables for all seven categories
    - Transported Milk transactions
    - Employee Salary payments
    - Farmer Payments
    - Buyer Payments
    - Other Expenses
    - Feed Sales to Farmers
    - Feed Stock Purchases
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 9.3 Write property tests for breakdown tables
    - **Property 12: Breakdown Table Field Completeness**
    - **Property 13: Pagination Consistency**
    - **Validates: Requirements 6.8, 6.9**

- [ ] 10. Implement comparison metrics display
  - [ ] 10.1 Create ComparisonMetric component
    - Display current vs previous period values
    - Show percentage change with arrow and color coding
    - Handle N/A state when previous data unavailable
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 10.2 Write property test for comparison display styling
    - **Property 16: Comparison Display Styling**
    - **Validates: Requirements 7.3, 7.4**

- [ ] 11. Checkpoint - Ensure frontend renders correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement export functionality
  - [ ] 12.1 Create ExportService on backend
    - Implement generatePDFReport function using pdfkit
    - Implement generateExcelReport function using xlsx
    - Include filter criteria and timestamp in exports
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 12.2 Create POST /api/admin/revenue-analytics/export endpoint
    - Accept format (pdf/excel), filters, and options
    - Generate export file
    - Return download URL or file buffer
    - Handle export generation errors
    - _Requirements: 8.1, 8.2, 8.6_
  
  - [ ] 12.3 Create ExportControls component on frontend
    - Add PDF and Excel export buttons
    - Trigger download on button click
    - Show loading state during export generation
    - Display error message if export fails
    - _Requirements: 8.1, 8.2, 8.5, 8.6_
  
  - [ ]* 12.4 Write property test for export metadata
    - **Property 17: Export Metadata Inclusion**
    - **Validates: Requirements 8.3, 8.4**

- [ ] 13. Implement real-time data updates and loading states
  - [ ] 13.1 Add loading indicators to all data-dependent components
    - Show skeleton loaders for summary cards
    - Show loading spinner for chart
    - Show loading state for tables
    - _Requirements: 10.2_
  
  - [ ] 13.2 Implement error handling with data retention
    - Display error messages when data fetch fails
    - Retain previous data in state
    - Add retry button for failed requests
    - _Requirements: 10.4_
  
  - [ ]* 13.3 Write property tests for loading and error states
    - **Property 19: Filter Change Data Refresh**
    - **Property 20: Loading State Display**
    - **Property 21: Error Handling with Data Retention**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [ ] 14. Implement graceful error handling for data sources
  - [ ] 14.1 Add error handling in RevenueAggregationService
    - Wrap each data source fetch in try-catch
    - Return zero for failed sources
    - Log errors for debugging
    - Continue aggregation with available data
    - _Requirements: 1.8_
  
  - [ ]* 14.2 Write property test for graceful error handling
    - **Property 23: Graceful Error Handling**
    - **Validates: Requirements 1.8**

- [ ] 15. Add route protection and authentication
  - [ ] 15.1 Add authentication middleware to revenue analytics routes
    - Verify JWT token
    - Check admin role
    - Return 401/403 for unauthorized access
    - _Requirements: 9.3_
  
  - [ ] 15.2 Add route protection on frontend
    - Redirect non-admin users to unauthorized page
    - Show loading state during auth check
    - _Requirements: 9.3_

- [ ] 16. Final integration and polish
  - [ ] 16.1 Add responsive design for mobile devices
    - Stack summary cards vertically on small screens
    - Make tables horizontally scrollable
    - Ensure chart resizes appropriately
    - _Design: Responsive Design section_
  
  - [ ] 16.2 Add accessibility features
    - Add ARIA labels to charts and tables
    - Ensure keyboard navigation works
    - Verify color contrast for profit/loss indicators
    - _Design: Accessibility section_
  
  - [ ]* 16.3 Write integration tests for complete workflows
    - Test: Load page → Apply filters → View data → Export
    - Test: Error handling across the full stack
    - Test: Real-time updates with actual database

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Backend implementation comes first to ensure APIs are ready for frontend
- The OtherExpense, FeedSale, and FeedPurchase models need to be created as they don't exist yet
- Existing models (Transport, EmployeePayment, FarmerPayment, Delivery) will be used for aggregation
- Feed Stock Management integration adds two new data sources: Feed Sales to Farmers (revenue) and Feed Stock Purchases (expense)
