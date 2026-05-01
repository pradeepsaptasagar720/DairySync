# Requirements Document

## Introduction

Enhance the monthly milk collection comparison in the admin dashboard to provide the same detailed features as the yesterday vs today comparison. This will give administrators comprehensive insights into monthly performance trends with detailed breakdowns and visual indicators.

## Glossary

- **Monthly_Comparison**: Comparison between current month and previous month data
- **Admin_Dashboard**: The analytics dashboard for administrative users
- **Activity_Summary**: Detailed section showing side-by-side comparison with metrics
- **Change_Indicators**: Visual indicators showing increase/decrease with color coding
- **Collection_Data**: Milk collection statistics including cow, buffalo, and total
- **Sales_Data**: Milk sales/delivery statistics
- **Transport_Data**: Milk transport statistics
- **Previous_Month**: The month immediately before the current month
- **Current_Month**: The ongoing month

## Requirements

### Requirement 1: Monthly Data Fetching

**User Story:** As an admin, I want to view accurate monthly comparison data, so that I can analyze month-over-month performance trends.

#### Acceptance Criteria

1. WHEN the dashboard loads, THE System SHALL fetch current month's complete data from the backend
2. WHEN the dashboard loads, THE System SHALL fetch previous month's complete data from the backend
3. THE System SHALL calculate monthly data including collection, sales, and transport metrics
4. THE System SHALL handle cases where previous month data is not available
5. THE Monthly_Data SHALL include cow milk, buffalo milk, and total statistics

### Requirement 2: Enhanced Monthly Activity Summary

**User Story:** As an admin, I want to see a detailed monthly comparison summary similar to the yesterday vs today comparison, so that I can understand monthly performance changes at a glance.

#### Acceptance Criteria

1. THE System SHALL display a "Previous Month vs Current Month Comparison" section
2. THE Activity_Summary SHALL show side-by-side comparison with previous month and current month data
3. WHEN displaying monthly data, THE System SHALL show collection, sales, and transport metrics for each month
4. THE System SHALL use consistent styling with gray background for previous month and blue background for current month
5. THE Monthly_Summary SHALL be positioned after the yesterday vs today comparison section

### Requirement 3: Monthly Change Indicators

**User Story:** As an admin, I want to see visual change indicators for monthly comparisons, so that I can quickly identify improvements or declines in performance.

#### Acceptance Criteria

1. THE System SHALL calculate and display collection change between months
2. THE System SHALL calculate and display sales change between months  
3. THE System SHALL calculate and display transport change between months
4. WHEN a metric increases, THE Change_Indicators SHALL display in green color with a "+" prefix
5. WHEN a metric decreases, THE Change_Indicators SHALL display in red color with the negative value
6. THE Change_Indicators SHALL show the exact difference in liters for each metric

### Requirement 4: Monthly Statistics Integration

**User Story:** As an admin, I want monthly comparison data integrated into the system statistics, so that I have comprehensive monthly insights in one place.

#### Acceptance Criteria

1. THE System_Statistics SHALL include monthly change data for key metrics
2. THE Monthly_Change SHALL be displayed alongside other system statistics
3. THE System SHALL show monthly revenue comparison if available
4. THE Monthly_Statistics SHALL use the same color coding as other change indicators
5. THE System SHALL display monthly participant comparison (active farmers and buyers)

### Requirement 5: Backend Monthly Data Endpoints

**User Story:** As a system, I need proper backend endpoints for monthly data, so that accurate monthly comparisons can be displayed.

#### Acceptance Criteria

1. THE System SHALL provide an endpoint for current month reports
2. THE System SHALL provide an endpoint for previous month reports
3. THE Monthly_Reports SHALL include collection, sales, and transport data by milk type
4. THE Backend SHALL calculate monthly active participants (farmers and buyers)
5. THE System SHALL handle month boundary calculations correctly

### Requirement 6: Responsive Monthly Comparison Design

**User Story:** As an admin using different devices, I want the monthly comparison to be responsive, so that I can view monthly insights on any screen size.

#### Acceptance Criteria

1. THE Monthly_Comparison SHALL adapt to mobile, tablet, and desktop screen sizes
2. THE Side-by-side layout SHALL stack vertically on mobile devices
3. THE Monthly_Charts SHALL maintain readability on all screen sizes
4. THE Change_Indicators SHALL remain visible and properly formatted on small screens
5. THE Monthly_Summary SHALL use responsive grid layouts

### Requirement 7: Monthly Data Accuracy and Performance

**User Story:** As an admin, I want monthly comparisons to be accurate and load quickly, so that I can make informed decisions based on reliable data.

#### Acceptance Criteria

1. THE System SHALL use efficient database queries for monthly data aggregation
2. THE Monthly_Calculations SHALL be accurate for month boundaries and leap years
3. THE System SHALL cache monthly data appropriately to improve performance
4. THE Monthly_Comparison SHALL load within 3 seconds under normal conditions
5. THE System SHALL handle timezone considerations for monthly calculations

### Requirement 8: Monthly Comparison Error Handling

**User Story:** As an admin, I want graceful error handling for monthly comparisons, so that the dashboard remains functional even when monthly data is incomplete.

#### Acceptance Criteria

1. WHEN previous month data is unavailable, THE System SHALL display appropriate fallback messages
2. THE System SHALL show zero values for missing monthly data instead of errors
3. WHEN monthly calculations fail, THE System SHALL log errors and show default values
4. THE Monthly_Comparison SHALL not break the overall dashboard functionality
5. THE System SHALL provide informative messages when monthly data is being calculated