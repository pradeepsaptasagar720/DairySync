# Requirements Document

## Introduction

The Milk Deduction System Debug feature addresses critical issues in the dairy management system where milk quantities are not properly deducting when orders are placed and not restoring when orders are cancelled. This comprehensive debugging and fixing system ensures reliable real-time milk availability updates, proper backend-frontend synchronization, and robust error handling for the order placement workflow.

## Glossary

- **Milk_Deduction_System**: The complete system responsible for reducing available milk quantities when orders are placed and restoring them when orders are cancelled
- **Backend_Server**: The Node.js/Express server that processes orders and calculates milk availability
- **Frontend_State**: React component state that displays milk availability to buyers
- **Order_Placement_Flow**: The complete workflow from order creation to milk quantity deduction
- **Real_Time_Updates**: Immediate reflection of milk quantity changes without page reload
- **Session_Availability**: Current session milk quantities available for ordering (Morning/Evening)
- **Order_Status_Sync**: Synchronization between order status changes and milk availability updates
- **Diagnostic_System**: Comprehensive system health checking and issue identification tools
- **Refresh_Mechanism**: Frontend callback system that updates milk availability after order operations

## Requirements

### Requirement 1: System Diagnostic and Health Check

**User Story:** As a system administrator, I want comprehensive diagnostic tools to identify why milk deduction is not working, so that I can quickly pinpoint and resolve the root cause.

#### Acceptance Criteria

1. WHEN diagnostic tools are run, THE Diagnostic_System SHALL check backend server status and connectivity
2. WHEN server status is checked, THE Diagnostic_System SHALL verify all required API endpoints are responding
3. WHEN database connectivity is tested, THE Diagnostic_System SHALL confirm milk calculation functions are working
4. WHEN frontend state is analyzed, THE Diagnostic_System SHALL verify refresh mechanisms are properly configured
5. IF backend server is not running, THEN THE Diagnostic_System SHALL provide clear instructions to start the server
6. WHEN API endpoints are tested, THE Diagnostic_System SHALL validate milk availability calculation accuracy
7. WHEN refresh functions are tested, THE Diagnostic_System SHALL confirm callback mechanisms are working

### Requirement 2: Backend Server Verification and Startup

**User Story:** As a system administrator, I want to ensure the backend server is running and properly configured, so that milk deduction calculations can be processed.

#### Acceptance Criteria

1. WHEN server status is checked, THE Backend_Server SHALL respond to health check requests within 2 seconds
2. WHEN milk calculation API is called, THE Backend_Server SHALL return accurate session-based availability data
3. WHEN orders are placed, THE Backend_Server SHALL include "Pending" status orders in milk reservation calculations
4. WHEN server is not running, THE system SHALL provide automated startup instructions and verification
5. WHEN database connection is tested, THE Backend_Server SHALL confirm successful connection to MongoDB
6. WHEN API endpoints are validated, THE Backend_Server SHALL return proper response formats for all milk-related operations
7. WHEN server logs are checked, THE Backend_Server SHALL show no critical errors in milk calculation functions

### Requirement 3: Order Placement to Milk Deduction Flow Verification

**User Story:** As a buyer, I want milk quantities to immediately decrease when I place an order, so that I can see real-time availability updates.

#### Acceptance Criteria

1. WHEN a buyer places an order, THE Order_Placement_Flow SHALL create order with "Pending" status immediately
2. WHEN order is created successfully, THE Milk_Deduction_System SHALL reduce available milk quantities by ordered amount
3. WHEN milk quantities are updated, THE Frontend_State SHALL reflect changes within 3 seconds without page reload
4. WHEN order placement completes, THE system SHALL trigger refresh callbacks to update dashboard
5. WHEN API calculates availability, THE system SHALL include all "Pending", "Approved", and "Out for Delivery" orders in reservations
6. WHEN multiple orders are placed rapidly, THE system SHALL handle concurrent updates without data corruption
7. WHEN order placement fails, THE system SHALL not deduct any milk quantities

### Requirement 4: Order Cancellation to Milk Restoration Flow

**User Story:** As a buyer, I want milk quantities to immediately increase when I cancel an order, so that the milk becomes available for other buyers.

#### Acceptance Criteria

1. WHEN a buyer cancels an order, THE Order_Status_Sync SHALL change order status to "Cancelled" immediately
2. WHEN order status changes to "Cancelled", THE Milk_Deduction_System SHALL restore milk quantities by cancelled amount
3. WHEN milk quantities are restored, THE Frontend_State SHALL reflect increases within 3 seconds without page reload
4. WHEN order cancellation completes, THE system SHALL trigger refresh callbacks to update all buyer dashboards
5. WHEN cancelled orders are calculated, THE system SHALL exclude them from milk reservation calculations
6. WHEN order cancellation fails, THE system SHALL maintain current milk quantities unchanged
7. WHEN multiple cancellations occur, THE system SHALL handle concurrent updates accurately

### Requirement 5: Real-Time Frontend State Management

**User Story:** As a buyer, I want the dashboard to show current milk availability without requiring page refreshes, so that I can make informed ordering decisions.

#### Acceptance Criteria

1. WHEN milk availability changes, THE Real_Time_Updates SHALL update frontend display within 3 seconds
2. WHEN refresh callbacks are triggered, THE Frontend_State SHALL fetch latest data from backend API
3. WHEN API responses are received, THE Frontend_State SHALL update React component state immediately
4. WHEN state updates occur, THE system SHALL force React re-renders to display new quantities
5. WHEN polling is active, THE system SHALL check for updates every 5 seconds automatically
6. WHEN manual refresh is triggered, THE system SHALL provide immediate feedback and update display
7. WHEN network errors occur, THE system SHALL retry refresh operations with exponential backoff

### Requirement 6: Backend Milk Calculation Accuracy

**User Story:** As a system administrator, I want accurate milk availability calculations that include all order statuses, so that buyers cannot over-order available milk.

#### Acceptance Criteria

1. WHEN calculating session availability, THE Backend_Server SHALL include milk collected in current session only
2. WHEN processing order reservations, THE Backend_Server SHALL subtract quantities for "Pending", "Approved", and "Out for Delivery" orders
3. WHEN orders are cancelled, THE Backend_Server SHALL exclude cancelled orders from reservation calculations
4. WHEN multiple milk types are ordered, THE Backend_Server SHALL calculate cow and buffalo availability separately
5. WHEN session transitions occur, THE Backend_Server SHALL reset availability calculations for new session
6. WHEN availability is calculated, THE Backend_Server SHALL ensure non-negative values (minimum 0L)
7. WHEN API responses are generated, THE Backend_Server SHALL include detailed breakdown of total, reserved, and available quantities

### Requirement 7: Error Handling and Recovery Mechanisms

**User Story:** As a buyer, I want clear error messages and automatic recovery when milk deduction fails, so that I understand what went wrong and can retry successfully.

#### Acceptance Criteria

1. WHEN backend server is unreachable, THE system SHALL display "Server unavailable. Please try again later." message
2. WHEN API requests fail, THE system SHALL retry up to 3 times with increasing delays
3. WHEN refresh mechanisms fail, THE system SHALL provide manual refresh button with clear feedback
4. WHEN order placement fails, THE system SHALL display specific error message from backend response
5. WHEN network connectivity is lost, THE system SHALL queue refresh requests for when connection is restored
6. WHEN JavaScript errors occur, THE system SHALL log detailed error information for debugging
7. WHEN system recovery is needed, THE system SHALL provide clear instructions for users and administrators

### Requirement 8: Comprehensive Logging and Monitoring

**User Story:** As a system administrator, I want detailed logging of all milk deduction operations, so that I can monitor system health and debug issues quickly.

#### Acceptance Criteria

1. WHEN orders are placed, THE system SHALL log order details, quantities, and calculation results
2. WHEN milk availability is calculated, THE system SHALL log session data, reservations, and final availability
3. WHEN refresh callbacks are triggered, THE system SHALL log callback execution and API response details
4. WHEN errors occur, THE system SHALL log error messages, stack traces, and system state information
5. WHEN API requests are made, THE system SHALL log request/response data with timestamps
6. WHEN state updates happen, THE system SHALL log previous and new state values for comparison
7. WHEN diagnostic tools run, THE system SHALL generate comprehensive health reports with all system metrics

### Requirement 9: Automated Testing and Validation

**User Story:** As a developer, I want automated tests that verify milk deduction functionality, so that I can ensure the system works correctly after fixes are applied.

#### Acceptance Criteria

1. WHEN tests are run, THE system SHALL verify backend server startup and API connectivity
2. WHEN order placement is tested, THE system SHALL confirm milk quantities decrease correctly
3. WHEN order cancellation is tested, THE system SHALL verify milk quantities restore properly
4. WHEN concurrent operations are tested, THE system SHALL ensure data consistency under load
5. WHEN API calculations are tested, THE system SHALL validate accuracy of milk availability formulas
6. WHEN frontend refresh is tested, THE system SHALL confirm callback mechanisms work correctly
7. WHEN end-to-end flow is tested, THE system SHALL verify complete order-to-deduction workflow

### Requirement 10: Performance Optimization and Reliability

**User Story:** As a buyer, I want fast and reliable milk quantity updates, so that I can place orders efficiently without delays or errors.

#### Acceptance Criteria

1. WHEN milk availability is requested, THE system SHALL respond within 500 milliseconds
2. WHEN orders are placed, THE system SHALL complete deduction calculations within 1 second
3. WHEN multiple users access simultaneously, THE system SHALL maintain response times under 2 seconds
4. WHEN refresh operations occur, THE system SHALL minimize API calls through intelligent caching
5. WHEN database queries are executed, THE system SHALL use optimized indexes for milk calculation queries
6. WHEN frontend updates happen, THE system SHALL batch state updates to prevent excessive re-renders
7. WHEN system load increases, THE system SHALL maintain functionality without degradation

### Requirement 11: Cross-Browser and Device Compatibility

**User Story:** As a buyer using different devices, I want milk deduction to work consistently across all browsers and devices, so that I can place orders from any platform.

#### Acceptance Criteria

1. WHEN using Chrome, Firefox, Safari, or Edge browsers, THE system SHALL function identically
2. WHEN accessing from mobile devices, THE system SHALL maintain full functionality and performance
3. WHEN JavaScript is disabled, THE system SHALL provide graceful degradation with clear messaging
4. WHEN network conditions are poor, THE system SHALL adapt refresh rates and provide offline indicators
5. WHEN browser storage is cleared, THE system SHALL re-establish functionality without errors
6. WHEN different screen sizes are used, THE system SHALL display milk availability clearly and accessibly
7. WHEN browser compatibility issues arise, THE system SHALL provide fallback mechanisms for core functionality

### Requirement 12: Data Consistency and Integrity

**User Story:** As a system administrator, I want to ensure milk quantity data remains consistent across all system components, so that buyers see accurate availability information.

#### Acceptance Criteria

1. WHEN orders are processed, THE system SHALL maintain ACID properties for all database transactions
2. WHEN concurrent updates occur, THE system SHALL use proper locking mechanisms to prevent race conditions
3. WHEN system failures happen, THE system SHALL recover to consistent state without data loss
4. WHEN milk calculations are performed, THE system SHALL validate input data and reject invalid values
5. WHEN session transitions occur, THE system SHALL ensure proper cleanup of previous session data
6. WHEN order status changes, THE system SHALL update all related calculations atomically
7. WHEN data inconsistencies are detected, THE system SHALL provide repair mechanisms and alerts