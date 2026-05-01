# Requirements Document

## Introduction

This specification defines the complete rebuild of the Loan and Feed Management page for employees with loan_and_feed_manager role. The new system focuses on analytics dashboards and comprehensive data management across three main sections: Loan Management, Feed Management, and Feed Stock Management.

## Glossary

- **Loan_Feed_Manager**: Employee with specialized role to manage farmer loans and feed supplies
- **Analytics_Dashboard**: Data visualization showing key metrics and trends
- **Loan_Request**: Farmer application for agricultural loans
- **Feed_Request**: Farmer request for feed supplies
- **Feed_Stock**: Available feed inventory with pricing
- **Farmer_History**: Complete transaction history for individual farmers
- **Dynamic_Analytics**: Real-time updating statistics based on approved transactions

## Requirements

### Requirement 1: Complete Page Rebuild

**User Story:** As a loan and feed manager, I want a completely rebuilt management page, so that I can access analytics-focused tools instead of the current tabbed interface.

#### Acceptance Criteria

1. THE System SHALL remove all existing features, components, UI elements, and business logic from the current page
2. THE System SHALL rebuild the page from scratch with only three main sections
3. THE System SHALL represent each section with main buttons for navigation
4. THE System SHALL provide analytics dashboards for total loans and feed sales
5. THE System SHALL update analytics dynamically based on approved loans and feed sales

### Requirement 2: Loan Section Management

**User Story:** As a loan and feed manager, I want comprehensive loan management tools, so that I can track loan requests, approvals, and farmer-specific loan histories.

#### Acceptance Criteria

1. THE Loan_Section SHALL contain exactly two main buttons for loan management
2. WHEN displaying the Loan Requests Button, THE System SHALL show total number of farmers who requested loans and total requested loan amount
3. WHEN the Loan Requests Button is clicked, THE System SHALL display a detailed list of individual farmer loan requests
4. FOR EACH loan request item, THE System SHALL display farmer name, requested loan amount, loan request date, and loan purpose
5. WHEN displaying the Approved Loans Button, THE System SHALL show total number of farmers with approved loans and total approved loan amount
6. WHEN the Approved Loans Button is clicked, THE System SHALL display a detailed list of individual approved loan records
7. FOR EACH approved loan item, THE System SHALL display farmer name, approved loan amount, approval date, and loan status (Approved/Active/Closed)

### Requirement 3: Loan History and Farmer Details

**User Story:** As a loan and feed manager, I want detailed loan history tracking, so that I can view comprehensive farmer-specific loan information and avoid incorrect duplication.

#### Acceptance Criteria

1. THE System SHALL display a Loan History section below the Loan Section
2. THE Loan_History SHALL show all approved loans with correct farmer tracking
3. WHEN the same farmer takes another loan, THE System SHALL update history correctly without incorrect duplication
4. THE System SHALL allow selecting a specific farmer from the Approved Loans section
5. WHEN a farmer is selected, THE System SHALL show a summary section with current pending loan amount and total lifetime loan amount received
6. THE System SHALL display detailed loan history below the summary showing loan records date-wise
7. FOR EACH loan record, THE System SHALL show loan date, loan amount, and loan status (Paid/Pending/Closed)
8. THE System SHALL provide loan filters for date range and specific farmer selection
9. THE System SHALL allow viewing complete loan history of a single farmer

### Requirement 4: Feed Section Management

**User Story:** As a loan and feed manager, I want comprehensive feed management tools, so that I can track feed requests, approvals, and feed sales analytics.

#### Acceptance Criteria

1. THE Feed_Section SHALL contain exactly two main buttons for feed management
2. WHEN displaying the New Feed Requests Button, THE System SHALL show total number of farmers requesting feed
3. WHEN the New Feed Requests Button is clicked, THE System SHALL display a list of individual feed requests
4. FOR EACH feed request item, THE System SHALL display farmer name, requested feed type, requested feed quantity, and requested feed total amount
5. WHEN displaying the Approved Feed Button, THE System SHALL show total number of approved farmers and total approved feed quantity
6. WHEN the Approved Feed Button is clicked, THE System SHALL display detailed records of approved feed allocations
7. FOR EACH approved feed item, THE System SHALL display farmer name, feed type, approved feed quantity, and feed amount

### Requirement 5: Feed Sales History and Analytics

**User Story:** As a loan and feed manager, I want detailed feed sales tracking, so that I can analyze feed sales patterns and farmer-specific purchase histories.

#### Acceptance Criteria

1. THE System SHALL display Feed Sales History below the Feed Section
2. THE Feed_Sales_History SHALL show analytics for total feed sold, total feed quantity sold, and number of farmers who bought feed
3. WHEN the same farmer buys feed again, THE System SHALL update history correctly without duplication
4. THE System SHALL allow selecting a specific farmer from feed records
5. WHEN a farmer is selected, THE System SHALL show a summary section with total feed quantity bought (lifetime) and total amount spent on feed
6. THE System SHALL display detailed feed purchase history showing number of times feed was purchased
7. FOR EACH feed purchase record, THE System SHALL show purchase date, feed type, feed quantity received, and feed amount
8. THE System SHALL provide feed filters for date range, farmer selection, and feed type
9. THE System SHALL maintain accurate farmer-specific feed purchase tracking

### Requirement 6: Feed Stock Management

**User Story:** As a loan and feed manager, I want to manage available feed stock and pricing, so that I can maintain accurate inventory and pricing information.

#### Acceptance Criteria

1. THE Feed_Stock_Section SHALL manage and display available feed stock information
2. THE System SHALL display all available feed stocks using a table or card layout
3. FOR EACH feed item, THE System SHALL show feed name (Cattle Feed, Poultry Feed, Mineral Mix, Calf Starter, etc.), available feed quantity, and feed price per kg
4. THE System SHALL allow updating existing feed stock records only (no new feed type creation)
5. THE System SHALL enable dynamic updates to feed quantity
6. THE System SHALL enable dynamic updates to feed price per kg
7. THE System SHALL maintain accurate stock levels based on approved feed allocations

### Requirement 7: Dynamic Analytics Dashboard

**User Story:** As a loan and feed manager, I want real-time analytics dashboards, so that I can monitor key performance indicators and make data-driven decisions.

#### Acceptance Criteria

1. THE System SHALL create data analysis dashboards for total loans provided
2. THE Loan_Analytics SHALL display number of farmers receiving loans and total loan amount provided
3. THE System SHALL create data analysis dashboards for total feed sold
4. THE Feed_Analytics SHALL display number of farmers buying feed and total feed quantity sold
5. THE Analytics SHALL update dynamically based on approved loans and feed sales
6. THE System SHALL ensure analytics reflect real-time data changes
7. THE System SHALL provide accurate farmer counting without duplication across multiple transactions

### Requirement 8: User Interface and Navigation

**User Story:** As a loan and feed manager, I want intuitive navigation and clear visual organization, so that I can efficiently manage loans and feed operations.

#### Acceptance Criteria

1. THE System SHALL organize the page into three distinct main sections
2. THE System SHALL use main buttons to represent each section's primary functions
3. THE System SHALL provide clear visual separation between Loan Section, Feed Section, and Feed Stock Section
4. THE System SHALL maintain consistent styling with the employee module theme (purple colors)
5. THE System SHALL ensure responsive design for various screen sizes
6. THE System SHALL provide loading states and error handling for all data operations
7. THE System SHALL include proper icons and visual indicators for different data types and statuses