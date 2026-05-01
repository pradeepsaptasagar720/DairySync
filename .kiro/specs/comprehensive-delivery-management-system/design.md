# Design Document: Comprehensive Delivery Management System

## Overview

This design enhances the existing milk delivery system with real-time tracking, notifications, ratings, earnings management, and comprehensive analytics. The architecture follows a progressive enhancement approach, ensuring all new features are optional and backward compatible with existing functionality.

The system is built on the existing MERN stack (MongoDB, Express, React, Node.js) and adds:
- Real-time GPS tracking using WebSocket connections
- Multi-channel notification system (in-app, push, SMS)
- Rating and feedback system with aggregated metrics
- Earnings calculation and dashboard for delivery persons
- Smart order matching algorithm based on proximity
- Comprehensive admin analytics dashboard

Key design principles:
- **Backward Compatibility**: Existing order flow remains unchanged
- **Progressive Enhancement**: New features are optional and don't break existing functionality
- **Real-Time Updates**: WebSocket connections for live tracking and notifications
- **Scalability**: Efficient algorithms for order matching and distance calculation
- **Data Privacy**: GPS data only shared during active deliveries

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Buyer UI     │ Delivery UI  │ Admin UI     │ Shared Components │
│ - Tracking   │ - Alerts     │ - Analytics  │ - Notifications   │
│ - History    │ - Earnings   │ - Management │ - Maps            │
│ - Rating     │ - Navigation │ - Monitoring │ - Modals          │
└──────────────┴──────────────┴──────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Express)                         │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Order API    │ Tracking API │ Rating API   │ Analytics API     │
│ Notification │ Earnings API │ Admin API    │ WebSocket Server  │
└──────────────┴──────────────┴──────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                          │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Order        │ GPS Tracking │ Notification │ Earnings          │
│ Matching     │ Service      │ Service      │ Calculator        │
│ Algorithm    │              │              │                   │
└──────────────┴──────────────┴──────────────┴───────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (MongoDB)                          │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│ Delivery     │ Rating       │ GPS_Tracking │ Notification      │
│ (existing)   │ (new)        │ (new)        │ (new)             │
│              │              │              │                   │
│ Earnings     │ Availability │              │                   │
│ (new)        │ (new field)  │              │                   │
└──────────────┴──────────────┴──────────────┴───────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ for UI components
- React Router for navigation
- Socket.io-client for WebSocket connections
- Google Maps JavaScript API for map display
- Axios for HTTP requests
- React Query for data fetching and caching

**Backend:**
- Node.js with Express for API server
- Socket.io for WebSocket server
- Mongoose for MongoDB ODM
- JWT for authentication (existing)
- Node-cron for scheduled tasks

**External Services:**
- Google Maps API for distance calculation and navigation
- Firebase Cloud Messaging (optional) for push notifications
- Twilio (optional) for SMS notifications

### Data Flow

**Order Creation Flow (Existing - Unchanged):**
```
Buyer → PlaceOrderModal → POST /api/buyer/order → Delivery.create() → Database
```

**Enhanced Order Flow with Notifications:**
```
Order Created → Smart Matching Algorithm → Notify Nearest Delivery Persons
                                         ↓
                              Delivery Person Accepts
                                         ↓
                              Update Order Status → Notify Buyer
                                         ↓
                              Start GPS Tracking (Out for Delivery)
                                         ↓
                              Complete Order → Calculate Earnings
                                         ↓
                              Prompt Buyer Rating → Update Delivery Person Stats
```

**Real-Time Tracking Flow:**
```
Delivery Person Device → GPS Coordinates → WebSocket Server
                                         ↓
                              Store in GPS_Tracking Collection
                                         ↓
                              Broadcast to Buyer's WebSocket
                                         ↓
                              Buyer's Map Updates
```

## Components and Interfaces

### Frontend Components

#### Buyer Components

**OrderTrackingMap Component**
```javascript
interface OrderTrackingMapProps {
  orderId: string;
  deliveryPersonLocation: { lat: number; lng: number };
  deliveryAddress: { lat: number; lng: number };
  estimatedArrival: Date;
}

// Displays real-time map with delivery person location
// Shows ETA and distance remaining
// Updates every 30 seconds via WebSocket
```

**OrderHistoryPage Component**
```javascript
interface OrderHistoryPageProps {
  userId: string;
}

interface OrderFilters {
  dateRange: { start: Date; end: Date };
  status: DeliveryStatus[];
  searchQuery: string;
}

// Displays paginated order history
// Provides filters for date, status, search
// Includes reorder functionality
```

**RatingModal Component**
```javascript
interface RatingModalProps {
  orderId: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  onSubmit: (rating: Rating) => void;
}

interface Rating {
  stars: number; // 1-5
  feedback: string; // optional
}

// Appears after order completion
// Collects star rating and optional feedback
// Prevents duplicate ratings
```

#### Delivery Person Components

**OrderAlertCard Component**
```javascript
interface OrderAlertCardProps {
  order: Order;
  distance: number;
  earnings: number;
  onAccept: () => void;
  onReject: (reason: string) => void;
}

// Displays new order details
// Shows pickup/delivery locations with distance
// Provides Accept/Reject buttons
```

**EarningsDashboard Component**
```javascript
interface EarningsDashboardProps {
  deliveryPersonId: string;
}

interface EarningsData {
  daily: number;
  weekly: number;
  monthly: number;
  perDeliveryBreakdown: DeliveryEarning[];
  paymentHistory: Payment[];
  performanceMetrics: {
    acceptanceRate: number;
    completionRate: number;
    averageRating: number;
    totalDeliveries: number;
  };
}

// Displays earnings summary with time period tabs
// Shows performance metrics
// Lists payment history
```

**AvailabilityToggle Component**
```javascript
interface AvailabilityToggleProps {
  deliveryPersonId: string;
  currentStatus: boolean;
  onToggle: (newStatus: boolean) => void;
}

// Toggle switch for availability status
// Persists status to backend
// Updates UI immediately
```

**DeliveryProofUpload Component**
```javascript
interface DeliveryProofUploadProps {
  orderId: string;
  onUpload: (file: File) => void;
}

// File input for photo upload
// Validates file type and size
// Displays preview before upload
```

#### Admin Components

**DeliveryAnalyticsDashboard Component**
```javascript
interface DeliveryAnalyticsDashboardProps {
  dateRange: { start: Date; end: Date };
}

interface AnalyticsData {
  totalDeliveries: { today: number; week: number; month: number };
  averageDeliveryTime: number; // minutes
  successRate: number; // percentage
  topPerformers: DeliveryPerson[];
  revenue: { today: number; week: number; month: number };
  trendChart: ChartData;
}

// Displays comprehensive delivery analytics
// Shows KPIs and trends
// Allows date range filtering
```

**DeliveryPersonManagement Component**
```javascript
interface DeliveryPersonManagementProps {
  deliveryPersons: DeliveryPerson[];
}

interface DeliveryPerson {
  id: string;
  name: string;
  availabilityStatus: boolean;
  acceptanceRate: number;
  completionRate: number;
  averageRating: number;
  totalDeliveries: number;
}

// Lists all delivery persons with metrics
// Shows availability status
// Allows manual order assignment
```

**ActiveOrderMonitor Component**
```javascript
interface ActiveOrderMonitorProps {
  orders: Order[];
  filters: OrderFilters;
}

// Real-time display of active orders
// Updates via WebSocket
// Highlights delayed orders
// Allows order reassignment
```

**RatingFeedbackManager Component**
```javascript
interface RatingFeedbackManagerProps {
  ratings: Rating[];
  filters: RatingFilters;
}

interface RatingFilters {
  deliveryPersonId?: string;
  minStars?: number;
  maxStars?: number;
  dateRange?: { start: Date; end: Date };
}

// Displays all ratings and feedback
// Provides filtering options
// Highlights low ratings
```

### Backend API Endpoints

#### Order Tracking Endpoints

```
GET /api/orders/:orderId/tracking
- Returns current GPS location and ETA for active order
- Response: { location: { lat, lng }, eta: Date, distance: number }

GET /api/orders/:orderId/tracking-history
- Returns GPS tracking history for completed order
- Response: { history: [{ lat, lng, timestamp }] }
```

#### Rating Endpoints

```
POST /api/orders/:orderId/rating
- Submit rating for completed order
- Body: { stars: number, feedback: string }
- Response: { success: boolean, rating: Rating }

GET /api/delivery-persons/:id/ratings
- Get all ratings for a delivery person
- Response: { ratings: Rating[], averageRating: number }
```

#### Earnings Endpoints

```
GET /api/delivery-persons/:id/earnings
- Get earnings summary for delivery person
- Query params: period (daily|weekly|monthly)
- Response: { total: number, breakdown: DeliveryEarning[] }

GET /api/delivery-persons/:id/performance
- Get performance metrics for delivery person
- Response: { acceptanceRate, completionRate, averageRating, totalDeliveries }
```

#### Availability Endpoints

```
PUT /api/delivery-persons/:id/availability
- Update delivery person availability status
- Body: { available: boolean }
- Response: { success: boolean, status: boolean }

GET /api/delivery-persons/available
- Get list of currently available delivery persons
- Response: { deliveryPersons: DeliveryPerson[] }
```

#### Admin Analytics Endpoints

```
GET /api/admin/delivery-analytics
- Get comprehensive delivery analytics
- Query params: startDate, endDate
- Response: { totalDeliveries, averageTime, successRate, revenue, trends }

GET /api/admin/delivery-persons/management
- Get all delivery persons with performance metrics
- Response: { deliveryPersons: DeliveryPerson[] }

POST /api/admin/orders/:orderId/reassign
- Manually reassign order to different delivery person
- Body: { newDeliveryPersonId: string }
- Response: { success: boolean, order: Order }
```

#### Notification Endpoints

```
GET /api/notifications
- Get user's notification history
- Query params: limit, offset
- Response: { notifications: Notification[], total: number }

PUT /api/notifications/:id/read
- Mark notification as read
- Response: { success: boolean }

POST /api/notifications/send
- Send notification to user (internal use)
- Body: { userId, type, message, data }
- Response: { success: boolean, notificationId: string }
```

### WebSocket Events

#### Client → Server Events

```javascript
// Delivery person sends location update
socket.emit('location:update', {
  orderId: string,
  location: { lat: number, lng: number },
  timestamp: Date
});

// Buyer subscribes to order tracking
socket.emit('tracking:subscribe', {
  orderId: string
});

// Buyer unsubscribes from order tracking
socket.emit('tracking:unsubscribe', {
  orderId: string
});
```

#### Server → Client Events

```javascript
// Location update broadcast to buyer
socket.emit('location:updated', {
  orderId: string,
  location: { lat: number, lng: number },
  eta: Date,
  distance: number
});

// Order status change notification
socket.emit('order:status-changed', {
  orderId: string,
  newStatus: DeliveryStatus,
  message: string
});

// New order alert to delivery person
socket.emit('order:new-alert', {
  order: Order,
  distance: number,
  earnings: number
});
```

## Data Models

### Extended Delivery Model

```javascript
// Existing fields remain unchanged
// New optional fields added for backward compatibility

const DeliverySchema = new mongoose.Schema({
  // Existing fields (unchanged)
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deliveryAddress: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Out for Delivery', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now },
  
  // New optional fields
  deliveryPersonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // null for backward compatibility
  },
  assignedAt: { type: Date, default: null },
  acceptedAt: { type: Date, default: null },
  outForDeliveryAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  
  deliveryProofPhoto: { type: String, default: null }, // URL to photo
  
  distanceKm: { type: Number, default: null }, // Distance from dairy to buyer
  estimatedDeliveryTime: { type: Number, default: null }, // Minutes
  
  rejectionReason: { type: String, default: null },
  rejectedBy: [{ 
    deliveryPersonId: mongoose.Schema.Types.ObjectId,
    reason: String,
    timestamp: Date
  }]
});
```

### Rating Model (New)

```javascript
const RatingSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Delivery', 
    required: true,
    unique: true // Prevent duplicate ratings for same order
  },
  buyerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  deliveryPersonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  stars: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  feedback: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
RatingSchema.index({ deliveryPersonId: 1, createdAt: -1 });
RatingSchema.index({ orderId: 1 });
```

### Earnings Model (New)

```javascript
const EarningsSchema = new mongoose.Schema({
  deliveryPersonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Delivery', 
    required: true,
    unique: true // One earnings record per order
  },
  amount: { 
    type: Number, 
    required: true 
  },
  baseFee: { 
    type: Number, 
    required: true 
  },
  distanceFee: { 
    type: Number, 
    required: true 
  },
  distanceKm: { 
    type: Number, 
    required: true 
  },
  calculatedAt: { 
    type: Date, 
    default: Date.now 
  },
  paidAt: { 
    type: Date, 
    default: null 
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending'
  }
});

// Indexes for efficient aggregation
EarningsSchema.index({ deliveryPersonId: 1, calculatedAt: -1 });
EarningsSchema.index({ deliveryPersonId: 1, paymentStatus: 1 });
```

### GPS_Tracking Model (New)

```javascript
const GPSTrackingSchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Delivery', 
    required: true 
  },
  deliveryPersonId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  accuracy: { 
    type: Number, // meters
    default: null 
  }
});

// Geospatial index for location queries
GPSTrackingSchema.index({ location: '2dsphere' });
// Index for efficient time-based queries
GPSTrackingSchema.index({ orderId: 1, timestamp: -1 });
// TTL index to auto-delete old tracking data after 30 days
GPSTrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });
```

### Notification Model (New)

```javascript
const NotificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: {
    type: String,
    enum: [
      'order_confirmed',
      'delivery_person_assigned',
      'out_for_delivery',
      'delivery_completed',
      'order_cancelled',
      'new_order_alert',
      'order_accepted',
      'order_rejected',
      'proximity_alert'
    ],
    required: true
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Additional data (orderId, etc.)
    default: {}
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  channels: {
    inApp: { type: Boolean, default: true },
    push: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  }
});

// Indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
// TTL index to auto-delete old notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
```

### Extended User Model (Availability Field)

```javascript
// Add to existing User schema for delivery persons
const UserSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // New field for delivery persons
  availabilityStatus: {
    type: Boolean,
    default: false // Default to unavailable
  },
  lastAvailabilityUpdate: {
    type: Date,
    default: null
  },
  
  // Cached performance metrics (updated on each order completion)
  deliveryStats: {
    totalDeliveries: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    totalOffered: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 }
  }
});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Notification Properties

Property 1: Order status change notifications
*For any* order that changes status to Approved, Out for Delivery, or Completed, the system should create an in-app notification for the buyer with the correct status information.
**Validates: Requirements 1.1, 1.3, 1.4, 1.5**

Property 2: Delivery person assignment notifications
*For any* order that gets assigned a delivery person, the system should create a notification for the buyer that includes the delivery person's name.
**Validates: Requirements 1.2**

Property 3: Conditional push notifications
*For any* user with push notification tokens registered and any critical order event, the system should send a push notification in addition to the in-app notification.
**Validates: Requirements 1.6**

Property 4: Conditional SMS notifications
*For any* order confirmation or completion event where SMS is configured, the system should send an SMS notification to the buyer.
**Validates: Requirements 1.7**

### Tracking and Location Properties

Property 5: ETA calculation consistency
*For any* active order with GPS location data, the estimated time of arrival should be calculated based on distance and average speed, and should decrease as the delivery person approaches the destination.
**Validates: Requirements 2.2**

Property 6: Proximity notification triggering
*For any* delivery person location update where the distance to the delivery address is less than 500 meters, the system should send a proximity notification to the buyer.
**Validates: Requirements 2.4**

Property 7: Distance calculation accuracy
*For any* two GPS coordinates, the calculated distance should be non-negative and should satisfy the triangle inequality property.
**Validates: Requirements 2.5**

### Order History and Filtering Properties

Property 8: Complete order history retrieval
*For any* buyer, querying their order history should return all orders associated with their buyer ID.
**Validates: Requirements 3.1**

Property 9: Date range filtering correctness
*For any* date range filter applied to order history, all returned orders should have creation dates within the specified range, and no orders within the range should be excluded.
**Validates: Requirements 3.2**

Property 10: Status filtering correctness
*For any* status filter applied to order history, all returned orders should have statuses matching the filter, and no orders with matching statuses should be excluded.
**Validates: Requirements 3.3**

Property 11: Search functionality correctness
*For any* search query on order history, all returned orders should match the query criteria (order ID or date), and all matching orders should be included in results.
**Validates: Requirements 3.4**

Property 12: Order details completeness
*For any* order retrieved from history, the order details should include all required fields including delivery person information if assigned.
**Validates: Requirements 3.5**

Property 13: Reorder data preservation
*For any* completed order, creating a reorder should pre-fill the order form with data that matches the original order's quantity and delivery address.
**Validates: Requirements 3.7**

### Rating System Properties

Property 14: Rating value validation
*For any* rating submission, ratings with values outside the range 1-5 should be rejected, and ratings within the range should be accepted.
**Validates: Requirements 4.2**

Property 15: Optional feedback acceptance
*For any* rating submission, the system should accept ratings both with and without feedback text.
**Validates: Requirements 4.3**

Property 16: Rating data completeness
*For any* submitted rating, the stored rating record should include order ID, buyer ID, delivery person ID, star value, and timestamp.
**Validates: Requirements 4.4**

Property 17: Duplicate rating prevention
*For any* order, attempting to submit a second rating should be rejected, ensuring each order can only be rated once.
**Validates: Requirements 4.5**

Property 18: Average rating calculation
*For any* delivery person with ratings, the average rating should equal the sum of all star values divided by the number of ratings, and should be updated after each new rating.
**Validates: Requirements 4.6**

### Delivery Person Alert Properties

Property 19: Availability-based alert targeting
*For any* new order, only delivery persons with availability status set to Available should receive order alert notifications.
**Validates: Requirements 5.1**

Property 20: Alert content completeness
*For any* order alert notification, the notification should include pickup location, delivery destination, distance, and estimated earnings.
**Validates: Requirements 5.2, 5.3, 5.4**

### Order Accept/Reject Properties

Property 21: Order acceptance state transition
*For any* order that a delivery person accepts, the order status should be updated to Approved and the delivery person should be assigned to the order.
**Validates: Requirements 6.1**

Property 22: Rejection reason requirement
*For any* order rejection attempt without a reason, the rejection should be rejected by the system.
**Validates: Requirements 6.2**

Property 23: Custom rejection reason handling
*For any* order rejection with "Other" as the reason type, the system should accept and store a custom reason text.
**Validates: Requirements 6.4**

Property 24: Order availability after rejection
*For any* order that is rejected by a delivery person, the order should remain in the available orders pool for other delivery persons.
**Validates: Requirements 6.5**

Property 25: Rejection tracking
*For any* order rejection, the rejection reason and rejecting delivery person ID should be stored with the order record.
**Validates: Requirements 6.6**

### Navigation and Delivery Proof Properties

Property 26: Navigation URL coordinate inclusion
*For any* accepted order, the generated navigation URL should include the delivery address coordinates as parameters.
**Validates: Requirements 7.3**

Property 27: Image file type validation
*For any* delivery proof upload, files with JPEG, PNG, or WebP extensions should be accepted, and files with other extensions should be rejected.
**Validates: Requirements 8.2**

Property 28: File size validation
*For any* delivery proof upload, files larger than 5MB should be rejected, and files 5MB or smaller should be accepted.
**Validates: Requirements 8.3**

Property 29: Delivery proof association
*For any* uploaded delivery proof photo, the photo URL should be stored in the order record associated with the correct order ID.
**Validates: Requirements 8.4**

Property 30: Delivery proof access control
*For any* delivery proof photo, buyers and admins should be able to retrieve the photo, while unauthorized users should not.
**Validates: Requirements 8.5**

Property 31: Optional delivery proof handling
*For any* order completion, the order should be marked as completed successfully regardless of whether a delivery proof photo is uploaded.
**Validates: Requirements 8.6**

### Earnings and Performance Properties

Property 32: Earnings aggregation correctness
*For any* delivery person and time period (daily, weekly, monthly), the aggregated earnings should equal the sum of all earnings records within that period.
**Validates: Requirements 9.1**

Property 33: Earnings breakdown completeness
*For any* delivery person, the earnings breakdown should include a record for each completed delivery with order ID, amount, and date.
**Validates: Requirements 9.2**

Property 34: Payment history accuracy
*For any* delivery person, the payment history should include all payment records with dates and amounts matching the earnings records.
**Validates: Requirements 9.3**

Property 35: Performance rate calculations
*For any* delivery person, the acceptance rate should equal (accepted orders / total offered orders) and the completion rate should equal (completed orders / accepted orders).
**Validates: Requirements 9.4, 9.5**

Property 36: Average rating display
*For any* delivery person with ratings, the displayed average rating should match the calculated average from all their ratings.
**Validates: Requirements 9.6**

Property 37: Delivery count accuracy
*For any* delivery person and time period, the total deliveries count should equal the number of completed orders within that period.
**Validates: Requirements 9.7**

### Availability Management Properties

Property 38: Availability-based order matching
*For any* delivery person, when availability status is Available they should be included in order matching, and when Unavailable they should be excluded from receiving new order alerts.
**Validates: Requirements 10.2, 10.3**

Property 39: Availability persistence
*For any* delivery person, setting availability status should persist the value to the database, and subsequent retrievals should return the same status.
**Validates: Requirements 10.4**

Property 40: Availability status retrieval
*For any* delivery person login, the displayed availability status should match the stored status in the database.
**Validates: Requirements 10.5**

Property 41: Admin availability visibility
*For any* admin query for delivery person availability, the system should return the current availability status for all delivery persons.
**Validates: Requirements 10.6**

### Admin Analytics Properties

Property 42: Delivery count aggregation
*For any* time period (today, week, month), the total deliveries count should equal the number of orders with status Completed within that period.
**Validates: Requirements 11.1**

Property 43: Average delivery time calculation
*For any* set of completed orders, the average delivery time should equal the sum of (completedAt - createdAt) for all orders divided by the number of orders.
**Validates: Requirements 11.2**

Property 44: Success rate calculation
*For any* set of orders, the delivery success rate should equal (completed orders / total orders) expressed as a percentage.
**Validates: Requirements 11.3**

Property 45: Top performer ranking
*For any* set of delivery persons, ranking by completion rate and average rating should produce a sorted list with highest performers first.
**Validates: Requirements 11.4**

Property 46: Revenue aggregation
*For any* time period, the total revenue should equal the sum of all earnings amounts for completed deliveries within that period.
**Validates: Requirements 11.5**

Property 47: Analytics date filtering
*For any* date range filter on analytics, all returned data should be from orders within the specified date range.
**Validates: Requirements 11.7**

### Delivery Person Management Properties

Property 48: Delivery person list completeness
*For any* admin query for delivery persons, the returned list should include all users with delivery person role along with their current availability status.
**Validates: Requirements 12.1**

Property 49: Performance metrics accuracy
*For any* delivery person in the management view, the displayed metrics (acceptance rate, completion rate, average rating) should match the calculated values from their order and rating history.
**Validates: Requirements 12.2**

Property 50: Performance history completeness
*For any* delivery person, the detailed performance history should include all their orders with timestamps and outcomes.
**Validates: Requirements 12.3**

Property 51: Manual order assignment
*For any* admin-initiated order assignment, the order should be assigned to the specified delivery person and the delivery person should be notified.
**Validates: Requirements 12.4**

Property 52: Order reassignment notification
*For any* order reassignment, both the original delivery person and the new delivery person should receive notifications about the change.
**Validates: Requirements 12.5, 12.6**

### Order Monitoring Properties

Property 53: Active order filtering
*For any* order monitoring query, only orders with status Pending, Approved, or Out for Delivery should be returned.
**Validates: Requirements 13.1**

Property 54: Order delivery person display
*For any* order in the monitoring view, if a delivery person is assigned, their information should be displayed with the order.
**Validates: Requirements 13.3**

Property 55: Elapsed time calculation
*For any* active order, the elapsed time should equal the difference between the current time and the order creation time.
**Validates: Requirements 13.4**

Property 56: Delayed order highlighting
*For any* order with status Pending for more than 30 minutes, the order should be flagged as delayed.
**Validates: Requirements 13.5**

Property 57: Order monitoring filters
*For any* filter applied to order monitoring (status, delivery person, date), only orders matching all applied filters should be returned.
**Validates: Requirements 13.6**

### Rating Management Properties

Property 58: Rating display completeness
*For any* rating in the admin view, the displayed data should include buyer name, delivery person name, star value, feedback text, and timestamp.
**Validates: Requirements 14.1**

Property 59: Rating filtering correctness
*For any* filter applied to ratings (delivery person, star value, date range), only ratings matching the filter criteria should be returned.
**Validates: Requirements 14.2, 14.3, 14.4**

Property 60: Delivery person average rating
*For any* delivery person in the rating management view, the displayed average rating should match the calculated average from all their ratings.
**Validates: Requirements 14.5**

Property 61: Low rating highlighting
*For any* rating with a star value below 3, the rating should be highlighted for admin attention.
**Validates: Requirements 14.6**

### Smart Matching Properties

Property 62: Available delivery person identification
*For any* new order, the matching algorithm should identify only delivery persons with availabilityStatus set to true.
**Validates: Requirements 15.1**

Property 63: Distance-based prioritization
*For any* set of available delivery persons, they should be sorted by distance from the dairy location in ascending order.
**Validates: Requirements 15.2, 15.3**

Property 64: Alert distribution to nearest
*For any* new order, order alerts should be sent to exactly the three nearest available delivery persons (or fewer if less than three are available).
**Validates: Requirements 15.4**

Property 65: Alert cancellation on acceptance
*For any* order acceptance by a delivery person, any pending alerts sent to other delivery persons for that order should be cancelled.
**Validates: Requirements 15.5**

### GPS Tracking Properties

Property 66: GPS data persistence
*For any* GPS location update from a delivery person, the coordinates and timestamp should be stored in the GPS_Tracking collection.
**Validates: Requirements 16.3**

Property 67: Distance to destination calculation
*For any* GPS location update, the system should calculate the distance between the current location and the delivery destination.
**Validates: Requirements 16.4**

Property 68: ETA estimation
*For any* GPS location with distance to destination, the ETA should be calculated as (distance / average_speed) added to current time.
**Validates: Requirements 16.5**

### Multi-Channel Notification Properties

Property 69: In-app notification creation
*For any* order status change, an in-app notification should be created and stored in the Notification collection.
**Validates: Requirements 17.1**

Property 70: Notification persistence
*For any* notification sent, the notification should be stored in the database with user ID, type, message, and timestamp.
**Validates: Requirements 17.2**

Property 71: Conditional push notification delivery
*For any* critical event where the user has push tokens registered, a push notification should be sent in addition to the in-app notification.
**Validates: Requirements 17.3**

Property 72: Conditional SMS delivery
*For any* order confirmation or completion where SMS is configured, an SMS should be sent to the buyer.
**Validates: Requirements 17.4**

Property 73: Notification read status update
*For any* notification that a user views, the read status should be updated to true in the database.
**Validates: Requirements 17.5**

Property 74: Notification history time filtering
*For any* notification history query, only notifications created within the past 30 days should be returned.
**Validates: Requirements 17.6**

### Distance Calculation Properties

Property 75: Order distance calculation
*For any* order creation, the system should calculate the distance from the dairy location to the buyer's delivery address using GPS coordinates.
**Validates: Requirements 18.1, 18.2**

Property 76: Distance calculation method selection
*For any* distance calculation, the system should use straight-line distance as a minimum, and use road distance from mapping API when available.
**Validates: Requirements 18.3, 18.4**

Property 77: Distance persistence
*For any* calculated distance, the value should be stored in the order record's distanceKm field.
**Validates: Requirements 18.5**

Property 78: Delivery time estimation
*For any* order with calculated distance, the estimated delivery time should be calculated as (distance / 30 km/h) converted to minutes.
**Validates: Requirements 18.6**

### Earnings Calculation Properties

Property 79: Earnings calculation on completion
*For any* order marked as Completed, the system should calculate earnings for the delivery person and create an Earnings record.
**Validates: Requirements 19.1**

Property 80: Earnings formula correctness
*For any* earnings calculation, the amount should equal base_fee + (distance_km * distance_rate).
**Validates: Requirements 19.2**

Property 81: Earnings record association
*For any* earnings calculation, the Earnings record should be stored with the correct order ID and delivery person ID.
**Validates: Requirements 19.3**

Property 82: Earnings aggregation by period
*For any* delivery person and time period, aggregated earnings should equal the sum of all earnings records within that period.
**Validates: Requirements 19.4**

Property 83: Total earnings update
*For any* order completion, the delivery person's total earnings should be incremented by the calculated earnings amount.
**Validates: Requirements 19.5**

Property 84: Earnings audit trail
*For any* earnings calculation, all calculation details (base fee, distance fee, distance) should be stored for audit purposes.
**Validates: Requirements 19.6**

### Backward Compatibility Properties

Property 85: Legacy order handling
*For any* order created before the enhancement deployment (with null values in new optional fields), the system should process the order successfully without errors.
**Validates: Requirements 20.2, 20.3, 20.4**

Property 86: Optional field null handling
*For any* operation on orders, the system should handle null values in optional fields (deliveryPersonId, deliveryProofPhoto, distanceKm) gracefully without throwing errors.
**Validates: Requirements 20.4**

Property 87: Legacy delivery person compatibility
*For any* delivery person without new profile fields (availabilityStatus, deliveryStats), the system should allow them to accept and complete orders.
**Validates: Requirements 20.5**

Property 88: API endpoint compatibility
*For any* existing API endpoint, the response format should remain unchanged for clients not using new features.
**Validates: Requirements 20.6**

### Inventory Management Properties

Property 89: Inventory check on order placement
*For any* order placement attempt, the system should verify that current inventory is sufficient for the requested quantity.
**Validates: Requirements 21.1**

Property 90: Insufficient inventory rejection
*For any* order where requested quantity exceeds available inventory, the order should be rejected and the buyer should be notified.
**Validates: Requirements 21.2**

Property 91: Inventory reservation on approval
*For any* order that is approved, the ordered quantity should be reserved, reducing available inventory by that amount.
**Validates: Requirements 21.3**

Property 92: Inventory release on cancellation
*For any* order that is cancelled, any reserved inventory should be released back to available stock.
**Validates: Requirements 21.5**

## Error Handling

### GPS Tracking Errors

**Location Update Failure:**
- If GPS coordinates cannot be obtained from device, log error and notify admin
- Display "Tracking temporarily unavailable" message to buyer
- Continue order processing without tracking data

**WebSocket Connection Failure:**
- Implement automatic reconnection with exponential backoff
- Fall back to polling for location updates if WebSocket fails
- Cache location updates locally and sync when connection restored

### Notification Errors

**Push Notification Failure:**
- Log failure but don't block order processing
- Ensure in-app notification is still created
- Retry push notification up to 3 times with delays

**SMS Delivery Failure:**
- Log failure for admin review
- Don't block order completion
- Mark SMS as failed in notification record

### External Service Errors

**Google Maps API Failure:**
- Fall back to straight-line distance calculation
- Display address as text for manual navigation
- Log error for monitoring

**Image Upload Failure:**
- Allow order completion without photo
- Provide retry option to delivery person
- Store error details for debugging

### Data Consistency Errors

**Duplicate Rating Attempt:**
- Return error message: "You have already rated this order"
- Don't create duplicate rating record
- Return existing rating to user

**Invalid Order State Transition:**
- Reject state change and return error
- Log attempted invalid transition
- Maintain current order state

**Earnings Calculation Error:**
- Log error with order details
- Notify admin for manual review
- Don't mark order as completed until earnings calculated

## Testing Strategy

This system requires both unit testing and property-based testing for comprehensive coverage.

### Unit Testing Approach

Unit tests should focus on:
- Specific examples of order flows (create → accept → deliver → complete)
- Edge cases like empty feedback, missing optional fields, boundary values
- Error conditions like insufficient inventory, invalid file types, duplicate ratings
- Integration points between components (notification triggering, earnings calculation)

### Property-Based Testing Approach

Property-based tests should verify universal properties across randomized inputs:
- Each correctness property listed above should have a corresponding property test
- Minimum 100 iterations per property test to ensure comprehensive coverage
- Use property testing library appropriate for Node.js (e.g., fast-check)

### Property Test Configuration

**Library:** fast-check for Node.js
**Iterations:** 100 minimum per test
**Tagging:** Each property test must include a comment tag:
```javascript
// Feature: comprehensive-delivery-management-system, Property N: [property title]
```

### Test Coverage Requirements

**Unit Tests:**
- Order creation and status transitions
- Rating submission with various inputs
- Earnings calculation with different distances
- Notification creation for each event type
- Filter operations on order history and ratings
- Admin analytics calculations
- Backward compatibility with legacy data

**Property Tests:**
- All 92 correctness properties listed above
- Focus on universal behaviors across all valid inputs
- Verify calculations (averages, rates, distances, earnings)
- Test filtering and aggregation logic
- Validate state transitions and data persistence

**Integration Tests:**
- WebSocket connection and real-time updates
- GPS tracking flow from device to buyer display
- Complete order lifecycle with all features
- Multi-user scenarios (multiple delivery persons, concurrent orders)

### Testing Priority

1. **Critical Path:** Order creation, acceptance, delivery, completion, earnings calculation
2. **Safety Properties:** Duplicate prevention, inventory management, backward compatibility
3. **User Experience:** Notifications, tracking, ratings, analytics
4. **Performance:** Distance calculations, aggregations, real-time updates

