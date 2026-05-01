# Implementation Plan: Buyer-Delivery Communication and Ratings

## Overview

This implementation plan breaks down the buyer-delivery communication and ratings feature into logical, incremental tasks. The approach follows a bottom-up strategy: database models → backend API → frontend components → integration → testing. Each task builds on previous work to ensure a cohesive, working system at every checkpoint.

## Tasks

- [x] 1. Create database models for chat and ratings
  - [x] 1.1 Create ChatMessage model
    - Define schema with orderId, senderId, senderRole, senderName, message, isRead, createdAt fields
    - Add compound indexes for efficient queries (orderId + createdAt, orderId + isRead)
    - Add validation for message length (1-1000 chars) and required fields
    - _Requirements: 3.3, 14.1_
  
  - [x] 1.2 Create MilkQualityRating model
    - Define schema with orderId, buyerId, rating, comments, createdAt fields
    - Add unique constraint on orderId to prevent duplicate ratings
    - Add validation for rating value (1-5 integer) and comments length (max 500 chars)
    - Make createdAt immutable to prevent modification
    - Add indexes for efficient queries (createdAt, rating, buyerId)
    - _Requirements: 6.4, 6.6, 6.7, 13.1, 13.2_
  
  - [x] 1.3 Update Delivery model with chat and rating fields
    - Add chatEnabled boolean field (default true)
    - Add lastChatActivity date field
    - Add unreadMessagesCount object with buyer and deliveryBoy counters
    - Add milkQualityRated boolean field (default false)
    - Add milkQualityRatingId reference field
    - _Requirements: 3.1, 6.1_

- [x] 2. Implement chat backend API
  - [x] 2.1 Create chat controller with message operations
    - Implement POST /api/chat/messages endpoint for sending messages
    - Implement GET /api/chat/messages/:orderId endpoint for retrieving message history
    - Implement PUT /api/chat/messages/:orderId/read endpoint for marking messages as read
    - Implement GET /api/chat/unread-counts endpoint for fetching unread counts
    - Add authorization checks (buyers access own orders, delivery boys access assigned orders)
    - Add message validation (length, whitespace, sanitization)
    - Add rate limiting (30 messages per minute per user)
    - _Requirements: 3.3, 3.6, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 14.1, 14.2, 14.3, 14.4_
  
  - [ ]* 2.2 Write property test for chat authorization
    - **Property 12: Buyer chat authorization**
    - **Property 13: Delivery boy chat authorization**
    - **Property 14: Unauthorized access rejection**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [ ]* 2.3 Write property test for message validation
    - **Property 16: Message sanitization**
    - **Property 43: Message length validation**
    - **Property 44: Whitespace-only message rejection**
    - **Property 45: Whitespace trimming**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 5.5**
  
  - [x] 2.4 Create chat routes and wire to app
    - Create /api/chat routes file
    - Apply auth middleware and role middleware
    - Wire chat routes to main app.js
    - _Requirements: 18.2, 18.3_
  
  - [x] 2.5 Create chat service for business logic
    - Implement order access verification logic
    - Implement message history retrieval with pagination
    - Implement unread count calculation
    - Implement notification event emission for new messages
    - _Requirements: 5.1, 5.2, 18.5_

- [ ] 3. Checkpoint - Test chat API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement ratings backend API
  - [x] 4.1 Create rating controller with CRUD operations
    - Implement POST /api/ratings endpoint for submitting ratings
    - Implement GET /api/admin/ratings endpoint with filtering and pagination
    - Implement GET /api/admin/ratings/stats endpoint for performance metrics
    - Implement GET /api/admin/ratings/trends endpoint for trend analysis
    - Implement GET /api/admin/ratings/export endpoint for CSV export
    - Add authorization checks (buyers for own orders, admins for dashboard)
    - Add validation for rating value, comments length, duplicate prevention
    - Add time window validation (7 days after completion)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 8.1, 8.2, 8.3, 9.1, 10.1, 10.2, 11.1_
  
  - [ ]* 4.2 Write property test for rating validation
    - **Property 22: Rating value validation**
    - **Property 18: Comment length validation**
    - **Property 21: Rating uniqueness**
    - **Property 20: Time window validation**
    - **Validates: Requirements 6.3, 6.5, 6.6, 6.7**
  
  - [ ]* 4.3 Write property test for rating calculations
    - **Property 31: Average rating calculation**
    - **Property 32: Rating distribution sum**
    - **Property 33: Distribution percentage sum**
    - **Property 34: Filtered metrics accuracy**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.6**
  
  - [x] 4.4 Create rating routes and wire to app
    - Create /api/ratings routes file
    - Create /api/admin/ratings routes file
    - Apply auth middleware and role middleware
    - Wire rating routes to main app.js
    - _Requirements: 18.2, 18.3_
  
  - [x] 4.5 Create rating service for business logic
    - Implement rating submission validation logic
    - Implement metrics calculation (average, distribution)
    - Implement trend analysis calculation
    - Implement CSV export generation using existing csv.util.js
    - Implement low rating detection and highlighting logic
    - _Requirements: 10.1, 10.2, 10.3, 11.5, 12.1, 12.3, 12.4_
  
  - [x] 4.6 Create audit service for rating tracking
    - Implement audit log creation for rating submissions
    - Implement audit log creation for admin rating access
    - Use existing audit.service.js patterns
    - _Requirements: 13.4, 13.5_

- [ ] 5. Checkpoint - Test ratings API endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement buyer frontend components
  - [x] 6.1 Create CallButton component
    - Render phone icon button with tel: link
    - Accept phoneNumber, displayName, userRole, orderStatus props
    - Implement visibility logic (show for Accepted/Out for Delivery status)
    - Style with touch-friendly sizing (44x44px minimum)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 15.1_
  
  - [x] 6.2 Create ChatButton component
    - Render chat icon button with unread count badge
    - Accept orderId, unreadCount, onClick props
    - Style with touch-friendly sizing
    - _Requirements: 3.4, 4.6, 15.1_
  
  - [x] 6.3 Create ChatInterface component
    - Display message history in chronological order
    - Show sender name and timestamp for each message
    - Highlight unread messages
    - Provide message input field with character counter
    - Implement polling for new messages (every 3 seconds)
    - Mark messages as read when chat opens
    - Disable input for old completed orders (>24 hours)
    - Handle message submission with validation
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 14.5, 15.2, 16.1, 16.2_
  
  - [ ]* 6.4 Write unit tests for ChatInterface component
    - Test message display and ordering
    - Test unread indicator rendering
    - Test input validation and error messages
    - Test polling behavior
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 6.5 Create RatingModal component
    - Display 1-5 star rating interface
    - Provide optional comment textarea with 500 char limit
    - Validate rating before submission
    - Show success/error messages
    - Prevent duplicate submissions
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 14.5_
  
  - [ ]* 6.6 Write unit tests for RatingModal component
    - Test star rating selection
    - Test comment validation
    - Test duplicate prevention
    - Test error handling
    - _Requirements: 6.2, 6.3, 6.6_

- [x] 7. Implement delivery boy frontend components
  - [x] 7.1 Add CallButton to delivery boy active orders view
    - Import and render CallButton component
    - Pass buyer phone number and name
    - Show for Accepted/Out for Delivery orders
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 7.2 Add ChatButton to delivery boy active orders view
    - Import and render ChatButton component
    - Fetch and display unread count
    - Open ChatInterface on click
    - _Requirements: 3.5, 3.6_
  
  - [x] 7.3 Add ChatInterface to delivery boy view
    - Reuse ChatInterface component with delivery boy role
    - Implement same polling and read marking behavior
    - _Requirements: 3.2, 3.6, 4.5_

- [x] 8. Implement admin ratings dashboard
  - [x] 8.1 Create AdminRatingsDashboard page component
    - Create main dashboard layout with responsive design
    - Add navigation link in admin sidebar
    - Implement loading states and error handling
    - _Requirements: 7.1, 7.6, 15.3_
  
  - [x] 8.2 Create RatingsFilters sub-component
    - Implement date range filter with date pickers
    - Implement star rating multi-select filter
    - Implement buyer name search field
    - Implement "Clear Filters" button
    - Apply filters with debouncing (500ms)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6, 16.4_
  
  - [x] 8.3 Create RatingsList sub-component
    - Display ratings in table format with Order ID, Buyer name, rating, comments, date
    - Format star ratings with visual star icons
    - Implement pagination (20 per page)
    - Highlight low ratings (yellow for 3 stars, red for 1-2 stars)
    - Display filtered count
    - Sort by newest first
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 8.5, 12.1, 12.2_
  
  - [x] 8.4 Create PerformanceMetrics sub-component
    - Display average rating with 2 decimal places
    - Display total ratings count
    - Display rating distribution with bar chart
    - Show distribution as both counts and percentages
    - Display low ratings count for last 7 days
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 12.3_
  
  - [x] 8.5 Create TrendAnalysis sub-component
    - Display line chart with average rating over time
    - Implement time granularity selector (daily, weekly, monthly)
    - Implement custom date range selector
    - Calculate and display trend direction with visual indicators
    - Default to last 90 days
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [x] 8.6 Create ExportButton sub-component
    - Implement CSV export button
    - Generate CSV with Order ID, Buyer Name, Rating, Comments, Date columns
    - Apply current filters to export
    - Handle empty result sets
    - Use UTF-8 encoding
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 8.7 Write unit tests for admin dashboard components
    - Test filter application and clearing
    - Test pagination behavior
    - Test metrics calculation display
    - Test CSV export generation
    - _Requirements: 8.4, 8.5, 10.5, 16.4_

- [ ] 9. Checkpoint - Test frontend components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integrate communication features into buyer order status page
  - [x] 10.1 Add CallButton to buyer OrderStatus page
    - Import and render CallButton component
    - Pass delivery boy phone number and name
    - Show based on order status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 10.2 Add ChatButton to buyer OrderStatus page
    - Import and render ChatButton component
    - Fetch unread count from API
    - Open ChatInterface modal on click
    - _Requirements: 3.4, 4.6_
  
  - [x] 10.3 Add ChatInterface modal to buyer OrderStatus page
    - Implement modal/panel for ChatInterface
    - Pass orderId, currentUserId, currentUserRole props
    - Handle modal open/close state
    - _Requirements: 3.1, 3.2, 4.7_
  
  - [x] 10.4 Add RatingModal to buyer OrderStatus page
    - Show rating prompt for completed orders
    - Implement modal for RatingModal component
    - Handle rating submission success/error
    - Hide rating button after submission
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 11. Integrate communication features into delivery boy views
  - [x] 11.1 Update DeliveryRequests page with communication buttons
    - Add CallButton for each accepted order
    - Add ChatButton for each accepted order
    - _Requirements: 2.1, 2.3, 3.5_
  
  - [x] 11.2 Update DeliveryOverview page with communication buttons
    - Add CallButton for active orders
    - Add ChatButton for active orders
    - Implement ChatInterface modal
    - _Requirements: 2.1, 2.3, 3.5, 3.6_

- [x] 12. Implement notification integration
  - [x] 12.1 Emit notification events for new chat messages
    - Integrate with existing notification.service.js
    - Emit event when new message is sent
    - Include orderId and recipient userId in event
    - _Requirements: 18.5_
  
  - [x] 12.2 Update notification system to handle chat notifications
    - Add chat message notification type
    - Display notification in NotificationBell component
    - Link notification to chat interface
    - _Requirements: 18.5_

- [x] 13. Implement security and privacy measures
  - [x] 13.1 Add phone number masking in API responses
    - Ensure phone numbers are not exposed in chat API responses
    - Ensure phone numbers are not logged in server logs
    - _Requirements: 17.4_
  
  - [x] 13.2 Implement message encryption at rest
    - Configure database encryption for ChatMessage collection
    - Configure database encryption for MilkQualityRating collection
    - _Requirements: 17.2, 17.3_
  
  - [x] 13.3 Verify HTTPS for all API endpoints
    - Ensure all chat and rating endpoints use HTTPS
    - Verify secure session management
    - _Requirements: 17.1, 17.5_

- [ ] 14. Checkpoint - Test end-to-end flows
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 15. Write integration tests
  - [ ]* 15.1 Write end-to-end chat flow test
    - Test: Buyer sends message → Delivery boy receives → Delivery boy replies → Buyer receives
    - Verify message persistence and read status
    - _Requirements: 3.3, 3.6, 4.5_
  
  - [ ]* 15.2 Write end-to-end rating flow test
    - Test: Complete order → Submit rating → View in admin dashboard → Export CSV
    - Verify rating immutability
    - _Requirements: 6.4, 7.2, 9.2, 13.1_
  
  - [ ]* 15.3 Write property test for message ordering
    - **Property 7: Chronological message ordering**
    - **Validates: Requirements 4.1**
  
  - [ ]* 15.4 Write property test for CSV export
    - **Property 28: CSV export completeness**
    - **Property 29: CSV column completeness**
    - **Property 30: CSV format validity**
    - **Validates: Requirements 9.2, 9.3, 9.4**

- [ ] 16. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical breaks
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses JavaScript/TypeScript as specified in the design document
- All components follow existing project patterns (models in backend/src/models, controllers in backend/src/controllers, etc.)
- Chat uses polling approach (3 second intervals) instead of WebSockets for simplicity
- Rating system enforces immutability to maintain data integrity
- Admin dashboard provides comprehensive filtering, metrics, and export capabilities
