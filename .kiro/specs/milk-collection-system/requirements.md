# Requirements Document

## Introduction

The Milk Collection System is a comprehensive dairy workflow management feature that enables efficient milk collection, farmer identification, automatic rate calculation, receipt generation, and real-time tracking. The system replaces existing milk collection features with a role-ready design optimized for dairy operations.

## Glossary

- **Milk_Collection_System**: The complete milk collection workflow management system integrated with employee dashboard
- **Employee_Session**: Time-based collection periods (Morning/Evening) tracked by employee
- **Rate_Chart**: Admin-configured pricing matrix based on milk type and fat percentage
- **Receipt_Generator**: Automated receipt creation and printing system
- **Farmer_Record**: Individual farmer's milk collection data entry with employee tracking
- **Collection_Summary**: Real-time aggregated statistics for current session and employee
- **Employee_Role**: Specific job function (milk_collector, delivery_boy, loan_feed_manager) that determines access permissions

## Requirements

### Requirement 1: Session Management and Page Header

**User Story:** As a milk collector, I want to manage collection sessions with automatic date/time tracking, so that I can organize milk collection by time periods.

#### Acceptance Criteria

1. WHEN the page loads, THE Milk_Collection_System SHALL display today's date automatically
2. WHEN a user selects a session, THE Milk_Collection_System SHALL provide Morning and Evening options
3. WHEN the page loads, THE Milk_Collection_System SHALL display current time automatically
4. THE Milk_Collection_System SHALL display dairy name in readonly format
5. WHEN session data is displayed, THE Milk_Collection_System SHALL prevent manual editing of auto-filled fields

### Requirement 2: Farmer Identification and Data Fetching

**User Story:** As a milk collector, I want to identify farmers using ID or mobile number and automatically fetch their details, so that I can quickly process milk entries.

#### Acceptance Criteria

1. WHEN a user enters farmer ID or mobile number, THE Milk_Collection_System SHALL accept manual input
2. WHEN a user clicks fetch button, THE Milk_Collection_System SHALL retrieve farmer data from database
3. WHEN farmer data is fetched, THE Milk_Collection_System SHALL auto-fill farmer name in readonly format
4. IF farmer ID is not found, THEN THE Milk_Collection_System SHALL display appropriate error message
5. WHEN farmer name is displayed, THE Milk_Collection_System SHALL prevent manual editing

### Requirement 3: Milk Entry and Rate Calculation

**User Story:** As a milk collector, I want to enter milk quantities with automatic rate and amount calculation, so that I can process collections efficiently.

#### Acceptance Criteria

1. WHEN a user enters cow milk quantity, THE Milk_Collection_System SHALL accept numeric input in litres
2. WHEN a user enters cow milk fat percentage, THE Milk_Collection_System SHALL accept numeric input
3. WHEN milk type and fat percentage are provided, THE Milk_Collection_System SHALL fetch rate from Rate_Chart automatically
4. WHEN quantity and rate are available, THE Milk_Collection_System SHALL calculate amount using formula: Amount = Quantity × Rate
5. WHEN a user enters buffalo milk quantity, THE Milk_Collection_System SHALL accept numeric input in litres
6. WHEN a user enters buffalo milk fat percentage, THE Milk_Collection_System SHALL accept numeric input
7. WHEN both cow and buffalo amounts are calculated, THE Milk_Collection_System SHALL display grand total automatically

### Requirement 4: Record Saving and Validation

**User Story:** As a milk collector, I want to save milk collection records with validation, so that I can ensure data accuracy and completeness.

#### Acceptance Criteria

1. WHEN a user clicks save button, THE Milk_Collection_System SHALL validate all required fields
2. WHEN validation passes, THE Milk_Collection_System SHALL store complete record in database
3. WHEN record is saved successfully, THE Milk_Collection_System SHALL generate receipt automatically
4. WHEN save operation completes, THE Milk_Collection_System SHALL clear input fields for next entry
5. IF validation fails, THEN THE Milk_Collection_System SHALL display specific error messages

### Requirement 5: Receipt Generation and Management

**User Story:** As a milk collector, I want automatic receipt generation with print and download options, so that I can provide farmers with collection proof.

#### Acceptance Criteria

1. WHEN a record is saved, THE Receipt_Generator SHALL create formatted receipt automatically
2. WHEN receipt is generated, THE Receipt_Generator SHALL include dairy name, date, session, and time
3. WHEN receipt displays farmer information, THE Receipt_Generator SHALL show farmer ID and name
4. WHEN receipt shows milk details, THE Receipt_Generator SHALL display quantity, fat percentage, rate, and amount for both cow and buffalo milk
5. WHEN receipt is complete, THE Receipt_Generator SHALL show total amount prominently
6. WHEN receipt is displayed, THE Receipt_Generator SHALL provide print option
7. WHEN receipt is displayed, THE Receipt_Generator SHALL provide PDF download option

### Requirement 6: Records Table and History Tracking

**User Story:** As a milk collector, I want to view saved records in a session-wise table, so that I can track all collections for the current session.

#### Acceptance Criteria

1. WHEN records are saved, THE Milk_Collection_System SHALL display them in chronological table format
2. WHEN table is populated, THE Milk_Collection_System SHALL show serial number, date, session, farmer name
3. WHEN table displays milk data, THE Milk_Collection_System SHALL show cow quantity, cow fat, buffalo quantity, buffalo fat
4. WHEN table shows financial data, THE Milk_Collection_System SHALL display total amount for each record
5. WHEN new records are added, THE Milk_Collection_System SHALL auto-increment serial numbers
6. WHEN session changes, THE Milk_Collection_System SHALL filter records by selected session

### Requirement 7: Live Summary and Analytics

**User Story:** As a milk collector, I want real-time collection summary updates, so that I can monitor session progress and totals.

#### Acceptance Criteria

1. WHEN records are saved, THE Collection_Summary SHALL update total cow milk quantity automatically
2. WHEN records are saved, THE Collection_Summary SHALL update total buffalo milk quantity automatically
3. WHEN fat percentages are recorded, THE Collection_Summary SHALL calculate and display average fat percentage
4. WHEN amounts are calculated, THE Collection_Summary SHALL update total session amount automatically
5. WHEN summary is displayed, THE Collection_Summary SHALL show current session (Morning/Evening)
6. WHEN new records are added, THE Collection_Summary SHALL refresh all statistics immediately

### Requirement 8: Data Structure and Storage

**User Story:** As a system administrator, I want structured data storage for milk collection records, so that data can be retrieved and analyzed effectively.

#### Acceptance Criteria

1. WHEN records are stored, THE Milk_Collection_System SHALL save date in YYYY-MM-DD format
2. WHEN session data is stored, THE Milk_Collection_System SHALL record session as Morning or Evening
3. WHEN farmer data is stored, THE Milk_Collection_System SHALL save farmer ID and name
4. WHEN milk data is stored, THE Milk_Collection_System SHALL save quantity, fat, rate, and amount for each milk type
5. WHEN total is calculated, THE Milk_Collection_System SHALL store grand total amount
6. WHEN data structure is created, THE Milk_Collection_System SHALL ensure all fields are properly typed and validated

### Requirement 9: Employee Role-Based Access Control

**User Story:** As a system administrator, I want role-based access control for the milk collection page integrated with the employee dashboard, so that only authorized employee roles can access collection features.

#### Acceptance Criteria

1. WHEN an employee with milk_collector role accesses the page, THE Milk_Collection_System SHALL provide full access to all features
2. WHEN an employee with delivery_boy role attempts access, THE Milk_Collection_System SHALL deny access and show warning popup "Access denied. You are authorized only for Delivery Requests."
3. WHEN an employee with loan_feed_manager role attempts access, THE Milk_Collection_System SHALL deny access and show warning popup "You are not authorized to access this page."
4. WHEN an admin accesses the page, THE Milk_Collection_System SHALL provide view, edit, and delete permissions
5. WHEN unauthorized access is attempted, THE Milk_Collection_System SHALL redirect to appropriate employee landing page
6. WHEN a milk_collector employee logs in, THE Milk_Collection_System SHALL be their default landing page
7. THE Milk_Collection_System SHALL integrate with employee authentication tokens for role validation

### Requirement 11: Employee Dashboard Integration

**User Story:** As a milk collector employee, I want the milk collection page to integrate seamlessly with the employee dashboard, so that I can access my work efficiently through the employee authentication system.

#### Acceptance Criteria

1. WHEN a milk_collector employee logs in through employee authentication, THE Milk_Collection_System SHALL be accessible as their primary landing page
2. WHEN the page loads for an employee, THE Milk_Collection_System SHALL display the employee's name and ID in the header
3. WHEN milk entries are saved, THE Milk_Collection_System SHALL record the collecting employee's information automatically
4. WHEN employee session expires, THE Milk_Collection_System SHALL redirect to employee login page
5. THE Milk_Collection_System SHALL use employee authentication tokens for all API requests
6. WHEN employee navigation is used, THE Milk_Collection_System SHALL integrate with employee sidebar navigation
7. THE Milk_Collection_System SHALL maintain employee session state across page refreshes

### Requirement 10: Rate Chart Integration

**User Story:** As a milk collector, I want automatic rate fetching based on milk type and fat percentage, so that pricing is consistent and accurate.

#### Acceptance Criteria

1. WHEN milk type is cow and fat percentage is provided, THE Milk_Collection_System SHALL fetch corresponding rate from Rate_Chart
2. WHEN milk type is buffalo and fat percentage is provided, THE Milk_Collection_System SHALL fetch corresponding rate from Rate_Chart
3. WHEN rate is not found for given parameters, THE Milk_Collection_System SHALL display appropriate error message
4. WHEN rate is fetched successfully, THE Milk_Collection_System SHALL display rate in readonly format
5. WHEN rate changes in Rate_Chart, THE Milk_Collection_System SHALL use updated rates for new calculations

### Requirement 12: Session-Based Milk Availability Display

**User Story:** As a buyer, I want to see current session milk availability only, so that I can place orders based on what's actually available in the current collection session.

#### Acceptance Criteria

1. WHEN buyer dashboard displays milk availability, THE system SHALL show only current session milk collection (Morning OR Evening)
2. WHEN dairy is open, THE system SHALL update session availability as employees collect milk in real-time
3. WHEN dairy is closed, THE system SHALL show empty availability (0L for all milk types)
4. WHEN a new session starts, THE system SHALL reset availability to 0L and update only as milk is collected in that session
5. THE system SHALL display cow milk session total, buffalo milk session total, and session grand total separately
6. THE system SHALL show current session name (Morning/Evening) in the display
7. THE system SHALL match exactly with employee's current session collection data
8. THE system SHALL NOT carry over availability from previous sessions

### Requirement 13: Order Quantity Validation Against Availability

**User Story:** As a buyer, I want to be prevented from ordering more milk than is available in the current session, so that I can only place realistic orders.

#### Acceptance Criteria

1. WHEN a buyer enters order quantity for cow milk, THE system SHALL validate against current session cow milk availability
2. WHEN a buyer enters order quantity for buffalo milk, THE system SHALL validate against current session buffalo milk availability
3. WHEN order quantity exceeds available quantity, THE system SHALL display popup message "Insufficient milk available. Available: [X]L, Requested: [Y]L"
4. WHEN validation fails, THE system SHALL prevent order submission until quantity is reduced
5. WHEN order quantity is within available limits, THE system SHALL allow order to proceed
6. THE system SHALL perform validation in real-time as user changes quantity
7. THE system SHALL update validation as milk availability changes during the session

### Requirement 14: Mixed Milk Feature Removal

**User Story:** As a buyer, I want a simplified milk ordering experience with only cow and buffalo options, so that I can choose from the two primary milk types available.

#### Acceptance Criteria

1. THE system SHALL remove "Mixed" or "Both" milk type option from order placement interface
2. THE system SHALL remove mixed milk rate calculations from all order processing
3. THE system SHALL remove mixed milk rate display from buyer dashboard
4. WHEN buyer views milk rates, THE system SHALL show only cow milk rate and buffalo milk rate
5. WHEN buyer places order, THE system SHALL accept only "cow" or "buffalo" as valid milk types
6. THE system SHALL remove any mixed milk references from order history and receipts
7. THE system SHALL update API endpoints to reject mixed milk type orders