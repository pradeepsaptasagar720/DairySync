# Requirements Document: OTP-Based Delivery Verification System

## Introduction

This document specifies the requirements for an enhanced delivery workflow system with OTP verification for a dairy management application. The system transforms the current simple accept/cancel workflow into a multi-step delivery process with secure OTP-based completion verification, similar to real-world delivery applications. The system ensures that milk deliveries are completed only when the buyer provides a valid OTP to the delivery boy, with comprehensive status tracking, real-time notifications, and a post-delivery rating system.

## Glossary

- **Delivery_Boy**: An employee responsible for delivering milk orders to buyers
- **Buyer**: A customer who orders milk and receives deliveries
- **Admin**: System administrator who assigns orders to delivery boys
- **Order**: A milk purchase request from a buyer
- **OTP_Generator**: The system component responsible for generating secure 6-digit one-time passwords
- **SMS_Service**: External service (Twilio) for sending OTP messages to buyers
- **Delivery_Status**: The current state of an order in the delivery workflow
- **OTP_Record**: Database entry containing OTP details for an order
- **Rating_System**: Component allowing buyers to rate completed deliveries
- **Notification_Service**: System component for sending real-time updates to users

## Requirements

### Requirement 1: Multi-Step Delivery Workflow

**User Story:** As a delivery boy, I want to progress through multiple delivery stages, so that I can track my delivery process from acceptance to completion.

#### Acceptance Criteria

1. WHEN an admin assigns an order to a delivery boy, THE Delivery_System SHALL set the order status to "Approved"
2. WHEN a delivery boy views their assigned orders, THE Delivery_System SHALL display all orders with status "Approved"
3. WHEN a delivery boy clicks "Accept Order", THE Delivery_System SHALL change the order status to "Accepted"
4. WHEN a delivery boy clicks "Out for Delivery" on an accepted order, THE Delivery_System SHALL change the order status to "Out for Delivery"
5. WHEN a delivery boy clicks "Complete Delivery" on an out-for-delivery order, THE Delivery_System SHALL prompt for OTP entry
6. THE Delivery_System SHALL enforce the status progression: Approved → Accepted → Out for Delivery → Completed
7. THE Delivery_System SHALL prevent status changes that skip intermediate steps

### Requirement 2: OTP Generation and Distribution

**User Story:** As a buyer, I want to receive an OTP when my order is out for delivery, so that I can securely verify delivery completion.

#### Acceptance Criteria

1. WHEN an order status changes to "Out for Delivery", THE OTP_Generator SHALL create a unique 6-digit numeric OTP
2. WHEN an OTP is generated, THE OTP_Generator SHALL set an expiration time of 10 minutes from creation
3. WHEN an OTP is generated, THE Delivery_System SHALL store the OTP with orderId, otp value, expiresAt timestamp, and verified status in the database
4. WHEN an OTP is generated, THE SMS_Service SHALL send the OTP to the buyer's registered mobile number
5. THE OTP_Generator SHALL ensure each OTP is cryptographically random and unique per order
6. WHEN an OTP is successfully sent, THE Delivery_System SHALL log the SMS delivery status

### Requirement 3: OTP Verification

**User Story:** As a delivery boy, I want to verify the buyer's OTP, so that I can complete the delivery securely.

#### Acceptance Criteria

1. WHEN a delivery boy enters an OTP, THE Delivery_System SHALL validate the OTP against the stored value for that order
2. WHEN an OTP matches and is not expired, THE Delivery_System SHALL mark the OTP as verified and change order status to "Completed"
3. WHEN an OTP does not match, THE Delivery_System SHALL display an error message "Invalid OTP" and allow retry
4. WHEN an OTP has expired, THE Delivery_System SHALL display an error message "OTP expired, please request a new one"
5. WHEN an OTP verification fails, THE Delivery_System SHALL log the failed attempt with timestamp and entered value
6. THE Delivery_System SHALL allow a maximum of 5 OTP verification attempts per order
7. WHEN maximum attempts are exceeded, THE Delivery_System SHALL lock OTP verification and notify the admin

### Requirement 4: OTP Resend Functionality

**User Story:** As a buyer, I want to request a new OTP if I didn't receive the first one, so that I can complete my delivery verification.

#### Acceptance Criteria

1. WHEN a delivery boy clicks "Resend OTP", THE OTP_Generator SHALL invalidate the previous OTP for that order
2. WHEN a delivery boy clicks "Resend OTP", THE OTP_Generator SHALL generate a new 6-digit OTP with a new 10-minute expiration
3. WHEN a new OTP is generated, THE SMS_Service SHALL send the new OTP to the buyer's mobile number
4. THE Delivery_System SHALL allow a maximum of 3 OTP resend requests per order
5. WHEN maximum resend attempts are exceeded, THE Delivery_System SHALL display an error message and require admin intervention
6. THE Delivery_System SHALL enforce a 30-second cooldown period between resend requests

### Requirement 5: Real-Time Status Updates for Buyers

**User Story:** As a buyer, I want to see real-time updates on my order status, so that I can track my delivery progress.

#### Acceptance Criteria

1. WHEN an order status changes to "Accepted", THE Notification_Service SHALL send a real-time notification to the buyer
2. WHEN an order status changes to "Out for Delivery", THE Notification_Service SHALL send a real-time notification to the buyer with the OTP
3. WHEN an order status changes to "Completed", THE Notification_Service SHALL send a real-time notification to the buyer
4. WHEN a buyer views their order details, THE Delivery_System SHALL display the current status with timestamp
5. THE Delivery_System SHALL update the buyer's UI in real-time when status changes occur without requiring page refresh

### Requirement 6: Delivery Boy UI for OTP Entry

**User Story:** As a delivery boy, I want a clear interface to enter the OTP, so that I can complete deliveries efficiently.

#### Acceptance Criteria

1. WHEN a delivery boy clicks "Complete Delivery", THE Delivery_System SHALL display an OTP entry modal
2. THE OTP entry modal SHALL contain a 6-digit input field with numeric keyboard on mobile devices
3. THE OTP entry modal SHALL display a "Verify OTP" button and a "Resend OTP" button
4. WHEN the delivery boy enters 6 digits, THE Delivery_System SHALL automatically enable the "Verify OTP" button
5. THE OTP entry modal SHALL display remaining time until OTP expiration
6. WHEN OTP verification succeeds, THE Delivery_System SHALL display a success message and close the modal
7. WHEN OTP verification fails, THE Delivery_System SHALL display an error message and keep the modal open for retry

### Requirement 7: Buyer UI for OTP Display and Tracking

**User Story:** As a buyer, I want to view my OTP and track delivery status, so that I can provide the OTP to the delivery boy when they arrive.

#### Acceptance Criteria

1. WHEN an order goes "Out for Delivery", THE Delivery_System SHALL display the OTP prominently in the buyer's order details page
2. THE Delivery_System SHALL display the OTP expiration time in the buyer's UI
3. WHEN a buyer views their active orders, THE Delivery_System SHALL show the current delivery status with visual indicators
4. THE Delivery_System SHALL display a delivery progress tracker showing: Approved → Accepted → Out for Delivery → Completed
5. WHEN an OTP expires, THE Delivery_System SHALL update the buyer's UI to indicate expiration and show "New OTP will be sent on request"

### Requirement 8: Post-Delivery Rating System

**User Story:** As a buyer, I want to rate my delivery experience, so that I can provide feedback on the delivery service.

#### Acceptance Criteria

1. WHEN an order status changes to "Completed", THE Delivery_System SHALL enable the rating option for the buyer
2. WHEN a buyer clicks "Rate Delivery", THE Delivery_System SHALL display a rating modal with 1-5 star options
3. THE rating modal SHALL include an optional text field for comments (maximum 500 characters)
4. WHEN a buyer submits a rating, THE Delivery_System SHALL store the rating with orderId, deliveryBoyId, rating value, comment, and timestamp
5. THE Delivery_System SHALL allow only one rating per completed order
6. WHEN a rating is submitted, THE Delivery_System SHALL display a thank you message and close the modal
7. THE Delivery_System SHALL calculate and display average ratings for each delivery boy in the admin dashboard

### Requirement 9: OTP Security and Audit Logging

**User Story:** As an admin, I want comprehensive logging of OTP operations, so that I can audit delivery verification activities and detect fraud.

#### Acceptance Criteria

1. WHEN an OTP is generated, THE Delivery_System SHALL log the event with orderId, timestamp, and delivery boy ID
2. WHEN an OTP is sent via SMS, THE Delivery_System SHALL log the SMS delivery status and timestamp
3. WHEN an OTP verification is attempted, THE Delivery_System SHALL log the attempt with orderId, entered OTP, result, and timestamp
4. WHEN an OTP is resent, THE Delivery_System SHALL log the resend event with reason and timestamp
5. THE Delivery_System SHALL store all OTP-related logs for a minimum of 90 days
6. WHEN an admin views audit logs, THE Delivery_System SHALL display all OTP operations with filtering by date, order, and delivery boy
7. THE Delivery_System SHALL alert admins when suspicious patterns are detected (e.g., excessive failed attempts)

### Requirement 10: Error Handling and Fallback Mechanisms

**User Story:** As a system administrator, I want robust error handling for OTP operations, so that delivery processes can continue even when issues occur.

#### Acceptance Criteria

1. WHEN SMS service is unavailable, THE Delivery_System SHALL log the error and display a fallback message to the delivery boy
2. WHEN SMS service fails, THE Delivery_System SHALL provide an option to display the OTP directly in the delivery boy's app for manual communication
3. WHEN database operations fail during OTP generation, THE Delivery_System SHALL retry up to 3 times before displaying an error
4. WHEN network connectivity is lost during OTP verification, THE Delivery_System SHALL queue the verification request and retry when connection is restored
5. IF OTP verification cannot be completed due to technical issues, THE Delivery_System SHALL provide an admin override option with mandatory reason logging
6. WHEN an error occurs, THE Delivery_System SHALL display user-friendly error messages without exposing technical details
7. THE Delivery_System SHALL send error notifications to admins for critical failures requiring intervention

### Requirement 11: Backend API Endpoints

**User Story:** As a developer, I want well-defined API endpoints for OTP operations, so that I can integrate the frontend with the backend services.

#### Acceptance Criteria

1. THE Delivery_System SHALL provide a POST endpoint `/api/delivery/generate-otp` that accepts orderId and returns OTP details
2. THE Delivery_System SHALL provide a POST endpoint `/api/delivery/verify-otp` that accepts orderId and otp and returns verification result
3. THE Delivery_System SHALL provide a POST endpoint `/api/delivery/resend-otp` that accepts orderId and generates a new OTP
4. THE Delivery_System SHALL provide a GET endpoint `/api/delivery/order-status/:orderId` that returns current order status and OTP details
5. THE Delivery_System SHALL provide a POST endpoint `/api/delivery/update-status` that accepts orderId and newStatus for status transitions
6. THE Delivery_System SHALL provide a POST endpoint `/api/ratings/submit` that accepts orderId, deliveryBoyId, rating, and comment
7. THE Delivery_System SHALL provide a GET endpoint `/api/ratings/delivery-boy/:deliveryBoyId` that returns average rating and all ratings
8. ALL API endpoints SHALL require authentication and validate user roles before processing requests
9. ALL API endpoints SHALL return appropriate HTTP status codes and error messages for invalid requests

### Requirement 12: Database Schema for OTP Records

**User Story:** As a developer, I want a well-structured database schema for OTP records, so that I can efficiently store and query OTP data.

#### Acceptance Criteria

1. THE Delivery_System SHALL create an OTP table with fields: id, orderId, otp, expiresAt, verified, createdAt, verifiedAt
2. THE Delivery_System SHALL create an OTPLog table with fields: id, orderId, action, status, details, timestamp
3. THE Delivery_System SHALL create a Rating table with fields: id, orderId, deliveryBoyId, buyerId, rating, comment, createdAt
4. THE Delivery_System SHALL enforce foreign key constraints between OTP records and orders
5. THE Delivery_System SHALL create indexes on orderId and expiresAt fields for efficient querying
6. THE Delivery_System SHALL automatically delete expired OTP records older than 30 days
7. THE Delivery_System SHALL ensure OTP values are stored securely (hashed or encrypted)
