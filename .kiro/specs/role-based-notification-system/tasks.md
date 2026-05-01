# Implementation Plan: Role-Based Notification System

## Overview

This implementation plan breaks down the role-based notification system into incremental coding tasks. The approach follows a bottom-up strategy: starting with backend data models and API endpoints, then building frontend components, and finally integrating everything together. Each task builds on previous work to ensure continuous progress and early validation.

## Tasks

- [x] 1. Create UserNotification data model and database indexes
  - Create new UserNotification model in `backend/src/models/UserNotification.model.js`
  - Define schema with user, notification, isRead, readAt, and timestamps fields
  - Add compound indexes for efficient queries: (user, isRead, createdAt) and (user, createdAt)
  - Add index on createdBy field in existing Notification model
  - _Requirements: 5.1, 5.2, 9.4_

- [ ]* 1.1 Write property test for UserNotification model
  - **Property 1: Notification persistence**
  - **Validates: Requirements 5.1**

- [x] 2. Implement notification service layer
  - [x] 2.1 Create NotificationService class in `backend/src/services/notification.service.js`
    - Implement resolveTargetUsers() to map role selections to user lists
    - Implement role exclusion logic (exclude admin and milk_collector)
    - Handle "all" recipient option correctly
    - _Requirements: 4.4, 1.2_

  - [ ]* 2.2 Write property test for role resolution
    - **Property 5: Role targeting correctness**
    - **Validates: Requirements 4.4**

  - [ ]* 2.3 Write property test for role exclusion
    - **Property 11: Role resolution exclusion**
    - **Validates: Requirements 1.2, 4.4**

  - [x] 2.4 Implement createNotificationForRoles() method
    - Create Notification document
    - Create UserNotification documents for all target users
    - Return notification ID and sent count
    - _Requirements: 4.4, 4.5, 5.1_

  - [x] 2.5 Implement getUserNotifications() method
    - Query UserNotifications with pagination
    - Populate notification details
    - Filter by 30-day window
    - Sort by createdAt descending
    - _Requirements: 5.2, 5.4, 3.3_

  - [x] 2.6 Implement getUnreadCount() method
    - Count UserNotifications where isRead is false
    - Use indexed query for performance
    - _Requirements: 2.1, 9.1_

  - [ ]* 2.7 Write property test for unread count accuracy
    - **Property 2: Badge count accuracy**
    - **Validates: Requirements 2.1, 2.2**

  - [x] 2.8 Implement markAsRead() method
    - Update UserNotification isRead to true
    - Set readAt timestamp
    - _Requirements: 6.1, 5.3_

  - [ ]* 2.9 Write property test for read status update
    - **Property 7: Read status update**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 2.10 Implement markAllAsRead() method
    - Update all UserNotifications for a user to isRead true
    - Return count of updated notifications
    - _Requirements: 6.4_

  - [ ]* 2.11 Write property test for mark all read
    - **Property 8: Mark all read completeness**
    - **Validates: Requirements 6.4**

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create notification API endpoints
  - [x] 4.1 Create notification routes in `backend/src/routes/notification.routes.js`
    - POST /api/notifications/send
    - GET /api/notifications
    - GET /api/notifications/unread-count
    - PATCH /api/notifications/:id/read
    - PATCH /api/notifications/mark-all-read
    - Add authentication middleware to all routes
    - Add role-based authorization (only milk_collector can send)
    - _Requirements: 4.1, 4.3_

  - [x] 4.2 Implement notification controller methods in `backend/src/controllers/notification.controller.js`
    - Implement sendNotification() - validate input, call service, return response
    - Implement getUserNotifications() - extract query params, call service
    - Implement getUnreadCount() - call service, return count
    - Implement markAsRead() - validate notification ID, call service
    - Implement markAllAsRead() - call service, return count
    - Add input validation for all endpoints
    - Add error handling with appropriate status codes
    - _Requirements: 4.3, 4.4, 5.2, 6.1, 6.4, 10.1, 10.2_

  - [ ]* 4.3 Write unit tests for input validation
    - Test empty title rejection
    - Test empty message rejection
    - Test empty recipients rejection
    - Test invalid role rejection
    - _Requirements: 4.3_

  - [ ]* 4.4 Write unit tests for authorization
    - Test only milk_collector can send notifications
    - Test other roles receive 403 Forbidden
    - _Requirements: 4.1_

- [ ] 5. Update Custom Updates page for notification sending
  - [ ] 5.1 Enhance DairyTime.jsx notification form
    - Update API endpoint to new `/api/notifications/send`
    - Update recipient options to match new role mapping (farmers, buyers, employees, all)
    - Add input validation before submission
    - Update success/error message handling
    - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.2_

  - [ ]* 5.2 Write unit tests for form validation
    - Test form submission with empty fields
    - Test form submission with no recipients selected
    - _Requirements: 4.3_

- [x] 6. Create NotificationBell component
  - [x] 6.1 Create NotificationBell component in `frontend/src/components/notification/NotificationBell.jsx`
    - Implement bell icon with lucide-react Bell icon
    - Add badge overlay for unread count
    - Implement polling mechanism (every 30 seconds) for unread count
    - Add click handler to toggle dropdown
    - Add loading and error states
    - Handle API unavailable state with disabled bell
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 10.3_

  - [ ]* 6.2 Write unit tests for NotificationBell
    - Test bell renders for target roles
    - Test bell does not render for excluded roles
    - Test badge displays correct count
    - Test badge displays "99+" for counts over 99
    - Test badge hidden when count is zero
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3_

  - [ ]* 6.3 Write property test for badge count display
    - **Property 3: Badge count upper bound display**
    - **Validates: Requirements 2.3**

- [x] 7. Create NotificationDropdown component
  - [x] 7.1 Create NotificationDropdown component in `frontend/src/components/notification/NotificationDropdown.jsx`
    - Implement dropdown container with absolute positioning
    - Fetch notifications when dropdown opens
    - Display loading state while fetching
    - Implement click-outside-to-close behavior
    - Add "Mark all as read" button
    - Display empty state when no notifications
    - Implement scrolling for long lists
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 6.3_

  - [ ]* 7.2 Write unit tests for NotificationDropdown
    - Test dropdown opens on bell click
    - Test dropdown closes on outside click
    - Test empty state displays correctly
    - Test "Mark all as read" button presence
    - _Requirements: 3.1, 3.2, 3.5, 6.3_

  - [ ]* 7.3 Write property test for dropdown closure
    - **Property 12: Notification dropdown closure**
    - **Validates: Requirements 3.2**

- [-] 8. Create NotificationItem component
  - [x] 8.1 Create NotificationItem component in `frontend/src/components/notification/NotificationItem.jsx`
    - Display notification title, message, sender, and timestamp
    - Implement relative time formatting (e.g., "2 hours ago")
    - Truncate messages over 100 characters with "..." and expand on click
    - Sanitize notification content to prevent XSS
    - Visual distinction between read and unread (background color, font weight)
    - Add click handler to mark as read
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 6.1_

  - [ ]* 8.2 Write property test for content sanitization
    - **Property 9: Notification content sanitization**
    - **Validates: Requirements 8.4**

  - [ ]* 8.3 Write property test for relative time format
    - **Property 13: Relative time format**
    - **Validates: Requirements 8.2**

  - [ ]* 8.4 Write unit tests for message truncation
    - Test messages under 100 chars display fully
    - Test messages over 100 chars are truncated
    - Test expand functionality works
    - _Requirements: 8.3_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Integrate NotificationBell into DashboardLayout
  - [x] 10.1 Update DashboardLayout component
    - Import NotificationBell component
    - Add NotificationBell to header between title and profile button
    - Conditionally render based on user role (exclude admin and milk_collector)
    - Pass user context to NotificationBell
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 10.2 Write integration tests for bell visibility
    - Test bell appears for farmer role
    - Test bell appears for buyer role
    - Test bell appears for delivery_boy employee role
    - Test bell does NOT appear for admin role
    - Test bell does NOT appear for milk_collector employee role
    - _Requirements: 1.1, 1.2_

- [ ] 11. Implement notification ordering
  - [ ] 11.1 Update getUserNotifications service method
    - Ensure notifications are sorted by createdAt descending
    - Add test to verify ordering
    - _Requirements: 3.3_

  - [ ]* 11.2 Write property test for notification ordering
    - **Property 4: Notification ordering**
    - **Validates: Requirements 3.3**

- [ ] 12. Implement 30-day time window filter
  - [ ] 12.1 Update getUserNotifications service method
    - Add filter for notifications created within past 30 days
    - Use Date comparison in MongoDB query
    - _Requirements: 5.4_

  - [ ]* 12.2 Write property test for time window
    - **Property 15: Notification retrieval time window**
    - **Validates: Requirements 5.4**

- [ ] 13. Implement pagination for notification list
  - [ ] 13.1 Update getUserNotifications API endpoint
    - Add page and limit query parameters
    - Return pagination metadata (total, hasMore)
    - Limit default to 20 notifications per page
    - _Requirements: 9.5_

  - [ ] 13.2 Update NotificationDropdown component
    - Implement "Load More" button
    - Handle pagination state
    - Append new notifications to existing list
    - _Requirements: 9.5_

  - [ ]* 13.3 Write property test for pagination limits
    - **Property: Pagination limit enforcement**
    - **Validates: Requirements 9.5**

- [ ] 14. Add error handling and user feedback
  - [ ] 14.1 Update NotificationBell component
    - Add error state for API failures
    - Display disabled bell with tooltip when API unavailable
    - Implement retry logic for failed requests
    - _Requirements: 10.3_

  - [ ] 14.2 Update NotificationDropdown component
    - Add error message display for failed notification fetch
    - Add "Retry" button for failed requests
    - _Requirements: 10.2_

  - [ ] 14.3 Update DairyTime component
    - Enhance success message display
    - Enhance error message display with actionable info
    - _Requirements: 10.1, 10.2_

- [ ] 15. Final checkpoint - Ensure all tests pass and integration works
  - Ensure all tests pass, ask the user if questions arise.
  - Verify end-to-end flow: send notification → receive → view → mark as read
  - Verify badge updates correctly after marking as read
  - Verify polling updates badge in real-time
  - Verify all role targeting scenarios work correctly

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows a bottom-up approach: backend → frontend → integration
- Polling mechanism provides near real-time updates without WebSocket complexity
- XSS prevention is critical - sanitize all user-generated content
- Database indexes are essential for performance with large notification volumes
