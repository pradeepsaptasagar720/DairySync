# Implementation Plan: OTP-Based Delivery Verification System

## Overview

This implementation plan breaks down the OTP-based delivery verification system into discrete, incremental coding tasks. The plan follows a bottom-up approach: building core services first, then controllers, then integrating with the existing delivery system, and finally adding UI components. Each task builds on previous work, with testing integrated throughout to catch errors early.

## Tasks

- [x] 1. Set up OTP database models and schemas
  - Create `backend/src/models/OTP.model.js` with fields: orderId, otpHash, expiresAt, verified, verifiedAt, verificationAttempts, resendCount, lastResendAt, smsStatus, locked
  - Create `backend/src/models/OTPLog.model.js` with fields: orderId, action, status, details, performedBy, timestamp
  - Create `backend/src/models/Rating.model.js` with fields: orderId, deliveryBoyId, buyerId, rating, comment, createdAt
  - Add TTL indexes for automatic cleanup (OTP: 30 days, OTPLog: 90 days)
  - Add compound indexes for efficient queries (orderId, deliveryBoyId + createdAt)
  - Add new fields to existing Delivery model: otpRequired, otpVerified, otpVerifiedAt, rated, ratingId
  - _Requirements: 2.3, 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ]* 1.1 Write unit tests for database models
  - Test OTP schema validation (required fields, data types)
  - Test Rating schema validation (rating range 1-5, comment max length 500)
  - Test TTL index configuration
  - Test uniqueness constraints (one OTP per order, one rating per order)
  - _Requirements: 12.1, 12.3, 12.4_

- [ ] 2. Implement OTP Service
  - [x] 2.1 Create `backend/src/services/otp.service.js` with core OTP operations
    - Implement `generateRandomOTP()` using crypto.randomInt(100000, 999999)
    - Implement `generateOTP(orderId)` to create OTP, hash with bcrypt, store in database with 10-minute expiry
    - Implement `verifyOTP(orderId, otp)` to validate OTP, check expiry, verify hash, update verified status
    - Implement `resendOTP(orderId)` to invalidate old OTP and generate new one
    - Implement `isExpired(expiresAt)` helper to check if OTP has expired
    - Add rate limiting: max 5 verification attempts, max 3 resends, 30-second cooldown between resends
    - _Requirements: 2.1, 2.2, 2.5, 3.1, 3.2, 3.6, 4.1, 4.2, 4.4, 4.6_

  - [ ]* 2.2 Write property test for OTP generation uniqueness
    - **Property 8: OTP uniqueness**
    - **Validates: Requirements 2.5**
    - Generate 100 random orders and verify no OTP collisions

  - [ ]* 2.3 Write property test for OTP expiration time
    - **Property 6: OTP expiration time**
    - **Validates: Requirements 2.2**
    - Generate random OTPs and verify expiration is always 10 minutes from creation

  - [ ]* 2.4 Write property test for verification attempt limiting
    - **Property 13: Verification attempt limiting**
    - **Validates: Requirements 3.6, 3.7**
    - Test that 5 failed attempts lock the OTP

  - [ ]* 2.5 Write property test for resend invalidation
    - **Property 14: Previous OTP invalidation on resend**
    - **Validates: Requirements 4.1**
    - Test that old OTP fails after resend

  - [ ]* 2.6 Write unit tests for OTP service edge cases
    - Test expired OTP rejection
    - Test invalid OTP rejection
    - Test resend cooldown enforcement
    - Test max resend attempts blocking
    - _Requirements: 3.4, 4.5, 4.6_

- [ ] 3. Implement SMS Service with Twilio integration
  - [x] 3.1 Create `backend/src/services/sms.service.js` for SMS operations
    - Install Twilio SDK: `npm install twilio`
    - Implement `sendOTP(mobile, otp, orderId)` to send OTP via Twilio
    - Implement `sendStatusUpdate(mobile, status, orderId)` for status notifications
    - Implement `formatMobileNumber(mobile)` to convert to E.164 format (+91XXXXXXXXXX)
    - Add retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
    - Add error handling with fallback messaging
    - Store Twilio config in environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
    - _Requirements: 2.4, 2.6, 10.1, 10.2, 10.3_

  - [ ]* 3.2 Write property test for SMS delivery
    - **Property 9: SMS delivery on OTP generation**
    - **Validates: Requirements 2.4**
    - Use mock SMS service to verify SMS is sent for all OTP generations

  - [ ]* 3.3 Write unit tests for SMS service
    - Test SMS sending with valid mobile number
    - Test SMS sending with invalid mobile number (error case)
    - Test mobile number formatting (E.164)
    - Test retry logic on transient failures
    - Test error handling and fallback
    - _Requirements: 2.4, 10.1, 10.2_

- [ ] 4. Implement Audit Service for OTP logging
  - [x] 4.1 Create `backend/src/services/audit.service.js` for audit logging
    - Implement `logOTPOperation(orderId, action, status, details)` to create audit logs
    - Implement `getOrderLogs(orderId)` to retrieve logs for an order
    - Implement `detectSuspiciousActivity(orderId)` to flag suspicious patterns
    - Add detection for: >5 failed attempts, >3 resends, rapid attempts (<5s apart)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.7_

  - [ ]* 4.2 Write property test for audit logging
    - **Property 29: OTP operation logging**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
    - Test that all OTP operations create audit logs

  - [ ]* 4.3 Write property test for suspicious activity detection
    - **Property 32: Suspicious activity detection**
    - **Validates: Requirements 9.7**
    - Test that excessive attempts trigger alerts

  - [ ]* 4.4 Write unit tests for audit service
    - Test log creation with all required fields
    - Test log retrieval with filtering
    - Test suspicious pattern detection
    - _Requirements: 9.1, 9.6, 9.7_

- [ ] 5. Checkpoint - Ensure all service tests pass
  - Run all unit tests and property tests for services
  - Verify database models are working correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 6. Implement OTP Controller
  - [x] 6.1 Create `backend/src/controllers/otp.controller.js` with API endpoints
    - Implement POST `/api/otp/generate` endpoint to generate OTP for an order
    - Implement POST `/api/otp/verify` endpoint to verify OTP entered by delivery boy
    - Implement POST `/api/otp/resend` endpoint to resend OTP to buyer
    - Implement GET `/api/otp/status/:orderId` endpoint to get OTP status
    - Add authentication middleware to all endpoints
    - Add input validation: orderId required, OTP must be 6 digits
    - Add error handling with user-friendly messages
    - Integrate with OTP service, SMS service, and audit service
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.8_

  - [ ]* 6.2 Write property test for OTP generation API
    - **Property 38: OTP generation API contract**
    - **Validates: Requirements 11.1**
    - Test API returns correct response structure for valid requests

  - [ ]* 6.3 Write property test for OTP verification API
    - **Property 39: OTP verification API contract**
    - **Validates: Requirements 11.2**
    - Test API returns correct response structure for valid requests

  - [ ]* 6.4 Write property test for API authentication
    - **Property 42: API authentication enforcement**
    - **Validates: Requirements 11.8**
    - Test all endpoints reject unauthenticated requests

  - [ ]* 6.5 Write unit tests for OTP controller
    - Test POST /api/otp/generate with valid orderId
    - Test POST /api/otp/generate with invalid orderId (400 error)
    - Test POST /api/otp/verify with correct OTP (200 success)
    - Test POST /api/otp/verify with incorrect OTP (400 error)
    - Test POST /api/otp/resend enforces cooldown
    - Test all endpoints require authentication (401 error)
    - _Requirements: 11.1, 11.2, 11.3, 11.8_

- [ ] 7. Implement Rating Controller
  - [ ] 7.1 Create `backend/src/controllers/rating.controller.js` with rating endpoints
    - Implement POST `/api/ratings/submit` endpoint to submit delivery rating
    - Implement GET `/api/ratings/delivery-boy/:deliveryBoyId` endpoint to get ratings for a delivery boy
    - Implement GET `/api/ratings/order/:orderId` endpoint to get rating for an order
    - Add validation: rating 1-5, comment max 500 chars, order must be completed
    - Add uniqueness check: one rating per order
    - Calculate average rating when retrieving delivery boy ratings
    - _Requirements: 11.6, 11.7, 8.4, 8.5, 8.7_

  - [ ]* 7.2 Write property test for rating submission
    - **Property 26: Rating data persistence**
    - **Validates: Requirements 8.4**
    - Test all rating fields are stored correctly

  - [ ]* 7.3 Write property test for one rating per order
    - **Property 27: One rating per order**
    - **Validates: Requirements 8.5**
    - Test duplicate ratings are rejected

  - [ ]* 7.4 Write property test for average rating calculation
    - **Property 28: Average rating calculation**
    - **Validates: Requirements 8.7**
    - Test average is calculated correctly for random rating sets

  - [ ]* 7.5 Write unit tests for rating controller
    - Test POST /api/ratings/submit with valid data (200 success)
    - Test POST /api/ratings/submit with invalid rating (400 error)
    - Test POST /api/ratings/submit duplicate rating (400 error)
    - Test GET /api/ratings/delivery-boy/:id returns correct average
    - _Requirements: 8.4, 8.5, 8.7_

- [ ] 8. Create API routes and integrate controllers
  - [x] 8.1 Create `backend/src/routes/otp.routes.js` for OTP endpoints
    - Define routes: POST /generate, POST /verify, POST /resend, GET /status/:orderId
    - Apply authentication middleware
    - Apply role-based access control (delivery boy only for verify)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.8_

  - [ ] 8.2 Create `backend/src/routes/rating.routes.js` for rating endpoints
    - Define routes: POST /submit, GET /delivery-boy/:id, GET /order/:id
    - Apply authentication middleware
    - Apply role-based access control (buyer only for submit)
    - _Requirements: 11.6, 11.7_

  - [x] 8.3 Register routes in `backend/src/app.js` or main server file
    - Add `app.use('/api/otp', otpRoutes)`
    - Add `app.use('/api/ratings', ratingRoutes)`
    - _Requirements: 11.1, 11.6_

- [ ] 9. Enhance existing Delivery Controller with OTP integration
  - [x] 9.1 Modify `backend/src/controllers/delivery.controller.js`
    - Update `updateDeliveryStatus` to trigger OTP generation when status changes to "Out for Delivery"
    - Update `updateDeliveryStatus` to verify OTP was validated before allowing "Completed" status
    - Add OTP service integration: call generateOTP() on "Out for Delivery" transition
    - Add SMS service integration: send OTP to buyer via SMS
    - Add audit logging: log all OTP operations
    - Add real-time notification: notify buyer when OTP is sent
    - Update status transition validation to enforce OTP verification for completion
    - _Requirements: 1.4, 2.1, 2.4, 3.2, 5.2_

  - [ ]* 9.2 Write property test for status progression enforcement
    - **Property 1: Status progression enforcement**
    - **Validates: Requirements 1.6, 1.7**
    - Test invalid transitions are rejected

  - [ ]* 9.3 Write property test for OTP generation on status change
    - **Property 5: OTP generation on status change**
    - **Validates: Requirements 2.1**
    - Test OTP is generated for all "Out for Delivery" transitions

  - [ ]* 9.4 Write property test for valid OTP verification
    - **Property 10: Valid OTP verification**
    - **Validates: Requirements 3.2**
    - Test correct OTP allows completion

  - [ ]* 9.5 Write integration tests for enhanced delivery flow
    - Test complete flow: Approved → Accepted → Out for Delivery (OTP sent) → Completed (OTP verified)
    - Test OTP verification required for completion
    - Test SMS sent when order goes out for delivery
    - Test real-time notifications sent to buyer
    - _Requirements: 1.3, 1.4, 2.1, 2.4, 3.2, 5.2_

- [ ] 10. Implement Notification Service enhancements
  - [ ] 10.1 Enhance `backend/src/services/deliveryNotification.service.js`
    - Update `notifyOrderStatusChange` to include OTP in "Out for Delivery" notifications
    - Add real-time push notification via Socket.IO for status changes
    - Add notification for rating enablement when order is completed
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 8.1_

  - [ ]* 10.2 Write property test for status change notifications
    - **Property 18: Status change notifications**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - Test notifications sent for all status changes

  - [ ]* 10.3 Write property test for real-time UI updates
    - **Property 19: Real-time UI updates**
    - **Validates: Requirements 5.5**
    - Test Socket.IO events are emitted for status changes

- [ ] 11. Checkpoint - Ensure all backend tests pass
  - Run all unit tests and property tests for controllers and services
  - Test API endpoints with Postman or similar tool
  - Verify database operations are working correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 12. Implement Delivery Boy UI for OTP entry
  - [x] 12.1 Create OTP entry modal component
    - Create `frontend/src/components/delivery/OTPEntryModal.jsx`
    - Add 6-digit numeric input field with auto-focus
    - Add "Verify OTP" button (enabled only when 6 digits entered)
    - Add "Resend OTP" button with cooldown timer
    - Display OTP expiration countdown timer
    - Display error messages for invalid/expired OTP
    - Display success message on successful verification
    - Add loading states for API calls
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 12.2 Enhance delivery boy order list page
    - Update `frontend/src/pages/employee/DeliveryRequests.jsx` or similar
    - Add "Accept Order" button for Approved orders
    - Add "Out for Delivery" button for Accepted orders
    - Add "Complete Delivery" button for Out for Delivery orders (opens OTP modal)
    - Update order status display with visual indicators
    - Add real-time status updates via Socket.IO
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 12.3 Integrate OTP modal with delivery flow
    - Call POST /api/delivery/update-status to change status to "Out for Delivery"
    - Open OTP modal when "Complete Delivery" is clicked
    - Call POST /api/otp/verify when "Verify OTP" is clicked
    - Call POST /api/otp/resend when "Resend OTP" is clicked
    - Update order status to "Completed" on successful verification
    - Close modal and refresh order list on success
    - _Requirements: 1.4, 1.5, 3.1, 3.2, 4.1_

  - [ ]* 12.4 Write unit tests for OTP entry modal
    - Test modal renders with correct elements
    - Test "Verify OTP" button enabled only with 6 digits
    - Test error message display on invalid OTP
    - Test success message display on valid OTP
    - Test resend cooldown timer
    - _Requirements: 6.2, 6.3, 6.4, 6.6, 6.7_

- [ ] 13. Implement Buyer UI for OTP display and tracking
  - [ ] 13.1 Create order tracking component
    - Create `frontend/src/components/buyer/OrderTracking.jsx`
    - Display delivery progress tracker: Approved → Accepted → Out for Delivery → Completed
    - Display current order status with timestamp
    - Display OTP prominently when order is "Out for Delivery"
    - Display OTP expiration countdown
    - Display "OTP expired" message when expired
    - Add real-time status updates via Socket.IO
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 5.4, 5.5_

  - [ ] 13.2 Enhance buyer order details page
    - Update `frontend/src/pages/buyer/OrderStatus.jsx` or similar
    - Integrate OrderTracking component
    - Display OTP when available
    - Add "Rate Delivery" button when order is completed
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1_

  - [ ]* 13.3 Write unit tests for order tracking component
    - Test progress tracker displays correct stages
    - Test OTP display when order is out for delivery
    - Test OTP expiration message display
    - Test real-time updates
    - _Requirements: 7.3, 7.4, 7.5, 5.5_

- [ ] 14. Implement Rating UI for buyers
  - [ ] 14.1 Create rating modal component
    - Create `frontend/src/components/rating/RatingModal.jsx` (may already exist, enhance if needed)
    - Display 1-5 star rating selector
    - Add optional comment text area (max 500 characters)
    - Add character counter for comment
    - Add "Submit Rating" button
    - Display thank you message on successful submission
    - Display error message if rating already submitted
    - _Requirements: 8.2, 8.3, 8.6_

  - [ ] 14.2 Integrate rating modal with buyer order page
    - Show "Rate Delivery" button only for completed orders
    - Open rating modal when button is clicked
    - Call POST /api/ratings/submit when rating is submitted
    - Disable rating button after submission
    - Display existing rating if already submitted
    - _Requirements: 8.1, 8.4, 8.5_

  - [ ]* 14.3 Write unit tests for rating modal
    - Test modal renders with star selector and comment field
    - Test character counter for comment
    - Test submit button calls API with correct data
    - Test thank you message display
    - Test duplicate rating prevention
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 15. Implement Admin Dashboard for OTP audit logs
  - [ ] 15.1 Create OTP audit log page
    - Create `frontend/src/pages/admin/OTPAuditLogs.jsx`
    - Display table of all OTP operations with columns: Order ID, Action, Status, Timestamp, Delivery Boy
    - Add filters: date range, order ID, delivery boy, action type
    - Add search functionality
    - Display suspicious activity alerts prominently
    - Add pagination for large datasets
    - _Requirements: 9.6, 9.7_

  - [ ] 15.2 Create delivery boy ratings page
    - Create `frontend/src/pages/admin/DeliveryBoyRatings.jsx`
    - Display list of delivery boys with average ratings
    - Display individual ratings for each delivery boy
    - Add sorting by average rating
    - Add date range filter
    - _Requirements: 8.7_

  - [ ] 15.3 Add navigation links in admin sidebar
    - Update `frontend/src/components/navigation/AdminSidebar.jsx`
    - Add "OTP Audit Logs" link
    - Add "Delivery Ratings" link
    - _Requirements: 9.6, 8.7_

- [ ] 16. Implement error handling and fallback mechanisms
  - [ ] 16.1 Add SMS failure fallback in OTP service
    - When SMS fails, display OTP directly in delivery boy's app
    - Add "Show OTP to Buyer" button in delivery boy UI
    - Log SMS failures for admin review
    - Send admin notification on SMS service failure
    - _Requirements: 10.1, 10.2, 10.7_

  - [ ] 16.2 Add database retry logic
    - Implement retry wrapper for database operations
    - Retry up to 3 times with exponential backoff
    - Log failures after all retries exhausted
    - _Requirements: 10.3_

  - [ ] 16.3 Add network failure queuing
    - Implement offline queue for OTP verification requests
    - Retry queued requests when connection restored
    - Display "Verifying OTP..." message during retry
    - _Requirements: 10.4_

  - [ ] 16.4 Add admin override for OTP verification
    - Create admin endpoint POST /api/otp/admin-override
    - Require mandatory reason for override
    - Log all override operations
    - Send notification to admins
    - _Requirements: 10.5_

  - [ ]* 16.5 Write property test for error message formatting
    - **Property 36: User-friendly error messages**
    - **Validates: Requirements 10.6**
    - Test error messages don't contain stack traces

  - [ ]* 16.6 Write property test for SMS failure fallback
    - **Property 33: SMS failure fallback**
    - **Validates: Requirements 10.1, 10.2**
    - Test fallback OTP display when SMS fails

  - [ ]* 16.7 Write unit tests for error handling
    - Test SMS failure fallback
    - Test database retry logic
    - Test network failure queuing
    - Test admin override functionality
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 17. Add environment configuration
  - [x] 17.1 Update `.env.example` with Twilio configuration
    - Add TWILIO_ACCOUNT_SID
    - Add TWILIO_AUTH_TOKEN
    - Add TWILIO_PHONE_NUMBER
    - Add OTP_EXPIRY_MINUTES (default: 10)
    - Add OTP_MAX_ATTEMPTS (default: 5)
    - Add OTP_MAX_RESENDS (default: 3)
    - Add OTP_RESEND_COOLDOWN_SECONDS (default: 30)
    - _Requirements: 2.2, 3.6, 4.4, 4.6_

  - [ ] 17.2 Create configuration service
    - Create `backend/src/config/otp.config.js`
    - Load all OTP-related configuration from environment variables
    - Provide defaults for optional settings
    - Validate required settings on startup
    - _Requirements: 2.2, 3.6, 4.4, 4.6_

- [ ] 18. Final checkpoint - End-to-end testing
  - [ ] 18.1 Test complete delivery workflow with OTP
    - Admin assigns order to delivery boy
    - Delivery boy accepts order
    - Delivery boy marks out for delivery
    - Verify OTP is generated and SMS is sent
    - Delivery boy enters correct OTP
    - Verify order is marked as completed
    - Buyer rates the delivery
    - Verify rating is stored and average is updated
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.4, 3.2, 8.4, 8.7_

  - [ ] 18.2 Test error scenarios
    - Test expired OTP rejection
    - Test invalid OTP rejection
    - Test max verification attempts locking
    - Test max resend attempts blocking
    - Test SMS failure fallback
    - Test network failure recovery
    - _Requirements: 3.4, 3.6, 3.7, 4.5, 10.1, 10.4_

  - [ ] 18.3 Test audit logging
    - Verify all OTP operations are logged
    - Verify suspicious activity detection
    - Verify admin can view and filter logs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 9.7_

  - [ ] 18.4 Test real-time notifications
    - Verify buyer receives notifications for all status changes
    - Verify UI updates in real-time without refresh
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ] 18.5 Performance testing
    - Test OTP generation performance (target: <100ms)
    - Test OTP verification performance (target: <50ms)
    - Test concurrent OTP operations (100 concurrent generations)
    - _Requirements: 2.1, 3.1_

  - [ ] 18.6 Security testing
    - Verify OTPs are stored as bcrypt hashes
    - Verify OTPs are not logged in plain text
    - Verify rate limiting prevents brute force
    - Verify authentication on all endpoints
    - _Requirements: 2.3, 3.6, 11.8_

- [ ] 19. Documentation and deployment preparation
  - [ ] 19.1 Create API documentation
    - Document all OTP endpoints with request/response examples
    - Document all rating endpoints
    - Document error codes and messages
    - Create Postman collection for testing

  - [ ] 19.2 Create user guide
    - Document delivery boy workflow with screenshots
    - Document buyer tracking and rating workflow
    - Document admin audit log usage

  - [ ] 19.3 Create deployment checklist
    - Set up Twilio account and get credentials
    - Configure environment variables
    - Run database migrations
    - Test SMS delivery in production
    - Set up monitoring and alerting

- [x] 20. Enhancement: Backend Terminal Logging for OTP Operations
  - [x] 20.1 Add console logging to OTP service
    - Update `backend/src/services/otp.service.js`
    - Add formatted console.log when OTP is generated: display order ID, OTP value (for debugging), expiration time
    - Add formatted console.log when OTP is verified: display order ID, verification result (success/failure), timestamp
    - Use clear formatting with separators or colors (e.g., console colors library or emoji markers)
    - Include context information: delivery boy ID, buyer mobile number (last 4 digits only)
    - _Requirements: Developer debugging and monitoring_

  - [x] 20.2 Add console logging to OTP controller
    - Update `backend/src/controllers/otp.controller.js`
    - Add console.log in generateOTP endpoint: log request received, OTP generation result, SMS status
    - Add console.log in verifyOTP endpoint: log verification attempt, result, order status update
    - Add console.log in resendOTP endpoint: log resend request, new OTP generation, resend count
    - Format logs with clear labels and structure for easy reading in terminal
    - _Requirements: API request tracking and debugging_

  - [ ]* 20.3 Write unit tests for logging functionality
    - Test that console.log is called with correct parameters during OTP generation
    - Test that console.log is called with correct parameters during OTP verification
    - Use jest.spyOn to verify logging calls
    - _Requirements: Ensure logging doesn't break functionality_

- [x] 21. Enhancement: Frontend Popup Notification After OTP Generation
  - [x] 21.1 Add toast notification library (if not already present)
    - Install react-toastify or similar library: `npm install react-toastify`
    - Configure ToastContainer in main app component
    - Import toast styles in main CSS
    - _Requirements: User feedback mechanism_

  - [x] 21.2 Update OTP entry modal with success notification
    - Update `frontend/src/components/delivery/OTPEntryModal.jsx`
    - Add toast notification when OTP is successfully generated and sent
    - Display message: "OTP sent to buyer successfully"
    - Show OTP expiration time in the notification (e.g., "Valid for 10 minutes")
    - If SMS fails, show fallback notification with the OTP value: "SMS failed. OTP: {otp}. Please share with buyer."
    - Use success toast for successful SMS, warning toast for SMS failure
    - _Requirements: Delivery boy confirmation and user experience_

  - [x] 21.3 Update delivery status update flow with notification
    - Update delivery boy order list page (e.g., `frontend/src/pages/employee/DeliveryRequests.jsx`)
    - When "Out for Delivery" button is clicked and OTP is generated, show toast notification
    - Display notification before opening OTP entry modal
    - Include order ID in notification for clarity
    - _Requirements: Immediate feedback on status change_

  - [ ]* 21.4 Write unit tests for toast notifications
    - Test that toast is displayed when OTP generation succeeds
    - Test that toast shows correct message and expiration time
    - Test that warning toast is shown when SMS fails
    - Mock toast library to verify calls
    - _Requirements: Ensure notifications work correctly_

- [ ] 22. Checkpoint - Test enhancements end-to-end
  - Test backend terminal logging by generating and verifying OTPs
  - Verify logs appear in backend console with clear formatting
  - Test frontend toast notifications by marking orders as "Out for Delivery"
  - Verify success and failure notifications display correctly
  - Ensure enhancements don't break existing functionality
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end workflows
- The implementation follows a bottom-up approach: services → controllers → UI
- All OTP operations are logged for security and debugging
- SMS integration uses Twilio but can be swapped for other providers
- Real-time updates use Socket.IO (existing in the codebase)
- The system is designed to be backward compatible with existing delivery workflow
