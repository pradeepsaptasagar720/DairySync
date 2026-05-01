# Design Document: Buyer-Delivery Communication and Ratings

## Overview

This feature implements a comprehensive communication and feedback system between buyers and delivery personnel, along with an administrative ratings management dashboard. The system enables real-time text chat, phone call initiation, and milk quality rating submission to enhance order fulfillment transparency and enable data-driven quality improvements.

### Key Components

1. **Call Functionality**: Tel-link based phone calling between buyers and delivery boys for active orders
2. **Real-Time Chat System**: Bidirectional text messaging with message history and read status tracking
3. **Milk Quality Rating System**: 1-5 star rating submission with optional comments for completed orders
4. **Admin Ratings Dashboard**: Comprehensive interface for viewing, filtering, analyzing, and exporting ratings data

### Technical Approach

The system integrates seamlessly with the existing order management infrastructure, leveraging:
- Existing Delivery model for order status tracking
- Existing User model for authentication and role-based access
- Existing authentication middleware for security
- Polling-based approach for real-time chat (simpler than WebSocket, adequate for use case)
- RESTful API design following established patterns

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  Buyer Interface          │  Delivery Boy Interface          │
│  - Order Status Page      │  - Active Orders View            │
│  - Call Button            │  - Call Button                   │
│  - Chat Interface         │  - Chat Interface                │
│  - Rating Modal           │                                  │
├─────────────────────────────────────────────────────────────┤
│              Admin Dashboard Interface                       │
│  - Ratings List View                                        │
│  - Filters & Search                                         │
│  - Performance Metrics                                      │
│  - Trend Analysis Charts                                    │
│  - CSV Export                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
├─────────────────────────────────────────────────────────────┤
│  Chat Routes              │  Rating Routes                   │
│  - POST /messages         │  - POST /ratings                 │
│  - GET /messages/:orderId │  - GET /ratings (admin)          │
│  - PUT /messages/read     │  - GET /ratings/stats            │
│                           │  - GET /ratings/export           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
├─────────────────────────────────────────────────────────────┤
│  - Authorization Service (verify order access)               │
│  - Message Validation Service                                │
│  - Rating Validation Service                                 │
│  - Metrics Calculation Service                               │
│  - CSV Export Service                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ChatMessage Model        │  MilkQualityRating Model         │
│  - orderId (ref)          │  - orderId (ref, unique)         │
│  - senderId (ref)         │  - buyerId (ref)                 │
│  - senderRole             │  - rating (1-5)                  │
│  - message                │  - comments                      │
│  - isRead                 │  - createdAt                     │
│  - createdAt              │  - immutable                     │
└─────────────────────────────────────────────────────────────┘
```

### Real-Time Communication Strategy

**Polling Approach** (Recommended for simplicity):
- Frontend polls GET /messages/:orderId every 3 seconds when chat is open
- Lightweight request with `lastMessageId` parameter to fetch only new messages
- Unread count badge updates on order list page via periodic polling (every 10 seconds)
- Adequate for typical delivery communication patterns (low message frequency)
- No additional infrastructure required (WebSocket server, connection management)

**Benefits**:
- Simple implementation and debugging
- Works reliably across all network conditions
- No connection state management
- Easy to scale horizontally
- Compatible with existing REST API patterns

### Security Architecture

```
Request Flow with Authorization:

1. Client Request → JWT Token in Authorization Header
2. authMiddleware → Verify token, attach user to req.user
3. roleMiddleware → Verify user role (buyer/employee/admin)
4. Route Handler → Verify order-specific access
   - Buyers: Can only access their own orders
   - Delivery Boys: Can only access assigned orders
   - Admins: Can access all ratings data
5. Response → Sanitized data (no phone numbers in logs)
```

## Components and Interfaces

### Frontend Components

#### 1. CallButton Component
```jsx
<CallButton 
  phoneNumber={string}
  displayName={string}
  userRole={'buyer' | 'delivery_boy'}
  orderStatus={string}
/>
```

**Responsibilities**:
- Render phone icon button
- Generate tel: link with phone number
- Show/hide based on order status
- Display user name alongside button

**Visibility Rules**:
- Buyers: Show when status is "Accepted" or "Out for Delivery"
- Delivery Boys: Show when status is "Accepted" or "Out for Delivery"
- Hide for "Pending" or "Completed" (>24 hours)

#### 2. ChatInterface Component
```jsx
<ChatInterface 
  orderId={string}
  currentUserId={string}
  currentUserRole={'buyer' | 'delivery_boy'}
  orderStatus={string}
  completedAt={Date}
/>
```

**Responsibilities**:
- Display message history in chronological order
- Show sender name and timestamp for each message
- Highlight unread messages
- Provide message input field
- Handle message submission
- Poll for new messages every 3 seconds
- Mark messages as read when opened
- Disable input for old completed orders (>24 hours)

**State Management**:
- Local state: messages array, input value, loading state
- Polling interval: 3 seconds when chat is open
- Cleanup: Clear interval on component unmount

#### 3. ChatButton Component
```jsx
<ChatButton 
  orderId={string}
  unreadCount={number}
  onClick={function}
/>
```

**Responsibilities**:
- Display chat icon button
- Show unread message count badge
- Trigger chat interface modal/panel

#### 4. RatingModal Component
```jsx
<RatingModal 
  orderId={string}
  buyerId={string}
  onSubmit={function}
  onClose={function}
/>
```

**Responsibilities**:
- Display 1-5 star rating interface
- Provide optional comment textarea (500 char limit)
- Validate rating before submission
- Show success/error messages
- Prevent duplicate submissions

#### 5. AdminRatingsDashboard Component
```jsx
<AdminRatingsDashboard />
```

**Sub-components**:
- RatingsFilters: Date range, star rating, buyer name search
- RatingsList: Paginated table with ratings data
- PerformanceMetrics: Average rating, distribution chart
- TrendAnalysis: Line chart with time granularity options
- ExportButton: CSV export functionality

### Backend API Endpoints

#### Chat Endpoints

**POST /api/chat/messages**
```javascript
Request:
{
  orderId: string,
  message: string
}

Response:
{
  success: boolean,
  data: {
    _id: string,
    orderId: string,
    senderId: string,
    senderRole: string,
    senderName: string,
    message: string,
    isRead: boolean,
    createdAt: Date
  }
}
```

**GET /api/chat/messages/:orderId**
```javascript
Query Parameters:
- lastMessageId (optional): Fetch only messages after this ID
- limit (optional): Number of messages to fetch (default: 50)

Response:
{
  success: boolean,
  data: {
    messages: Array<Message>,
    hasMore: boolean
  }
}
```

**PUT /api/chat/messages/:orderId/read**
```javascript
Response:
{
  success: boolean,
  data: {
    markedCount: number
  }
}
```

**GET /api/chat/unread-counts**
```javascript
Response:
{
  success: boolean,
  data: {
    orderUnreadCounts: {
      [orderId]: number
    }
  }
}
```

#### Rating Endpoints

**POST /api/ratings**
```javascript
Request:
{
  orderId: string,
  rating: number (1-5),
  comments: string (optional, max 500 chars)
}

Response:
{
  success: boolean,
  data: {
    _id: string,
    orderId: string,
    buyerId: string,
    rating: number,
    comments: string,
    createdAt: Date
  }
}
```

**GET /api/admin/ratings**
```javascript
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- startDate: ISO date string (optional)
- endDate: ISO date string (optional)
- rating: comma-separated numbers (optional, e.g., "1,2,3")
- buyerName: string (optional)
- lowRatingsOnly: boolean (optional)

Response:
{
  success: boolean,
  data: {
    ratings: Array<Rating>,
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    },
    filteredCount: number
  }
}
```

**GET /api/admin/ratings/stats**
```javascript
Query Parameters:
- startDate: ISO date string (optional)
- endDate: ISO date string (optional)
- rating: comma-separated numbers (optional)

Response:
{
  success: boolean,
  data: {
    averageRating: number,
    totalRatings: number,
    distribution: {
      1: { count: number, percentage: number },
      2: { count: number, percentage: number },
      3: { count: number, percentage: number },
      4: { count: number, percentage: number },
      5: { count: number, percentage: number }
    },
    lowRatingsLast7Days: number
  }
}
```

**GET /api/admin/ratings/trends**
```javascript
Query Parameters:
- granularity: 'daily' | 'weekly' | 'monthly' (default: 'daily')
- startDate: ISO date string (optional, default: 90 days ago)
- endDate: ISO date string (optional, default: today)

Response:
{
  success: boolean,
  data: {
    trends: Array<{
      date: string,
      averageRating: number,
      count: number
    }>,
    trendDirection: 'improving' | 'declining' | 'stable',
    trendPercentage: number
  }
}
```

**GET /api/admin/ratings/export**
```javascript
Query Parameters: (same as GET /api/admin/ratings)

Response:
Content-Type: text/csv
Content-Disposition: attachment; filename="milk-quality-ratings-{date}.csv"

CSV Format:
Order ID,Buyer Name,Rating,Comments,Submission Date
ORD123,John Doe,5,"Excellent quality",2024-01-15 10:30:00
...
```

## Data Models

### ChatMessage Model

```javascript
{
  orderId: {
    type: ObjectId,
    ref: 'Delivery',
    required: true,
    index: true
  },
  
  senderId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  
  senderRole: {
    type: String,
    enum: ['buyer', 'delivery_boy'],
    required: true
  },
  
  senderName: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 1000,
    trim: true
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}

// Compound indexes for efficient queries
indexes: [
  { orderId: 1, createdAt: 1 },
  { orderId: 1, isRead: 1 }
]
```

### MilkQualityRating Model

```javascript
{
  orderId: {
    type: ObjectId,
    ref: 'Delivery',
    required: true,
    unique: true, // Prevent duplicate ratings
    index: true
  },
  
  buyerId: {
    type: ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be an integer'
    }
  },
  
  comments: {
    type: String,
    default: '',
    maxlength: 500,
    trim: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true, // Prevent modification
    index: true
  }
}

// Indexes for efficient queries
indexes: [
  { createdAt: -1 },
  { rating: 1 },
  { buyerId: 1, createdAt: -1 }
]
```

### Delivery Model Updates

Add the following fields to the existing Delivery model:

```javascript
{
  // ... existing fields ...
  
  chatEnabled: {
    type: Boolean,
    default: true
  },
  
  lastChatActivity: {
    type: Date,
    default: null
  },
  
  unreadMessagesCount: {
    buyer: { type: Number, default: 0 },
    deliveryBoy: { type: Number, default: 0 }
  },
  
  milkQualityRated: {
    type: Boolean,
    default: false
  },
  
  milkQualityRatingId: {
    type: ObjectId,
    ref: 'MilkQualityRating',
    default: null
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Call Button Visibility Based on Order Status

*For any* order, the call button should be visible to buyers and delivery boys if and only if the order status is "Accepted" or "Out for Delivery".

**Validates: Requirements 1.1, 1.4, 2.1**

### Property 2: Tel Link Format Correctness

*For any* user with a valid phone number, the generated tel: link should follow the format `tel:+{countryCode}{phoneNumber}` or `tel:{phoneNumber}`.

**Validates: Requirements 1.2, 2.2**

### Property 3: Chat Interface Availability

*For any* order, the chat interface should be available if the order status is "Accepted", "Out for Delivery", or "Completed" within 24 hours of completion.

**Validates: Requirements 3.1**

### Property 4: Message Persistence Round Trip

*For any* valid message sent by an authorized user, retrieving the chat history should return that message with all its properties intact (orderId, senderId, message content, timestamp).

**Validates: Requirements 3.3**

### Property 5: Bidirectional Messaging

*For any* order with an assigned delivery boy, both the buyer and the delivery boy should be able to send messages to the chat.

**Validates: Requirements 3.6**

### Property 6: Read-Only Chat for Old Orders

*For any* order completed more than 24 hours ago, attempting to send a new message should be rejected, but retrieving message history should succeed.

**Validates: Requirements 3.7**

### Property 7: Chronological Message Ordering

*For any* set of messages for an order, when retrieved, they should be sorted by timestamp in ascending order (oldest first).

**Validates: Requirements 4.1**

### Property 8: Message Display Completeness

*For any* message, the rendered output should contain the sender's name, the message content, and a timestamp.

**Validates: Requirements 4.2, 4.3**

### Property 9: Unread Message Indicator

*For any* message where isRead is false, the UI should display an unread indicator.

**Validates: Requirements 4.4**

### Property 10: Mark as Read on Open

*For any* order's chat, when a user opens the chat interface, all unread messages for that user should be marked as read (isRead = true).

**Validates: Requirements 4.5**

### Property 11: Unread Count Accuracy

*For any* order, the displayed unread count should equal the number of messages where isRead is false for the current user.

**Validates: Requirements 4.6**

### Property 12: Buyer Chat Authorization

*For any* buyer and any order, the buyer should be able to access chat history if and only if the order's buyer ID matches the buyer's ID.

**Validates: Requirements 5.1**

### Property 13: Delivery Boy Chat Authorization

*For any* delivery boy and any order, the delivery boy should be able to access chat history if and only if the order's deliveryPersonId matches the delivery boy's ID.

**Validates: Requirements 5.2**

### Property 14: Unauthorized Access Rejection

*For any* user attempting to access chat for an order they are not authorized for, the system should return a 403 Forbidden error.

**Validates: Requirements 5.3**

### Property 15: Message Sender Validation

*For any* message creation request, the senderId in the created message should match the authenticated user's ID.

**Validates: Requirements 5.4**

### Property 16: Message Content Sanitization

*For any* message containing HTML tags or script tags, the stored message should have those tags escaped or removed.

**Validates: Requirements 5.5, 14.3**

### Property 17: Rating Availability for Completed Orders

*For any* order with status "Completed", the rating submission interface should be available to the buyer.

**Validates: Requirements 6.1**

### Property 18: Rating Comment Length Validation

*For any* rating submission with comments exceeding 500 characters, the submission should be rejected with a validation error.

**Validates: Requirements 6.3**

### Property 19: Rating Persistence Completeness

*For any* rating submission, the persisted rating should contain orderId, buyerId, rating value, comments (if provided), and timestamp.

**Validates: Requirements 6.4**

### Property 20: Rating Time Window Validation

*For any* order completed more than 7 days ago, attempting to submit a rating should be rejected.

**Validates: Requirements 6.5**

### Property 21: Rating Uniqueness (Idempotence)

*For any* order, attempting to submit a second rating should be rejected with a duplicate error.

**Validates: Requirements 6.6**

### Property 22: Rating Value Validation

*For any* rating value that is not an integer between 1 and 5 inclusive, the submission should be rejected with a validation error.

**Validates: Requirements 6.7**

### Property 23: Rating Display Completeness

*For any* rating displayed in the admin dashboard, it should show Order ID, Buyer name, star rating, comments, and submission date.

**Validates: Requirements 7.2**

### Property 24: Star Rating Visual Formatting

*For any* rating, the rendered output should contain visual star icons corresponding to the rating value.

**Validates: Requirements 7.3**

### Property 25: Ratings Chronological Ordering

*For any* set of ratings retrieved for the admin dashboard, they should be sorted by createdAt in descending order (newest first).

**Validates: Requirements 7.4**

### Property 26: Pagination Limit

*For any* page of ratings, the result should contain at most 20 ratings.

**Validates: Requirements 7.5**

### Property 27: Filter Result Count Accuracy

*For any* applied filter, the displayed filtered count should equal the number of ratings matching the filter criteria.

**Validates: Requirements 8.5**

### Property 28: CSV Export Completeness

*For any* set of filtered ratings, the CSV export should contain all ratings in that set.

**Validates: Requirements 9.2**

### Property 29: CSV Column Completeness

*For any* CSV export, it should contain columns for Order ID, Buyer Name, Rating, Comments, and Date.

**Validates: Requirements 9.3**

### Property 30: CSV Format Validity

*For any* CSV export, the output should be valid CSV format with UTF-8 encoding and proper escaping of special characters.

**Validates: Requirements 9.4**

### Property 31: Average Rating Calculation

*For any* set of ratings, the calculated average should equal the sum of all rating values divided by the count of ratings.

**Validates: Requirements 10.1**

### Property 32: Rating Distribution Sum

*For any* set of ratings, the sum of counts in the distribution (1-star + 2-star + 3-star + 4-star + 5-star) should equal the total number of ratings.

**Validates: Requirements 10.2**

### Property 33: Distribution Percentage Sum

*For any* rating distribution, the sum of all percentages should equal 100% (within rounding tolerance of 0.1%).

**Validates: Requirements 10.3**

### Property 34: Filtered Metrics Accuracy

*For any* applied filter, the calculated metrics (average, distribution) should only include ratings matching the filter criteria.

**Validates: Requirements 10.6**

### Property 35: Trend Direction Calculation

*For any* time series of average ratings, the trend direction should be "improving" if the latest period average is higher than the earliest, "declining" if lower, and "stable" if within 0.1 difference.

**Validates: Requirements 11.5**

### Property 36: Low Rating Highlighting

*For any* rating of 3 stars or below, the rendered output should contain a warning color class (yellow for 3 stars, red for 1-2 stars).

**Validates: Requirements 12.1**

### Property 37: Low Rating Count Accuracy

*For any* time period, the displayed low rating count should equal the number of ratings with value ≤ 3 in that period.

**Validates: Requirements 12.3**

### Property 38: Low Rating Severity Sorting

*For any* set of low ratings (≤3 stars), when sorted by severity, they should be ordered by rating value in ascending order (1-star first, then 2-star, then 3-star).

**Validates: Requirements 12.4**

### Property 39: Rating Immutability

*For any* persisted rating, attempting to modify the rating value or comments should be rejected.

**Validates: Requirements 13.1, 13.2**

### Property 40: Admin Rating Modification Prevention

*For any* admin user, attempting to edit or delete a rating through the API should be rejected with a forbidden error.

**Validates: Requirements 13.3**

### Property 41: Rating Submission Audit Log

*For any* rating submission, there should be a corresponding audit log entry with timestamp and buyer identification.

**Validates: Requirements 13.4**

### Property 42: Admin Access Audit Trail

*For any* admin access to ratings data, there should be a corresponding audit log entry.

**Validates: Requirements 13.5**

### Property 43: Message Length Validation

*For any* message with length less than 1 or greater than 1000 characters, the submission should be rejected with a validation error.

**Validates: Requirements 14.1**

### Property 44: Whitespace-Only Message Rejection

*For any* message containing only whitespace characters, the submission should be rejected.

**Validates: Requirements 14.2**

### Property 45: Message Whitespace Trimming

*For any* message with leading or trailing whitespace, the stored message should have that whitespace removed.

**Validates: Requirements 14.4**

### Property 46: Validation Error Message Specificity

*For any* validation failure (message or rating), the error response should contain a specific error message indicating the validation rule that failed.

**Validates: Requirements 14.5**

### Property 47: Phone Number Privacy

*For any* API response or log entry, phone numbers should not be exposed in plain text (should be masked or excluded).

**Validates: Requirements 17.4**

### Property 48: Notification Event Emission

*For any* new message sent, a notification event should be emitted to the recipient.

**Validates: Requirements 18.5**

## Error Handling

### Chat System Errors

**Authorization Errors**:
- **CHAT_UNAUTHORIZED**: User is not authorized to access this chat (403)
- **ORDER_NOT_FOUND**: Order does not exist (404)
- **CHAT_DISABLED**: Chat is disabled for this order (403)

**Validation Errors**:
- **MESSAGE_TOO_SHORT**: Message must be at least 1 character (400)
- **MESSAGE_TOO_LONG**: Message exceeds 1000 character limit (400)
- **MESSAGE_EMPTY**: Message contains only whitespace (400)
- **INVALID_ORDER_STATUS**: Chat not available for this order status (400)
- **CHAT_EXPIRED**: Cannot send messages to orders completed >24 hours ago (400)

**Rate Limiting Errors**:
- **RATE_LIMIT_EXCEEDED**: Too many messages sent, please wait (429)

### Rating System Errors

**Authorization Errors**:
- **RATING_UNAUTHORIZED**: Only the buyer can rate this order (403)
- **ORDER_NOT_FOUND**: Order does not exist (404)

**Validation Errors**:
- **INVALID_RATING_VALUE**: Rating must be an integer between 1 and 5 (400)
- **COMMENTS_TOO_LONG**: Comments exceed 500 character limit (400)
- **ORDER_NOT_COMPLETED**: Can only rate completed orders (400)
- **RATING_WINDOW_EXPIRED**: Rating window has expired (>7 days) (400)
- **DUPLICATE_RATING**: This order has already been rated (400)

**Business Logic Errors**:
- **NO_DELIVERY_PERSON**: Cannot rate order without assigned delivery person (400)

### Admin Dashboard Errors

**Authorization Errors**:
- **ADMIN_ACCESS_REQUIRED**: Only administrators can access ratings dashboard (403)

**Validation Errors**:
- **INVALID_DATE_RANGE**: End date must be after start date (400)
- **INVALID_RATING_FILTER**: Rating filter must contain values 1-5 (400)
- **INVALID_PAGE_NUMBER**: Page number must be positive (400)

**Export Errors**:
- **EXPORT_FAILED**: Failed to generate CSV export (500)
- **NO_DATA_TO_EXPORT**: No ratings match the current filters (404)

### Error Response Format

All errors follow the consistent format:

```javascript
{
  success: false,
  error: {
    code: string,
    message: string,
    details: object (optional)
  }
}
```

### Error Logging Strategy

- **Client Errors (4xx)**: Log at INFO level with sanitized request data
- **Server Errors (5xx)**: Log at ERROR level with full stack trace
- **Security Events**: Log unauthorized access attempts at WARN level
- **Audit Events**: Log all rating submissions and admin access at INFO level

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific order status scenarios (Pending, Accepted, Out for Delivery, Completed)
- Edge cases like orders completed exactly 24 hours ago
- Error conditions and validation failures
- Integration between chat and notification systems
- CSV export format validation

**Property-Based Tests**: Verify universal properties across all inputs
- Authorization rules hold for all user/order combinations
- Message sanitization works for all possible input strings
- Rating calculations are correct for all possible rating sets
- Sorting and filtering work correctly for all data combinations

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Library**: Use `fast-check` for JavaScript/TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: buyer-delivery-communication-and-ratings, Property {number}: {property_text}`

### Test Categories

#### 1. Chat Authorization Tests

**Unit Tests**:
- Buyer can access their own order chat
- Buyer cannot access another buyer's order chat
- Delivery boy can access assigned order chat
- Delivery boy cannot access unassigned order chat
- Admin cannot access chat (not a participant)

**Property Tests**:
- Property 12: Buyer chat authorization holds for all buyer/order combinations
- Property 13: Delivery boy chat authorization holds for all delivery boy/order combinations
- Property 14: Unauthorized access is rejected for all invalid combinations

#### 2. Message Validation Tests

**Unit Tests**:
- Empty message is rejected
- Message with only spaces is rejected
- Message with exactly 1 character is accepted
- Message with exactly 1000 characters is accepted
- Message with 1001 characters is rejected
- HTML tags are sanitized
- Script tags are removed

**Property Tests**:
- Property 16: Message sanitization works for all strings containing HTML/script tags
- Property 43: Message length validation works for all string lengths
- Property 44: Whitespace-only messages are rejected for all whitespace combinations
- Property 45: Whitespace trimming works for all strings with leading/trailing whitespace

#### 3. Message Ordering and Display Tests

**Unit Tests**:
- Messages are displayed in chronological order
- Sender name is displayed for each message
- Timestamp is displayed for each message
- Unread indicator appears for unread messages

**Property Tests**:
- Property 7: Chronological ordering holds for all message sets
- Property 8: Message display completeness holds for all messages
- Property 9: Unread indicator appears for all unread messages

#### 4. Rating Validation Tests

**Unit Tests**:
- Rating value 0 is rejected
- Rating value 1 is accepted
- Rating value 5 is accepted
- Rating value 6 is rejected
- Rating value 3.5 (non-integer) is rejected
- Comments with 500 characters are accepted
- Comments with 501 characters are rejected
- Duplicate rating is rejected
- Rating after 7 days is rejected

**Property Tests**:
- Property 22: Rating value validation works for all numbers
- Property 18: Comment length validation works for all string lengths
- Property 21: Rating uniqueness holds for all duplicate attempts
- Property 20: Time window validation works for all completion dates

#### 5. Rating Calculation Tests

**Unit Tests**:
- Average of [5, 5, 5] is 5.0
- Average of [1, 2, 3, 4, 5] is 3.0
- Distribution of [1, 1, 2, 5, 5] is correct
- Percentages sum to 100%

**Property Tests**:
- Property 31: Average calculation is correct for all rating sets
- Property 32: Distribution sum equals total for all rating sets
- Property 33: Percentage sum equals 100% for all distributions
- Property 34: Filtered metrics only include filtered ratings

#### 6. CSV Export Tests

**Unit Tests**:
- CSV header row contains all required columns
- CSV escapes commas in comments
- CSV escapes quotes in comments
- CSV uses UTF-8 encoding
- Empty result set produces header-only CSV

**Property Tests**:
- Property 28: CSV export contains all filtered ratings
- Property 29: CSV contains all required columns for all exports
- Property 30: CSV format is valid for all data sets

#### 7. Authorization and Security Tests

**Unit Tests**:
- Phone numbers are not in API responses
- Phone numbers are not in log files
- Rating modification returns 403
- Rating deletion returns 403
- Audit log is created on rating submission

**Property Tests**:
- Property 39: Rating immutability holds for all modification attempts
- Property 40: Admin modification prevention holds for all admin users
- Property 41: Audit log exists for all rating submissions
- Property 47: Phone numbers are masked in all API responses

### Integration Tests

- End-to-end chat flow: Send message → Poll for new messages → Mark as read
- End-to-end rating flow: Complete order → Submit rating → View in admin dashboard
- Filter and export flow: Apply filters → Verify filtered results → Export CSV → Verify CSV content
- Notification integration: Send message → Verify notification event emitted

### Performance Tests

- Chat polling with 100 concurrent users
- Admin dashboard load time with 10,000 ratings
- CSV export with 50,000 ratings
- Message history retrieval with 1,000 messages per order

### Test Data Generators

For property-based testing, create generators for:
- Random orders with various statuses and completion times
- Random users with buyer and delivery_boy roles
- Random messages with various lengths and content
- Random ratings with values 1-5 and comments
- Random date ranges for filtering

### Mocking Strategy

- Mock SMS/notification service for message notifications
- Mock file system for CSV export tests
- Mock authentication middleware for authorization tests
- Use in-memory MongoDB for database tests

