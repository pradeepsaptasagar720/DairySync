# Payment Status Fix Requirements

## Introduction

Fix the payment status display issue in the milk collector bill generation page where after processing a payment, the system still shows "Pay" option instead of correctly displaying "Paid" status.

## Glossary

- **Milk_Collector**: Employee who generates bills and processes payments for farmers
- **Payment_Status**: Current state of payment (paid, unpaid, pending, partially_paid)
- **Bill_Period**: Date range for which the bill is generated
- **Payment_History**: Record of all payments made by farmers
- **Farmer_Payment**: Individual payment record in the database

## Requirements

### Requirement 1: Accurate Payment Status Display

**User Story:** As a milk collector, I want to see the correct payment status immediately after processing a payment, so that I don't accidentally process duplicate payments.

#### Acceptance Criteria

1. WHEN a payment is successfully processed, THE System SHALL immediately update the payment status display to "Paid"
2. WHEN the payment status is refreshed, THE System SHALL accurately calculate the remaining amount based on all payments for the current bill period
3. WHEN a farmer has fully paid their bill, THE System SHALL display "Paid" status with a green checkmark
4. WHEN a farmer has partially paid their bill, THE System SHALL display the remaining amount and "Pay" button for the balance
5. WHEN payment history is fetched, THE System SHALL only consider payments that match the exact bill period dates

### Requirement 2: Real-time Payment Status Updates

**User Story:** As a milk collector, I want the payment status to update in real-time after processing payments, so that I can see accurate information without manual refresh.

#### Acceptance Criteria

1. WHEN a payment is processed, THE System SHALL automatically refresh the payment status within 2 seconds
2. WHEN payment status is being refreshed, THE System SHALL show a loading indicator on the refresh button
3. WHEN payment status refresh fails, THE System SHALL show an error message and allow manual retry
4. WHEN multiple payments are processed quickly, THE System SHALL handle concurrent status updates correctly

### Requirement 3: Payment Period Matching

**User Story:** As a milk collector, I want payments to be correctly matched to the bill period, so that payment status reflects only relevant payments.

#### Acceptance Criteria

1. WHEN fetching payment history, THE System SHALL filter payments by exact bill period dates (dateFrom and dateTo)
2. WHEN a payment is processed, THE System SHALL store the bill period information with the payment record
3. WHEN calculating payment status, THE System SHALL only sum payments that match the current bill period
4. WHEN bill period changes, THE System SHALL recalculate payment status for the new period

### Requirement 4: Payment Status State Management

**User Story:** As a milk collector, I want the payment status to be managed correctly in the application state, so that the UI reflects the actual payment state.

#### Acceptance Criteria

1. WHEN payment status is updated, THE System SHALL update both local state and display immediately
2. WHEN payment history is fetched, THE System SHALL correctly map farmer IDs to paid amounts
3. WHEN payment status calculation occurs, THE System SHALL handle edge cases like zero amounts and missing data
4. WHEN component re-renders, THE System SHALL maintain consistent payment status display

### Requirement 5: Error Handling and Recovery

**User Story:** As a milk collector, I want proper error handling for payment status updates, so that I can recover from temporary issues.

#### Acceptance Criteria

1. WHEN payment status refresh fails, THE System SHALL display a clear error message
2. WHEN network issues occur, THE System SHALL provide a manual refresh option
3. WHEN payment processing succeeds but status refresh fails, THE System SHALL still show success confirmation
4. WHEN payment data is inconsistent, THE System SHALL log errors and show fallback status