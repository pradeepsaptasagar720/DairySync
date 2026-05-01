# Implementation Plan: Comprehensive Delivery Management System

## Overview

This implementation plan breaks down the delivery management system enhancement into discrete, incremental coding tasks. Each task builds on previous work and includes testing to validate functionality early. The plan maintains backward compatibility with existing order placement and delivery workflows while adding real-time tracking, notifications, ratings, earnings management, and comprehensive analytics.

## Tasks

- [x] 1. Set up database models and schemas
  - [x] 1.1 Create Rating model with validation
    - Create `backend/src/models/Rating.model.js`
    - Define schema with orderId (unique), buyerId, deliveryPersonId, stars (1-5), feedback, createdAt
    - Add indexes for efficient queries (deliveryPersonId, orderId)
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 1.2 Write property test for Rating model validation
    - **Property 14: Rating value validation**
    - **Validates: Requirements 4.2**
  
  - [x] 1.3 Create Earnings model
    - Create `backend/src/models/Earnings.model.js`
    - Define schema with deliveryPersonId, orderId (unique), amount, baseFee, distanceFee, distanceKm, calculatedAt, paidAt, paymentStatus
    - Add indexes for aggregation queries
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [ ]* 1.4 Write property test for Earnings calculation formula
    - **Property 80: Earnings formula correctness**
    - **Validates: Requirements 19.2**
  
  - [x] 1.5 Create GPS_Tracking model
    - Create `backend/src/models/GPSTracking.model.js`
    - Define schema with orderId, deliveryPersonId, location (GeoJSON Point), timestamp, accuracy
    - Add geospatial index (2dsphere) for location queries
    - Add TTL index to auto-delete data after 30 days
    - _Requirements: 16.3, 16.4_

  - [x] 1.6 Create Notification model
    - Create `backend/src/models/Notification.model.js`
    - Define schema with userId, type (enum), title, message, data, read, createdAt, channels
    - Add indexes for user queries and TTL index for 30-day retention
    - _Requirements: 17.1, 17.2_
  
  - [x] 1.7 Extend Delivery model with new optional fields
    - Update `backend/src/models/Delivery.model.js`
    - Add optional fields: deliveryPersonId, assignedAt, acceptedAt, outForDeliveryAt, completedAt, deliveryProofPhoto, distanceKm, estimatedDeliveryTime, rejectionReason, rejectedBy array
    - Ensure all new fields default to null for backward compatibility
    - _Requirements: 20.1, 20.2, 20.4_
  
  - [ ]* 1.8 Write property test for backward compatibility
    - **Property 85: Legacy order handling**
    - **Validates: Requirements 20.2, 20.3, 20.4**
  
  - [x] 1.9 Extend User model with delivery person fields
    - Update `backend/src/models/User.model.js`
    - Add availabilityStatus (boolean, default false), lastAvailabilityUpdate, deliveryStats object
    - _Requirements: 10.1, 10.4_

- [x] 2. Implement notification service
  - [x] 2.1 Create notification service module
    - Create `backend/src/services/notification.service.js`
    - Implement createNotification(userId, type, title, message, data, channels)
    - Implement sendInAppNotification, sendPushNotification (optional), sendSMS (optional)
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [ ]* 2.2 Write property test for notification creation
    - **Property 69: In-app notification creation**
    - **Validates: Requirements 17.1**
  
  - [x] 2.3 Implement notification triggers for order status changes
    - Add notification calls in delivery controller for status changes
    - Trigger notifications for: Approved, Out for Delivery, Completed, Cancelled
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ]* 2.4 Write property test for status change notifications
    - **Property 1: Order status change notifications**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.5**

- [x] 3. Implement distance calculation service
  - [x] 3.1 Create distance calculator module
    - Create `backend/src/services/distanceCalculator.service.js`
    - Implement calculateStraightLineDistance(coord1, coord2) using Haversine formula
    - Implement calculateRoadDistance(coord1, coord2) with Google Maps API (optional)
    - Implement estimateDeliveryTime(distanceKm) assuming 30 km/h average speed
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.6_
  
  - [ ]* 3.2 Write property test for distance calculation
    - **Property 7: Distance calculation accuracy**
    - **Validates: Requirements 2.5**
  
  - [ ]* 3.3 Write property test for delivery time estimation
    - **Property 78: Delivery time estimation**
    - **Validates: Requirements 18.6**

- [x] 4. Implement earnings calculation service
  - [x] 4.1 Create earnings calculator module
    - Create `backend/src/services/earningsCalculator.service.js`
    - Implement calculateEarnings(distanceKm) with configurable base fee and distance rate
    - Implement createEarningsRecord(deliveryPersonId, orderId, distanceKm)
    - Implement aggregateEarnings(deliveryPersonId, period) for daily/weekly/monthly
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [ ]* 4.2 Write property test for earnings calculation
    - **Property 79: Earnings calculation on completion**
    - **Validates: Requirements 19.1**
  
  - [ ]* 4.3 Write property test for earnings aggregation
    - **Property 82: Earnings aggregation by period**
    - **Validates: Requirements 19.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement smart order matching algorithm
  - [ ] 6.1 Create order matching service
    - Create `backend/src/services/orderMatching.service.js`
    - Implement getAvailableDeliveryPersons() to filter by availabilityStatus
    - Implement calculateDistancesToDairy(deliveryPersons, dairyLocation)
    - Implement selectNearestDeliveryPersons(deliveryPersons, count = 3)
    - Implement sendOrderAlerts(deliveryPersons, order)
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [ ]* 6.2 Write property test for available delivery person identification
    - **Property 62: Available delivery person identification**
    - **Validates: Requirements 15.1**
  
  - [ ]* 6.3 Write property test for distance-based prioritization
    - **Property 63: Distance-based prioritization**
    - **Validates: Requirements 15.2, 15.3**
  
  - [ ]* 6.4 Write property test for alert distribution
    - **Property 64: Alert distribution to nearest**
    - **Validates: Requirements 15.4**

- [ ] 7. Implement rating system backend
  - [ ] 7.1 Create rating controller and routes
    - Create `backend/src/controllers/rating.controller.js`
    - Implement submitRating(orderId, stars, feedback) with duplicate prevention
    - Implement getRatingsForDeliveryPerson(deliveryPersonId)
    - Implement calculateAverageRating(deliveryPersonId)
    - Create routes in `backend/src/routes/rating.routes.js`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 7.2 Write property test for duplicate rating prevention
    - **Property 17: Duplicate rating prevention**
    - **Validates: Requirements 4.5**
  
  - [ ]* 7.3 Write property test for average rating calculation
    - **Property 18: Average rating calculation**
    - **Validates: Requirements 4.6**
  
  - [ ] 7.4 Update User model with rating stats on each rating submission
    - Implement updateDeliveryPersonStats(deliveryPersonId) to update averageRating and totalRatings
    - Call after each rating submission
    - _Requirements: 4.6_

- [ ] 8. Implement delivery person availability management
  - [ ] 8.1 Create availability controller and routes
    - Create `backend/src/controllers/availability.controller.js`
    - Implement updateAvailability(deliveryPersonId, available)
    - Implement getAvailabilityStatus(deliveryPersonId)
    - Implement getAvailableDeliveryPersons() for admin
    - Create routes in `backend/src/routes/availability.routes.js`
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [ ]* 8.2 Write property test for availability persistence
    - **Property 39: Availability persistence**
    - **Validates: Requirements 10.4**
  
  - [ ]* 8.3 Write property test for availability-based order matching
    - **Property 38: Availability-based order matching**
    - **Validates: Requirements 10.2, 10.3**

- [ ] 9. Implement order accept/reject functionality
  - [ ] 9.1 Create order action controller
    - Update `backend/src/controllers/delivery.controller.js`
    - Implement acceptOrder(orderId, deliveryPersonId) to update status and assign delivery person
    - Implement rejectOrder(orderId, deliveryPersonId, reason) with reason validation
    - Implement cancelAlertsForOtherDeliveryPersons(orderId, acceptedDeliveryPersonId)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 9.2 Write property test for order acceptance
    - **Property 21: Order acceptance state transition**
    - **Validates: Requirements 6.1**
  
  - [ ]* 9.3 Write property test for rejection reason requirement
    - **Property 22: Rejection reason requirement**
    - **Validates: Requirements 6.2**
  
  - [ ]* 9.4 Write property test for order availability after rejection
    - **Property 24: Order availability after rejection**
    - **Validates: Requirements 6.5**

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement GPS tracking backend
  - [ ] 11.1 Set up WebSocket server
    - Install socket.io in backend
    - Create `backend/src/services/websocket.service.js`
    - Initialize WebSocket server with authentication
    - Implement connection handling and room management
    - _Requirements: 16.1, 16.2_
  
  - [ ] 11.2 Create GPS tracking controller
    - Create `backend/src/controllers/gpsTracking.controller.js`
    - Implement saveLocationUpdate(orderId, deliveryPersonId, location, timestamp)
    - Implement getTrackingHistory(orderId)
    - Implement getCurrentLocation(orderId)
    - _Requirements: 16.3, 16.4_
  
  - [ ]* 11.3 Write property test for GPS data persistence
    - **Property 66: GPS data persistence**
    - **Validates: Requirements 16.3**
  
  - [ ] 11.4 Implement real-time location broadcasting
    - Handle 'location:update' WebSocket event from delivery person
    - Calculate distance to destination and ETA
    - Broadcast 'location:updated' event to subscribed buyers
    - _Requirements: 2.2, 2.4, 16.4, 16.5_
  
  - [ ]* 11.5 Write property test for ETA calculation
    - **Property 68: ETA estimation**
    - **Validates: Requirements 16.5**
  
  - [ ] 11.6 Implement proximity notification
    - Check distance on each location update
    - Send proximity notification when within 500 meters
    - _Requirements: 2.4_
  
  - [ ]* 11.7 Write property test for proximity notification
    - **Property 6: Proximity notification triggering**
    - **Validates: Requirements 2.4**

- [ ] 12. Implement delivery proof upload
  - [ ] 12.1 Create file upload service
    - Create `backend/src/services/fileUpload.service.js`
    - Implement validateImageFile(file) for type and size validation
    - Implement uploadDeliveryProof(orderId, file) to store image
    - Use multer for file handling
    - _Requirements: 8.2, 8.3, 8.4_
  
  - [ ]* 12.2 Write property test for file type validation
    - **Property 27: Image file type validation**
    - **Validates: Requirements 8.2**
  
  - [ ]* 12.3 Write property test for file size validation
    - **Property 28: File size validation**
    - **Validates: Requirements 8.3**
  
  - [ ] 12.4 Add delivery proof endpoint to delivery controller
    - Implement uploadProof(orderId, file) endpoint
    - Update order with deliveryProofPhoto URL
    - Implement getDeliveryProof(orderId) with access control
    - _Requirements: 8.4, 8.5_
  
  - [ ]* 12.5 Write property test for optional delivery proof
    - **Property 31: Optional delivery proof handling**
    - **Validates: Requirements 8.6**

- [ ] 13. Implement earnings dashboard backend
  - [ ] 13.1 Create earnings controller and routes
    - Create `backend/src/controllers/earnings.controller.js`
    - Implement getEarningsSummary(deliveryPersonId, period) for daily/weekly/monthly
    - Implement getEarningsBreakdown(deliveryPersonId, startDate, endDate)
    - Implement getPaymentHistory(deliveryPersonId)
    - Create routes in `backend/src/routes/earnings.routes.js`
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ]* 13.2 Write property test for earnings aggregation
    - **Property 32: Earnings aggregation correctness**
    - **Validates: Requirements 9.1**
  
  - [ ] 13.3 Create performance metrics controller
    - Implement getPerformanceMetrics(deliveryPersonId)
    - Calculate acceptance rate, completion rate, average rating, total deliveries
    - _Requirements: 9.4, 9.5, 9.6, 9.7_
  
  - [ ]* 13.4 Write property test for performance rate calculations
    - **Property 35: Performance rate calculations**
    - **Validates: Requirements 9.4, 9.5**

- [ ] 14. Implement admin analytics backend
  - [ ] 14.1 Create delivery analytics service
    - Create `backend/src/services/deliveryAnalytics.service.js`
    - Implement getTotalDeliveries(period) for today/week/month
    - Implement getAverageDeliveryTime(startDate, endDate)
    - Implement getSuccessRate(startDate, endDate)
    - Implement getTopPerformers(limit)
    - Implement getTotalRevenue(period)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  
  - [ ]* 14.2 Write property test for delivery count aggregation
    - **Property 42: Delivery count aggregation**
    - **Validates: Requirements 11.1**
  
  - [ ]* 14.3 Write property test for success rate calculation
    - **Property 44: Success rate calculation**
    - **Validates: Requirements 11.3**
  
  - [ ] 14.2 Create admin analytics controller and routes
    - Create `backend/src/controllers/adminAnalytics.controller.js`
    - Implement getDeliveryAnalytics(startDate, endDate)
    - Implement getDeliveryPersonManagement()
    - Create routes in `backend/src/routes/adminAnalytics.routes.js`
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 15. Implement order monitoring backend
  - [ ] 15.1 Create order monitoring controller
    - Update `backend/src/controllers/delivery.controller.js`
    - Implement getActiveOrders(filters) for Pending/Approved/Out for Delivery
    - Implement getOrderElapsedTime(orderId)
    - Implement flagDelayedOrders(threshold = 30 minutes)
    - Implement reassignOrder(orderId, newDeliveryPersonId)
    - _Requirements: 13.1, 13.3, 13.4, 13.5, 13.6, 12.4, 12.5, 12.6_
  
  - [ ]* 15.2 Write property test for active order filtering
    - **Property 53: Active order filtering**
    - **Validates: Requirements 13.1**
  
  - [ ]* 15.3 Write property test for order reassignment
    - **Property 52: Order reassignment notification**
    - **Validates: Requirements 12.5, 12.6**

- [ ] 16. Implement rating management backend
  - [ ] 16.1 Create rating management controller
    - Create `backend/src/controllers/ratingManagement.controller.js`
    - Implement getAllRatings(filters) with delivery person, star value, date range filters
    - Implement getAverageRatingByDeliveryPerson()
    - Implement getLowRatings(threshold = 3)
    - Create routes in `backend/src/routes/ratingManagement.routes.js`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_
  
  - [ ]* 16.2 Write property test for rating filtering
    - **Property 59: Rating filtering correctness**
    - **Validates: Requirements 14.2, 14.3, 14.4**

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement order history backend enhancements
  - [ ] 18.1 Enhance order history controller
    - Update `backend/src/controllers/buyer.controller.js`
    - Implement getOrderHistory(buyerId, filters) with date range, status, search filters
    - Implement getOrderDetails(orderId) with full details including delivery person
    - Implement createReorder(orderId) to copy order data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_
  
  - [ ]* 18.2 Write property test for date range filtering
    - **Property 9: Date range filtering correctness**
    - **Validates: Requirements 3.2**
  
  - [ ]* 18.3 Write property test for status filtering
    - **Property 10: Status filtering correctness**
    - **Validates: Requirements 3.3**
  
  - [ ]* 18.4 Write property test for reorder data preservation
    - **Property 13: Reorder data preservation**
    - **Validates: Requirements 3.7**

- [ ] 19. Integrate order creation with new features
  - [ ] 19.1 Update order creation flow
    - Update `backend/src/controllers/buyer.controller.js` order creation
    - Calculate distance from dairy to delivery address
    - Store distance and estimated delivery time in order
    - Trigger smart order matching algorithm
    - Send notifications to nearest delivery persons
    - _Requirements: 18.1, 18.5, 18.6, 15.1, 15.4_
  
  - [ ]* 19.2 Write property test for order distance calculation
    - **Property 75: Order distance calculation**
    - **Validates: Requirements 18.1, 18.2**
  
  - [ ] 19.3 Update order completion flow
    - Update order completion in delivery controller
    - Calculate and create earnings record
    - Update delivery person stats
    - Send completion notification to buyer
    - Trigger rating prompt
    - _Requirements: 19.1, 19.5, 1.4_
  
  - [ ]* 19.4 Write property test for earnings on completion
    - **Property 79: Earnings calculation on completion**
    - **Validates: Requirements 19.1**

- [ ] 20. Implement inventory management integration
  - [ ] 20.1 Update order placement with inventory checks
    - Update order creation to check inventory before approval
    - Implement reserveInventory(quantity) on order approval
    - Implement deductInventory(quantity) on order completion
    - Implement releaseInventory(quantity) on order cancellation
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  
  - [ ]* 20.2 Write property test for inventory reservation
    - **Property 91: Inventory reservation on approval**
    - **Validates: Requirements 21.3**
  
  - [ ]* 20.3 Write property test for inventory release
    - **Property 92: Inventory release on cancellation**
    - **Validates: Requirements 21.5**

- [ ] 21. Implement buyer frontend components
  - [ ] 21.1 Create OrderTrackingMap component
    - Create `frontend/src/components/tracking/OrderTrackingMap.jsx`
    - Integrate Google Maps JavaScript API
    - Display delivery person location marker
    - Display delivery address marker
    - Show route between locations
    - Display ETA and distance remaining
    - Subscribe to WebSocket for real-time location updates
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [ ] 21.2 Create OrderHistoryPage component
    - Create `frontend/src/pages/buyer/OrderHistory.jsx`
    - Display paginated order list
    - Implement date range filter
    - Implement status filter
    - Implement search functionality
    - Add reorder button for each completed order
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_
  
  - [ ] 21.3 Create RatingModal component
    - Create `frontend/src/components/rating/RatingModal.jsx`
    - Display star rating input (1-5 stars)
    - Display optional feedback textarea
    - Implement rating submission
    - Show after order completion
    - Prevent duplicate ratings
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  
  - [ ] 21.4 Integrate real-time notifications in buyer UI
    - Update `frontend/src/components/notification/NotificationBell.jsx`
    - Subscribe to WebSocket for order status notifications
    - Display notification badge with unread count
    - Show notification dropdown with history
    - Mark notifications as read on view
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 22. Implement delivery person frontend components
  - [ ] 22.1 Create OrderAlertCard component
    - Create `frontend/src/components/delivery/OrderAlertCard.jsx`
    - Display order details (pickup, delivery, distance, earnings)
    - Show Accept and Reject buttons
    - Implement rejection reason modal
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3, 6.4_
  
  - [ ] 22.2 Create EarningsDashboard component
    - Create `frontend/src/pages/employee/EarningsDashboard.jsx`
    - Display earnings summary with period tabs (daily/weekly/monthly)
    - Show per-delivery earnings breakdown
    - Display payment history
    - Show performance metrics (acceptance rate, completion rate, average rating, total deliveries)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [ ] 22.3 Create AvailabilityToggle component
    - Create `frontend/src/components/delivery/AvailabilityToggle.jsx`
    - Display toggle switch for availability status
    - Update status on toggle
    - Show current status on load
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 22.4 Create DeliveryProofUpload component
    - Create `frontend/src/components/delivery/DeliveryProofUpload.jsx`
    - Display file input for photo upload
    - Validate file type (JPEG, PNG, WebP)
    - Validate file size (max 5MB)
    - Show preview before upload
    - Upload on order completion
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.6_
  
  - [ ] 22.5 Create NavigationButton component
    - Create `frontend/src/components/delivery/NavigationButton.jsx`
    - Generate Google Maps URL with delivery address coordinates
    - Open Google Maps on click
    - Display address as fallback if Maps unavailable
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ] 22.6 Implement GPS location tracking
    - Update delivery person UI to send location updates
    - Use browser Geolocation API to get current position
    - Send location updates via WebSocket every 30 seconds when order is "Out for Delivery"
    - Handle GPS errors gracefully
    - _Requirements: 16.1, 16.2_

- [ ] 23. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 24. Implement admin frontend components
  - [ ] 24.1 Create DeliveryAnalyticsDashboard component
    - Create `frontend/src/pages/admin/DeliveryAnalytics.jsx`
    - Display KPI cards (total deliveries, average time, success rate, revenue)
    - Show top performers list
    - Display delivery trends chart
    - Implement date range filter
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_
  
  - [ ] 24.2 Create DeliveryPersonManagement component
    - Create `frontend/src/pages/admin/DeliveryPersonManagement.jsx`
    - Display list of all delivery persons
    - Show availability status for each
    - Display performance metrics (acceptance rate, completion rate, average rating)
    - Implement manual order assignment
    - Implement order reassignment
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  
  - [ ] 24.3 Create ActiveOrderMonitor component
    - Create `frontend/src/pages/admin/ActiveOrderMonitor.jsx`
    - Display real-time list of active orders
    - Subscribe to WebSocket for real-time updates
    - Show elapsed time for each order
    - Highlight delayed orders (>30 minutes pending)
    - Implement filters (status, delivery person, date)
    - Allow order reassignment
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_
  
  - [ ] 24.4 Create RatingFeedbackManager component
    - Create `frontend/src/pages/admin/RatingFeedbackManager.jsx`
    - Display all ratings with buyer and delivery person names
    - Show star value and feedback text
    - Implement filters (delivery person, star value, date range)
    - Highlight low ratings (<3 stars)
    - Display average rating per delivery person
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 25. Implement notification API endpoints
  - [ ] 25.1 Create notification controller and routes
    - Create `backend/src/controllers/notification.controller.js`
    - Implement getNotifications(userId, limit, offset)
    - Implement markAsRead(notificationId)
    - Implement getUnreadCount(userId)
    - Create routes in `backend/src/routes/notification.routes.js`
    - _Requirements: 17.5, 17.6_
  
  - [ ]* 25.2 Write property test for notification read status
    - **Property 73: Notification read status update**
    - **Validates: Requirements 17.5**
  
  - [ ]* 25.3 Write property test for notification history filtering
    - **Property 74: Notification history time filtering**
    - **Validates: Requirements 17.6**

- [ ] 26. Integrate WebSocket with frontend
  - [ ] 26.1 Create WebSocket client service
    - Create `frontend/src/services/websocket.service.js`
    - Initialize socket.io-client connection
    - Implement authentication with JWT token
    - Implement event listeners for location updates, order status changes, order alerts
    - Implement event emitters for location updates, tracking subscription
    - _Requirements: 2.3, 13.2_
  
  - [ ] 26.2 Integrate WebSocket in buyer components
    - Subscribe to order tracking in OrderTrackingMap
    - Listen for order status change notifications
    - Update UI in real-time
    - _Requirements: 2.1, 2.3, 1.1, 1.3, 1.4_
  
  - [ ] 26.3 Integrate WebSocket in delivery person components
    - Listen for new order alerts
    - Send location updates when order is "Out for Delivery"
    - _Requirements: 5.1, 16.1, 16.2_
  
  - [ ] 26.4 Integrate WebSocket in admin components
    - Subscribe to active order updates in ActiveOrderMonitor
    - Update order list in real-time
    - _Requirements: 13.2_

- [ ] 27. Add navigation routes and menu items
  - [ ] 27.1 Update buyer navigation
    - Add "Order History" route to buyer sidebar
    - Add "Track Order" link in order status page
    - Update `frontend/src/components/navigation/BuyerSidebar.jsx`
    - _Requirements: 3.1, 2.1_
  
  - [ ] 27.2 Update delivery person navigation
    - Add "Earnings" route to employee sidebar
    - Add "Availability" toggle to header
    - Update `frontend/src/components/navigation/EmployeeSidebar.jsx`
    - _Requirements: 9.1, 10.1_
  
  - [ ] 27.3 Update admin navigation
    - Add "Delivery Analytics" route to admin sidebar
    - Add "Delivery Persons" route to admin sidebar
    - Add "Active Orders" route to admin sidebar
    - Add "Ratings & Feedback" route to admin sidebar
    - Update `frontend/src/components/navigation/AdminSidebar.jsx`
    - _Requirements: 11.1, 12.1, 13.1, 14.1_

- [ ] 28. Implement error handling and edge cases
  - [ ] 28.1 Add GPS tracking error handling
    - Handle location permission denied
    - Handle GPS unavailable
    - Display appropriate error messages
    - Log errors for admin review
    - _Requirements: 2.6, 16.6_
  
  - [ ] 28.2 Add notification error handling
    - Handle push notification failures
    - Handle SMS delivery failures
    - Ensure in-app notifications always work
    - Log failures for monitoring
    - _Requirements: 17.1, 17.3, 17.4_
  
  - [ ] 28.3 Add file upload error handling
    - Handle invalid file types
    - Handle oversized files
    - Handle upload failures
    - Provide retry option
    - _Requirements: 8.2, 8.3_
  
  - [ ] 28.4 Add external service error handling
    - Handle Google Maps API failures
    - Fall back to straight-line distance
    - Display address as text for navigation
    - _Requirements: 7.4, 18.3, 18.4_

- [ ] 29. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 30. Implement configuration and environment setup
  - [ ] 30.1 Add environment variables
    - Add GOOGLE_MAPS_API_KEY to backend .env
    - Add FIREBASE_SERVER_KEY for push notifications (optional)
    - Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN for SMS (optional)
    - Add BASE_DELIVERY_FEE and DISTANCE_RATE for earnings calculation
    - Add DAIRY_LOCATION_LAT and DAIRY_LOCATION_LNG
    - _Requirements: 18.4, 19.2_
  
  - [ ] 30.2 Create configuration service
    - Create `backend/src/config/delivery.config.js`
    - Export configuration values with defaults
    - Validate required configuration on startup
    - _Requirements: 19.2_

- [ ] 31. Add database indexes for performance
  - [ ] 31.1 Add indexes to Delivery model
    - Add index on status for active order queries
    - Add index on deliveryPersonId for delivery person queries
    - Add index on buyerId for buyer queries
    - Add compound index on (status, createdAt) for monitoring
    - _Requirements: 13.1, 13.6_
  
  - [ ] 31.2 Verify all model indexes
    - Verify Rating indexes (deliveryPersonId, orderId)
    - Verify Earnings indexes (deliveryPersonId, calculatedAt, paymentStatus)
    - Verify GPS_Tracking indexes (location 2dsphere, orderId, timestamp TTL)
    - Verify Notification indexes (userId, createdAt, read, timestamp TTL)
    - _Requirements: 4.4, 19.3, 16.3, 17.2_

- [ ] 32. Write integration tests
  - [ ]* 32.1 Write integration test for complete order flow
    - Test: Create order → Match delivery person → Accept → Track → Complete → Rate → Earnings
    - Verify all notifications sent
    - Verify earnings calculated
    - Verify rating stored and average updated
  
  - [ ]* 32.2 Write integration test for order rejection flow
    - Test: Create order → Match delivery person → Reject → Re-match → Accept
    - Verify rejection reason stored
    - Verify order remains available after rejection
  
  - [ ]* 32.3 Write integration test for real-time tracking
    - Test: Order out for delivery → Send location updates → Buyer receives updates → Proximity notification
    - Verify WebSocket communication
    - Verify GPS data persistence
    - Verify ETA calculation

- [ ] 33. Update API documentation
  - [ ] 33.1 Document new API endpoints
    - Document rating endpoints (POST /api/orders/:orderId/rating, GET /api/delivery-persons/:id/ratings)
    - Document earnings endpoints (GET /api/delivery-persons/:id/earnings, GET /api/delivery-persons/:id/performance)
    - Document availability endpoints (PUT /api/delivery-persons/:id/availability, GET /api/delivery-persons/available)
    - Document tracking endpoints (GET /api/orders/:orderId/tracking, GET /api/orders/:orderId/tracking-history)
    - Document admin analytics endpoints
    - Document notification endpoints
    - _Requirements: All_
  
  - [ ] 33.2 Document WebSocket events
    - Document client → server events (location:update, tracking:subscribe, tracking:unsubscribe)
    - Document server → client events (location:updated, order:status-changed, order:new-alert)
    - Include event payload schemas
    - _Requirements: 2.3, 16.1, 16.2_

- [ ] 34. Final testing and validation
  - [ ]* 34.1 Run all property tests
    - Execute all 92 property tests
    - Verify 100+ iterations per test
    - Fix any failing tests
  
  - [ ]* 34.2 Run all unit tests
    - Execute all unit tests
    - Verify edge cases covered
    - Verify error handling tested
  
  - [ ]* 34.3 Run integration tests
    - Execute all integration tests
    - Verify end-to-end flows work
    - Verify WebSocket communication
  
  - [ ] 34.4 Manual testing checklist
    - Test backward compatibility with existing orders
    - Test with legacy data (orders without new fields)
    - Test GPS tracking on mobile device
    - Test notifications across all channels
    - Test admin analytics with real data
    - Test concurrent order scenarios

- [ ] 35. Final checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows and real-time features
- The implementation maintains backward compatibility throughout
- WebSocket integration enables real-time tracking and notifications
- All new features are optional and don't break existing functionality
