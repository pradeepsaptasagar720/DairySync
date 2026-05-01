# Requirements Document

## Introduction

The Admin Revenue Analytics feature provides a comprehensive financial dashboard for administrators to monitor all revenue streams, expenses, and calculate profit/loss metrics. The system aggregates data from multiple payment sources (transported milk, employee salaries, farmer payments, buyer payments, other expenses, feed sales to farmers, and feed stock purchases) and provides filtering capabilities, visual representations, and export functionality for financial analysis.

## Glossary

- **Revenue_Analytics_System**: The complete financial analytics dashboard for administrators
- **Data_Aggregator**: Component responsible for fetching and combining financial data from multiple sources
- **Filter_Engine**: Component that applies date range, month, year, and custom period filters to financial data
- **Profit_Loss_Calculator**: Component that computes net collected amount, net paid amount, and profit/loss
- **Export_Service**: Component that generates PDF and Excel reports from financial data
- **Summary_Card**: UI component displaying a single financial metric
- **Trend_Chart**: Visual component showing profit/loss trends over time
- **Comparison_Engine**: Component that calculates period-over-period comparisons and percentage changes

## Requirements

### Requirement 1: Data Source Integration

**User Story:** As an admin, I want to see all financial data from different payment sources in one place, so that I can get a complete view of the dairy's finances.

#### Acceptance Criteria

1. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch the transported milk total amount from the Transport Milk records
2. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch employee salaries paid from the Employee Payment records
3. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch farmer payments total from the Farmer Payment records
4. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch buyer payments received from the Buyer Payment records
5. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch other expenses total from the Other Payments records
6. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch feed sales to farmers total from the Feed Sale records
7. WHEN the Revenue Analytics page loads, THE Data_Aggregator SHALL fetch feed stock purchases total from the Feed Purchase records
8. WHEN any data source is unavailable, THE Data_Aggregator SHALL handle the error gracefully and display zero for that category

### Requirement 2: Financial Calculations

**User Story:** As an admin, I want to see calculated financial metrics, so that I can understand the dairy's profitability.

#### Acceptance Criteria

1. WHEN financial data is loaded, THE Profit_Loss_Calculator SHALL compute Net Collected Amount as the sum of Transported Milk Amount, Buyer Payments Received, and Feed Sales to Farmers
2. WHEN financial data is loaded, THE Profit_Loss_Calculator SHALL compute Net Paid Amount as the sum of Farmer Payments, Employee Salaries, Other Expenses, and Feed Stock Purchases
3. WHEN Net Collected Amount and Net Paid Amount are computed, THE Profit_Loss_Calculator SHALL compute Profit/Loss as Net Collected Amount minus Net Paid Amount
4. WHEN Feed Sales to Farmers and Feed Stock Purchases are available, THE Profit_Loss_Calculator SHALL compute Feed Profit/Loss as Feed Sales to Farmers minus Feed Stock Purchases
5. WHEN Profit/Loss is positive, THE Revenue_Analytics_System SHALL display the value in green color
6. WHEN Profit/Loss is negative, THE Revenue_Analytics_System SHALL display the value in red color
7. WHEN Profit/Loss is zero, THE Revenue_Analytics_System SHALL display the value in neutral color

### Requirement 3: Date Range Filtering

**User Story:** As an admin, I want to filter financial data by date ranges, so that I can analyze specific time periods.

#### Acceptance Criteria

1. WHEN an admin selects a start date and end date, THE Filter_Engine SHALL retrieve only records within that date range
2. WHEN an admin selects a specific month, THE Filter_Engine SHALL retrieve records for that entire month
3. WHEN an admin selects a specific year, THE Filter_Engine SHALL retrieve records for that entire year
4. WHEN an admin applies a custom period filter, THE Filter_Engine SHALL retrieve records matching the custom criteria
5. WHEN filters are applied, THE Revenue_Analytics_System SHALL update all summary cards, calculations, and charts in real-time
6. WHEN an invalid date range is provided (end date before start date), THE Filter_Engine SHALL display an error message and prevent the query

### Requirement 4: Summary Display Components

**User Story:** As an admin, I want to see financial metrics displayed in clear summary cards, so that I can quickly understand key numbers.

#### Acceptance Criteria

1. THE Revenue_Analytics_System SHALL display a Summary_Card for Transported Milk Total Amount
2. THE Revenue_Analytics_System SHALL display a Summary_Card for Employee Salaries Paid
3. THE Revenue_Analytics_System SHALL display a Summary_Card for Farmer Payments Total
4. THE Revenue_Analytics_System SHALL display a Summary_Card for Buyer Payments Received
5. THE Revenue_Analytics_System SHALL display a Summary_Card for Other Expenses Total
6. THE Revenue_Analytics_System SHALL display a Summary_Card for Feed Sales to Farmers
7. THE Revenue_Analytics_System SHALL display a Summary_Card for Feed Stock Purchases
8. THE Revenue_Analytics_System SHALL display a Summary_Card for Net Collected Amount
9. THE Revenue_Analytics_System SHALL display a Summary_Card for Net Paid Amount
10. THE Revenue_Analytics_System SHALL display a Summary_Card for Feed Profit/Loss with color coding
11. THE Revenue_Analytics_System SHALL display a Summary_Card for Overall Profit/Loss with color coding
12. WHEN a Summary_Card displays currency values, THE Revenue_Analytics_System SHALL format them with appropriate currency symbols and decimal places

### Requirement 5: Trend Visualization

**User Story:** As an admin, I want to see profit/loss trends over time in a chart, so that I can identify patterns and make informed decisions.

#### Acceptance Criteria

1. WHEN financial data is loaded, THE Revenue_Analytics_System SHALL display a Trend_Chart showing profit/loss over the selected time period
2. WHEN the Trend_Chart displays data, THE Revenue_Analytics_System SHALL use green color for profit data points and red color for loss data points
3. WHEN an admin hovers over a data point, THE Trend_Chart SHALL display detailed information for that specific date
4. WHEN the selected filter changes, THE Trend_Chart SHALL update to reflect the new time period
5. WHEN there is no data for the selected period, THE Trend_Chart SHALL display an appropriate empty state message

### Requirement 6: Detailed Breakdown Tables

**User Story:** As an admin, I want to see detailed transaction breakdowns for each category, so that I can drill down into specific entries.

#### Acceptance Criteria

1. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Transported Milk transactions
2. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Employee Salary payments
3. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Farmer Payments
4. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Buyer Payments
5. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Other Expenses
6. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Feed Sales to Farmers
7. THE Revenue_Analytics_System SHALL display a detailed breakdown table for Feed Stock Purchases
8. WHEN displaying breakdown tables, THE Revenue_Analytics_System SHALL include date, description, amount, and payment method for each entry
9. WHEN a breakdown table has many entries, THE Revenue_Analytics_System SHALL implement pagination with configurable page size

### Requirement 7: Period Comparison

**User Story:** As an admin, I want to compare current period metrics with previous periods, so that I can track growth and identify trends.

#### Acceptance Criteria

1. WHEN financial data is displayed, THE Comparison_Engine SHALL calculate metrics for the previous equivalent period
2. WHEN current and previous period data are available, THE Comparison_Engine SHALL compute percentage change for each metric
3. WHEN percentage change is positive, THE Revenue_Analytics_System SHALL display it with an upward arrow and green color
4. WHEN percentage change is negative, THE Revenue_Analytics_System SHALL display it with a downward arrow and red color
5. WHEN previous period data is unavailable, THE Revenue_Analytics_System SHALL display "N/A" for comparison metrics

### Requirement 8: Export Functionality

**User Story:** As an admin, I want to export financial reports to PDF and Excel, so that I can share them with stakeholders or keep records.

#### Acceptance Criteria

1. WHEN an admin clicks the PDF export button, THE Export_Service SHALL generate a PDF report containing all summary cards, calculations, and the trend chart
2. WHEN an admin clicks the Excel export button, THE Export_Service SHALL generate an Excel file containing all financial data in tabular format
3. WHEN generating exports, THE Export_Service SHALL include the selected filter criteria in the report header
4. WHEN generating exports, THE Export_Service SHALL include the generation timestamp
5. WHEN an export is generated, THE Export_Service SHALL trigger a browser download with an appropriate filename
6. WHEN export generation fails, THE Revenue_Analytics_System SHALL display an error message to the admin

### Requirement 9: Navigation and Access Control

**User Story:** As an admin, I want easy access to the Revenue Analytics page from the admin sidebar, so that I can quickly navigate to financial reports.

#### Acceptance Criteria

1. THE Revenue_Analytics_System SHALL add a "Revenue Analytics" link to the Admin sidebar navigation
2. WHEN an admin clicks the "Revenue Analytics" link, THE Revenue_Analytics_System SHALL navigate to /admin/revenue-analytics
3. WHEN a non-admin user attempts to access /admin/revenue-analytics, THE Revenue_Analytics_System SHALL redirect them to an unauthorized page
4. WHEN the Revenue Analytics page is active, THE Revenue_Analytics_System SHALL highlight the corresponding sidebar link

### Requirement 10: Real-Time Data Updates

**User Story:** As an admin, I want financial data to update in real-time when filters change, so that I can explore different time periods efficiently.

#### Acceptance Criteria

1. WHEN an admin changes any filter, THE Revenue_Analytics_System SHALL fetch updated data without requiring a page reload
2. WHEN data is being fetched, THE Revenue_Analytics_System SHALL display loading indicators on affected components
3. WHEN data fetching completes, THE Revenue_Analytics_System SHALL update all summary cards, calculations, charts, and tables simultaneously
4. WHEN data fetching fails, THE Revenue_Analytics_System SHALL display an error message and retain the previous data
5. WHEN multiple filter changes occur rapidly, THE Revenue_Analytics_System SHALL debounce requests to prevent excessive API calls
