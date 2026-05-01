# Bugfix Requirements Document

## Introduction

The Admin Buyer Payments page (`frontend/src/pages/admin/BuyerPayments.jsx`) is experiencing 403 Forbidden errors because it calls an employee-specific endpoint (`/api/employee/payments/buyers`) that requires the `milk_collector` role. Admin users do not have this role, resulting in repeated authorization failures and preventing admins from viewing buyer payment data for profit and sales analysis.

This bugfix will create an admin-specific endpoint that provides the same buyer payment data without requiring the milk_collector role, ensuring admins can access the information they need for business analytics.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin user accesses the Buyer Payments page THEN the system makes API calls to `/api/employee/payments/buyers` which returns 403 Forbidden errors repeatedly

1.2 WHEN the frontend calls `/api/employee/payments/buyers` with admin credentials THEN the system rejects the request because the endpoint requires `milk_collector` role which admins don't possess

1.3 WHEN 403 errors occur THEN the system logs repeated error messages in the browser console and fails to display buyer payment data to admins

### Expected Behavior (Correct)

2.1 WHEN an admin user accesses the Buyer Payments page THEN the system SHALL call an admin-specific endpoint `/api/admin/buyer-payments` that returns buyer payment data without requiring milk_collector role

2.2 WHEN the frontend calls `/api/admin/buyer-payments` with admin credentials THEN the system SHALL successfully return all buyer purchases with payment details (payment amount, payment method, milk type, quantity, dates)

2.3 WHEN admins view the Buyer Payments page THEN the system SHALL display buyer payment information without any 403 Forbidden errors in the console

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an employee with milk_collector role accesses employee payment endpoints THEN the system SHALL CONTINUE TO enforce role-based access control for employee-specific endpoints

3.2 WHEN the system retrieves buyer payment data THEN the system SHALL CONTINUE TO use the Delivery model as the data source with all existing fields (milkType, quantity, rate, totalAmount, paymentMethod, paymentCompleted, paymentDate, status, buyer, handledBy)

3.3 WHEN buyer payment data is returned THEN the system SHALL CONTINUE TO maintain the same data structure and format as the existing `getBuyerPayments` function in the employee controller

3.4 WHEN non-admin users attempt to access admin endpoints THEN the system SHALL CONTINUE TO enforce admin role requirements and return appropriate authorization errors
