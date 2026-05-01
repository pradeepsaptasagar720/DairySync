# Design Document: Role-Based Notification System

## Overview

The role-based notification system enables milk collectors to send targeted notifications to specific user roles (Farmers, Buyers, Delivery Boys, and Loan Feed Managers) through the Custom Updates page. The system displays a notification bell icon in the navigation header for all roles except Admin and Milk Collector, showing unread notification counts and providing access to a notification dropdown for viewing and managing notifications.

The system leverages the existing notification infrastructure (Notification model and controller) and extends it with:
- Frontend notification bell component with badge
- Notification dropdown UI
- Real-time polling mechanism for notification updates
- Role-based filtering and targeting
- Read/unread status management

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  DashboardLayout (Header)                                    │
│    └─ NotificationBell Component                             │
│         ├─ Badge (unread count)                              │
│         └─ NotificationDropdown                              │
│              ├─ NotificationList                             │
│              └─ Mark All Read Button                         │
│                                                               │
│  DairyTime Page (Custom Updates)                             │
│    └─ Enhanced notification form with role targeting         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Notification Routes                                         │
│    ├─ POST /api/notifications/send                           │
│    ├─ GET /api/notifications                                 │
│    ├─ GET /api/notifications/unread-count                    │
│    └─ PATCH /api/notifications/:id/read                      │
│                                                               │
│  Notification Controller                                     │
│    ├─ sendNotification()                                     │
│    ├─ getUserNotifications()                                 │
│    ├─ getUnreadCount()                                       │
│    ├─ markAsRead()                                           │
│    └─ markAllAsRead()                                        │
│                                                               │
│  Notification Service                                        │
│    ├─ createNotificationForRoles()                           │
│    ├─ resolveTargetUsers()                                   │
│    └─ filterByRole()                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  UserNotification Collection (NEW)                           │
│    ├─ userId (ref: User)                                     │
│    ├─ notificationId (ref: Notification)                     │
│    ├─ isRead (boolean)                                       │
│    ├─ readAt (Date)                                          │
│    └─ createdAt (Date)                                       │
│                                                               │
│  Notification Collection (EXISTING - Enhanced)               │
│    ├─ type, title, message                                   │
│    ├─ recipients (array of role strings)                     │
│    ├─ createdBy (ref: User)                                  │
│    └─ createdAt (Date)                                       │
│                                                               │
│  User Collection (EXISTING)                                  │
│    ├─ role (farmer, buyer, employee, admin)                  │
│    └─ employeeRole (milk_collector, delivery_boy, etc.)      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Notification Creation Flow:**
1. Milk collector fills notification form on Custom Updates page
2. Selects target roles (farmers, buyers, employees, or all)
3. Frontend sends POST request to `/api/notifications/send`
4. Backend resolves target users based on selected roles
5. Creates Notification document
6. Creates UserNotification documents for each target user
7. Returns success response

**Notification Retrieval Flow:**
1. User logs in, DashboardLayout mounts NotificationBell component
2. Component polls `/api/notifications/unread-count` every 30 seconds
3. Displays badge with unread count
4. When bell clicked, fetches `/api/notifications` (paginated)
5. Displays notifications in dropdown
6. User clicks notification → marks as read via PATCH request
7. Badge count updates automatically

## Components and Interfaces

### Frontend Components

#### NotificationBell Component

```typescript
interface NotificationBellProps {
  // No props needed - uses auth context for user info
}

interface NotificationBellState {
  unreadCount: number;
  isDropdownOpen: boolean;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}
```

**Responsibilities:**
- Display bell icon with badge
- Poll for unread count every 30 seconds
- Toggle dropdown visibility
- Fetch notifications when dropdown opens
- Handle mark as read actions

#### NotificationDropdown Component

```typescript
interface NotificationDropdownProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  loading: boolean;
}
```

**Responsibilities:**
- Display list of notifications
- Show empty state when no notifications
- Provide "Mark all as read" button
- Handle individual notification clicks
- Implement scrolling for long lists

#### NotificationItem Component

```typescript
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (notificationId: string) => void;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    name: string;
    role: string;
  };
}
```

**Responsibilities:**
- Display notification content
- Show read/unread visual state
- Format timestamp as relative time
- Truncate long messages
- Handle click to mark as read

### Backend API Endpoints

#### POST /api/notifications/send

```typescript
Request Body:
{
  title: string;
  message: string;
  recipients: string[]; // ["farmers", "buyers", "employees", "all"]
}

Response:
{
  success: boolean;
  data: {
    notificationId: string;
    sentToCount: number;
  };
  message: string;
}
```

#### GET /api/notifications

```typescript
Query Parameters:
{
  page?: number;      // default: 1
  limit?: number;     // default: 20
  unreadOnly?: boolean; // default: false
}

Response:
{
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasMore: boolean;
    };
  };
}
```

#### GET /api/notifications/unread-count

```typescript
Response:
{
  success: boolean;
  data: {
    count: number;
  };
}
```

#### PATCH /api/notifications/:id/read

```typescript
Response:
{
  success: boolean;
  data: {
    notificationId: string;
    isRead: boolean;
    readAt: string;
  };
}
```

#### PATCH /api/notifications/mark-all-read

```typescript
Response:
{
  success: boolean;
  data: {
    markedCount: number;
  };
}
```

### Backend Services

#### NotificationService

```typescript
class NotificationService {
  // Resolve target users based on role selection
  async resolveTargetUsers(recipients: string[]): Promise<User[]>
  
  // Create notification and user notification records
  async createNotificationForRoles(
    title: string,
    message: string,
    recipients: string[],
    createdBy: string
  ): Promise<{ notificationId: string; sentToCount: number }>
  
  // Get notifications for a specific user
  async getUserNotifications(
    userId: string,
    options: { page: number; limit: number; unreadOnly: boolean }
  ): Promise<{ notifications: Notification[]; pagination: Pagination }>
  
  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<number>
  
  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void>
  
  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<number>
}
```

## Data Models

### UserNotification Model (NEW)

```javascript
const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification",
    required: true
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userNotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, createdAt: -1 });
```

### Enhanced Notification Model

The existing Notification model will be used with minor enhancements:

```javascript
// Add index for efficient queries
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });
```

### Role Mapping Logic

```javascript
const ROLE_MAPPING = {
  farmers: { role: "farmer" },
  buyers: { role: "buyer" },
  employees: { 
    role: "employee",
    excludeEmployeeRoles: ["milk_collector"] // Exclude milk collectors
  },
  all: { 
    roles: ["farmer", "buyer", "employee"],
    excludeEmployeeRoles: ["milk_collector"],
    excludeRoles: ["admin"] // Exclude admin from "all"
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Notification Bell Visibility

*For any* logged-in user, the notification bell should be visible if and only if the user's role is Farmer, Buyer, or Employee (excluding milk_collector employee role).

**Validates: Requirements 1.1, 1.2**

### Property 2: Badge Count Accuracy

*For any* user with notifications, the badge count displayed should equal the number of UserNotification records where user matches the current user and isRead is false.

**Validates: Requirements 2.1, 2.2**

### Property 3: Badge Count Upper Bound Display

*For any* user with more than 99 unread notifications, the badge should display "99+" instead of the exact count.

**Validates: Requirements 2.3**

### Property 4: Notification Ordering

*For any* list of notifications retrieved for a user, the notifications should be ordered by createdAt timestamp in descending order (newest first).

**Validates: Requirements 3.3**

### Property 5: Role Targeting Correctness

*For any* notification sent with target roles R, the set of users who receive the notification should exactly match the set of users whose role is in R, excluding Admin and Milk Collector roles.

**Validates: Requirements 4.4**

### Property 6: Notification Persistence

*For any* notification created, if the system restarts or the user logs out and back in, the notification should still be retrievable with all its original data intact.

**Validates: Requirements 5.1, 5.2, 5.5**

### Property 7: Read Status Update

*For any* notification marked as read by a user, subsequent queries for that user's unread notifications should not include that notification.

**Validates: Requirements 6.1, 6.2**

### Property 8: Mark All Read Completeness

*For any* user who invokes "mark all as read", all UserNotification records for that user should have isRead set to true after the operation completes.

**Validates: Requirements 6.4**

### Property 9: Notification Content Sanitization

*For any* notification message containing HTML or script tags, the rendered output should escape these tags to prevent XSS attacks.

**Validates: Requirements 8.4**

### Property 10: Unread Count Query Performance

*For any* request to get unread count, the database query should use the compound index (user, isRead, createdAt) and complete within 500ms under normal load.

**Validates: Requirements 9.1**

### Property 11: Role Resolution Exclusion

*For any* notification sent to "employees" target, the resolved user list should not contain any users with employeeRole "milk_collector" or role "admin".

**Validates: Requirements 1.2, 4.4**

### Property 12: Notification Dropdown Closure

*For any* open notification dropdown, clicking outside the dropdown element should close the dropdown and set isDropdownOpen to false.

**Validates: Requirements 3.2**

### Property 13: Relative Time Format

*For any* notification timestamp, the displayed time should be in relative format (e.g., "2 hours ago") when less than 7 days old, and absolute format (date) when 7 days or older.

**Validates: Requirements 8.2**

### Property 14: Empty State Display

*For any* user with zero notifications, the notification dropdown should display an empty state message instead of an empty list.

**Validates: Requirements 3.5**

### Property 15: Notification Retrieval Time Window

*For any* request to retrieve notifications, only notifications created within the past 30 days should be returned.

**Validates: Requirements 5.4**

## Error Handling

### Frontend Error Scenarios

1. **API Unavailable**
   - Display bell in disabled state
   - Show tooltip: "Notifications temporarily unavailable"
   - Retry connection after 60 seconds

2. **Failed to Load Notifications**
   - Show error message in dropdown
   - Provide "Retry" button
   - Log error to console

3. **Failed to Mark as Read**
   - Retry operation once automatically
   - If still fails, show toast notification
   - Keep UI in sync with server state

4. **Network Timeout**
   - Show loading state for max 10 seconds
   - Display timeout error message
   - Provide manual refresh option

### Backend Error Scenarios

1. **Invalid Role Selection**
   - Return 400 Bad Request
   - Message: "At least one valid recipient role must be selected"

2. **Database Connection Error**
   - Return 503 Service Unavailable
   - Log error with full stack trace
   - Retry database operation once

3. **User Not Found**
   - Return 404 Not Found
   - Message: "User not found"

4. **Unauthorized Access**
   - Return 403 Forbidden
   - Message: "You do not have permission to send notifications"
   - Only milk collectors can send notifications

### Error Logging

All errors should be logged with:
- Timestamp
- User ID
- Action attempted
- Error message and stack trace
- Request payload (sanitized)

## Testing Strategy

### Unit Tests

**Frontend Unit Tests:**
- NotificationBell component rendering based on role
- Badge display logic (count, 99+ limit)
- Dropdown open/close behavior
- Mark as read click handlers
- Empty state rendering
- Error state rendering

**Backend Unit Tests:**
- Role resolution logic (farmers, buyers, employees, all)
- Exclusion of admin and milk_collector roles
- Notification creation with valid data
- Mark as read functionality
- Mark all as read functionality
- Unread count calculation
- Input validation (title, message, recipients)

### Property-Based Tests

**Property tests should run with minimum 100 iterations each:**

1. **Test Property 2: Badge Count Accuracy**
   - Generate random sets of notifications with random read states
   - Verify badge count matches unread count
   - **Feature: role-based-notification-system, Property 2: Badge count accuracy**

2. **Test Property 5: Role Targeting Correctness**
   - Generate random user sets with various roles
   - Send notification to random role combinations
   - Verify only correct users receive notifications
   - **Feature: role-based-notification-system, Property 5: Role targeting correctness**

3. **Test Property 7: Read Status Update**
   - Generate random notifications
   - Mark random subset as read
   - Verify unread queries exclude marked notifications
   - **Feature: role-based-notification-system, Property 7: Read status update**

4. **Test Property 8: Mark All Read Completeness**
   - Generate random notification sets for users
   - Invoke mark all as read
   - Verify all notifications are marked as read
   - **Feature: role-based-notification-system, Property 8: Mark all read completeness**

5. **Test Property 9: Notification Content Sanitization**
   - Generate random strings with HTML/script tags
   - Verify all tags are escaped in output
   - **Feature: role-based-notification-system, Property 9: Content sanitization**

6. **Test Property 11: Role Resolution Exclusion**
   - Generate random user sets including admins and milk collectors
   - Send notifications to "employees" or "all"
   - Verify excluded roles never receive notifications
   - **Feature: role-based-notification-system, Property 11: Role resolution exclusion**

### Integration Tests

1. **End-to-End Notification Flow**
   - Milk collector creates notification
   - Target users receive notification
   - Users can view and mark as read
   - Badge updates correctly

2. **Real-Time Polling**
   - Send notification while user is logged in
   - Verify badge updates within polling interval
   - Verify dropdown updates if open

3. **Multi-User Scenarios**
   - Multiple users with different roles
   - Send notifications to various role combinations
   - Verify each user sees only their notifications

4. **Performance Testing**
   - Load test with 1000+ users
   - Verify unread count query performance
   - Verify notification list query performance
   - Measure polling impact on server load

### Manual Testing Checklist

- [ ] Bell icon appears for Farmer, Buyer, Delivery Boy, Loan Feed Manager
- [ ] Bell icon does NOT appear for Admin and Milk Collector
- [ ] Badge shows correct unread count
- [ ] Badge shows "99+" for counts over 99
- [ ] Clicking bell opens dropdown
- [ ] Clicking outside dropdown closes it
- [ ] Notifications display in correct order (newest first)
- [ ] Clicking notification marks it as read
- [ ] "Mark all as read" button works correctly
- [ ] Empty state displays when no notifications
- [ ] Relative timestamps display correctly
- [ ] Long messages are truncated properly
- [ ] Milk collector can send notifications from Custom Updates page
- [ ] Role targeting works correctly (farmers, buyers, employees, all)
- [ ] Notifications persist across sessions
- [ ] Error states display appropriately
- [ ] Loading states display during API calls
- [ ] Success message shows after sending notification

## Performance Considerations

### Frontend Optimizations

1. **Polling Strategy**
   - Poll every 30 seconds for unread count (lightweight)
   - Only fetch full notifications when dropdown opens
   - Cancel pending requests when component unmounts

2. **Caching**
   - Cache notification list in component state
   - Only refetch when dropdown reopens after 60 seconds
   - Invalidate cache after mark as read actions

3. **Lazy Loading**
   - Load first 20 notifications initially
   - Implement "Load More" button for pagination
   - Avoid loading all notifications at once

### Backend Optimizations

1. **Database Indexing**
   - Compound index on (user, isRead, createdAt)
   - Index on (user, createdAt) for all notifications query
   - Index on user field for fast lookups

2. **Query Optimization**
   - Use projection to return only needed fields
   - Limit queries to 30-day window
   - Use aggregation pipeline for complex queries

3. **Caching Strategy**
   - Cache unread counts in Redis (optional future enhancement)
   - Invalidate cache on mark as read operations
   - TTL of 30 seconds for unread counts

## Security Considerations

1. **Authorization**
   - Only milk collectors can send notifications
   - Users can only view their own notifications
   - Users can only mark their own notifications as read

2. **Input Validation**
   - Sanitize notification title and message
   - Validate recipient role selections
   - Limit message length (max 1000 characters)
   - Limit title length (max 200 characters)

3. **XSS Prevention**
   - Escape all user-generated content
   - Use React's built-in XSS protection
   - Sanitize on both frontend and backend

4. **Rate Limiting**
   - Limit notification sends to 10 per minute per user
   - Limit API requests to 100 per minute per user
   - Implement exponential backoff for polling

## Future Enhancements

1. **WebSocket Support**
   - Replace polling with WebSocket connections
   - Real-time notification delivery
   - Reduced server load

2. **Push Notifications**
   - Browser push notifications for desktop
   - Mobile push notifications (if mobile app exists)

3. **Notification Preferences**
   - Allow users to configure notification types
   - Email digest options
   - Mute notifications temporarily

4. **Rich Notifications**
   - Support for images and links
   - Action buttons in notifications
   - Notification categories

5. **Analytics**
   - Track notification open rates
   - Measure engagement metrics
   - A/B testing for notification content
