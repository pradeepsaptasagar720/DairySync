# Design Document

## Overview

This design enhances the milk delivery system with two major improvements:

1. **Real-Time Milk Availability Updates**: Buyers will see accurate milk availability that automatically decreases when delivery boys accept orders. The system uses the existing `calculateSessionMilkCollection` function which already subtracts approved orders from total collected milk.

2. **Complete Delivery Workflow**: The delivery status flow will be enhanced from the current incomplete flow (Pending → Approved → Completed) to a complete flow (Pending → Approved → Out for Delivery → Completed) with proper UI controls and navigation support.

3. **Navigation Consistency**: All delivery role pages will have consistent back buttons for improved user experience.

The design leverages existing infrastructure including the 30-second polling mechanism in the buyer dashboard and the backend milk calculation functions.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  BuyerOverview (Dashboard)                                   │
│    ├─ Auto-refresh every 30s                                │
│    ├─ Manual refresh button                                 │
│    └─ PlaceOrderModal integration                           │
│                                                              │
│  PlaceOrderModal                                            │
│    ├─ Milk availability validation                          │
│    ├─ Order placement                                       │
│    └─ Dashboard refresh trigger on close                    │
│                                                              │
│  DeliveryRequests Page                                      │
│    ├─ Status transition buttons                             │
│    ├─ Navigation button (Out for Delivery)                  │
│    └─ Back button                                           │
│                                                              │
│  DeliveryHistory, DeliveryStats, DeliveryOverview Pages     │
│    └─ Back buttons                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Buyer Controller                                           │
│    └─ getMilkAvailability()                                │
│         └─ Calls calculateSessionMilkCollection()           │
│                                                              │
│  Delivery Controller                                        │
│    └─ updateDeliveryStatus()                               │
│         ├─ Validates status transitions                     │
│         └─ Updates order status                             │
│                                                              │
│  Milk Calculations Utility                                  │
│    └─ calculateSessionMilkCollection()                      │
│         ├─ Fetches milk entries for session                 │
│         ├─ Fetches orders with status "Approved" or         │
│         │   "Out for Delivery"                              │
│         └─ Returns available = collected - reserved         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                           │
├─────────────────────────────────────────────────────────────┤
│  MilkEntry Collection                                       │
│    └─ Stores milk collection data by session               │
│                                                              │
│  Delivery Collection                                        │
│    ├─ status: Pending | Approved | Out for Delivery |      │
│    │          Completed | Cancelled                         │
│    ├─ milkType: cow | buffalo                              │
│    ├─ quantity: Number                                      │
│    └─ deliveryDate: Date                                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Milk Availability Update Flow

```
1. Delivery Boy accepts order (Pending → Approved)
   ↓
2. Backend updates Delivery.status = "Approved"
   ↓
3. Buyer Dashboard polls every 30s
   ↓
4. Backend calculateSessionMilkCollection() runs
   ├─ Fetches milk entries for current session
   ├─ Fetches orders with status "Approved" or "Out for Delivery"
   ├─ Calculates: available = collected - reserved
   └─ Returns updated availability
   ↓
5. Frontend updates display with new availability
```

#### Order Placement Flow

```
1. Buyer opens PlaceOrderModal
   ↓
2. Modal fetches current milk availability
   ↓
3. Buyer selects milk type and quantity
   ↓
4. Frontend validates quantity against availability
   ↓
5. Buyer completes address and payment
   ↓
6. Order created with status "Pending"
   ↓
7. Modal closes and triggers dashboard refresh
   ↓
8. Dashboard immediately fetches updated availability
```

#### Delivery Workflow Flow

```
Order Status Transitions:

Pending
  ↓ (Delivery boy clicks "Accept Order")
Approved
  ↓ (Delivery boy clicks "Start Delivery")
Out for Delivery
  ↓ (Delivery boy clicks "Complete Delivery")
Completed

Alternative paths:
- Pending → Cancelled (Delivery boy declines)
- Any status → Cancelled (Buyer cancels within 10 min)
```

## Components and Interfaces

### Frontend Components

#### 1. BuyerOverview Component (Enhanced)

**Current State:**
- Already has 30-second polling for milk availability
- Already has manual refresh button
- Already integrates PlaceOrderModal

**Enhancements:**
- Add callback prop to PlaceOrderModal for triggering immediate refresh
- Ensure refresh function is accessible to PlaceOrderModal

**Interface:**
```typescript
interface BuyerOverviewProps {
  // No props - uses internal state
}

interface BuyerOverviewState {
  milkAvailability: {
    cowMilk: number;
    buffaloMilk: number;
    totalLiters: number;
    session: string;
  } | null;
  milkRates: {
    cow: number;
    buffalo: number;
  };
  loading: boolean;
  refreshing: boolean;
  lastUpdated: Date | null;
}

// Exposed function
window.refreshMilkAvailability: () => Promise<void>
```

#### 2. PlaceOrderModal Component (Enhanced)

**Current State:**
- Already fetches milk availability on open
- Already validates quantity against availability
- Already has 30-second refresh while modal is open
- Closes after successful order

**Enhancements:**
- Call parent dashboard refresh function on close after successful order
- Ensure immediate availability update after order placement

**Interface:**
```typescript
interface PlaceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  milkRates: {
    cow: number;
    buffalo: number;
  };
  dairyStatus: DairyStatus | null;
  onOrderSuccess?: () => void; // NEW: Callback for successful order
}
```

#### 3. DeliveryRequests Component (Enhanced)

**Current State:**
- Shows pending delivery requests
- Has buttons for Pending → Approved and Approved → Completed
- No back button

**Enhancements:**
- Add "Out for Delivery" intermediate status
- Update button logic:
  - Pending: Show "Accept Order" button
  - Approved: Show "Start Delivery" button
  - Out for Delivery: Show "Complete Delivery" and "Navigate" buttons
  - Completed: Show completion indicator
- Add back button to navigate to employee dashboard
- Add visual status indicators with colors

**Interface:**
```typescript
interface DeliveryRequestsProps {
  // No props - uses auth context
}

interface DeliveryRequest {
  _id: string;
  buyer: {
    name: string;
    username: string;
    mobile: string;
  };
  milkType: "cow" | "buffalo";
  quantity: number;
  totalAmount: number;
  address: string;
  liveLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    isLive: boolean;
  };
  status: "Pending" | "Approved" | "Out for Delivery" | "Completed" | "Cancelled";
  createdAt: Date;
  handledBy?: {
    name: string;
    username: string;
  };
}
```

#### 4. DeliveryHistory, DeliveryStats, DeliveryOverview Components (Enhanced)

**Current State:**
- No back buttons

**Enhancements:**
- Add back button to each page
- Back button navigates to employee dashboard (/employee/dashboard)
- Consistent styling across all pages

**Interface:**
```typescript
// Each component gets a back button in the header
// No interface changes needed - just UI enhancement
```

### Backend Components

#### 1. Milk Calculations Utility (Already Implemented)

**Function:** `calculateSessionMilkCollection(date, session, subtractOrders)`

**Current Implementation:**
- Fetches milk entries for the specified date and session
- If `subtractOrders` is true:
  - Fetches orders with status "Approved" or "Out for Delivery"
  - Calculates reserved milk by milk type
  - Returns available = collected - reserved
- Returns milk availability data

**No Changes Needed** - This function already implements the required logic.

**Interface:**
```typescript
async function calculateSessionMilkCollection(
  date: string,        // YYYY-MM-DD format
  session: string,     // "Morning" or "Evening"
  subtractOrders: boolean = true
): Promise<{
  cowMilk: number;              // Available cow milk
  buffaloMilk: number;          // Available buffalo milk
  cowMilkTotal: number;         // Total collected cow milk
  buffaloMilkTotal: number;     // Total collected buffalo milk
  cowMilkReserved: number;      // Reserved cow milk (approved orders)
  buffaloMilkReserved: number;  // Reserved buffalo milk (approved orders)
  totalLiters: number;          // Total available liters
  totalAmount: number;          // Total collection amount
  entryCount: number;           // Number of milk entries
  farmerCount: number;          // Number of unique farmers
  session: string;              // Session name
  date: string;                 // Date
}>
```

#### 2. Buyer Controller (Minor Enhancement)

**Function:** `getMilkAvailability()`

**Current Implementation:**
- Calls `calculateSessionMilkCollection()` with `subtractOrders=true`
- Returns milk availability data

**Enhancement:**
- Ensure cache-busting is supported (already handled by frontend with `?t=${Date.now()}`)
- No code changes needed

#### 3. Delivery Controller (Enhanced)

**Function:** `updateDeliveryStatus()`

**Current Implementation:**
- Updates delivery status
- Basic validation

**Enhancements:**
- Add status transition validation:
  - Pending can go to: Approved, Cancelled
  - Approved can go to: Out for Delivery, Cancelled
  - Out for Delivery can go to: Completed, Cancelled
  - Completed: No further transitions
  - Cancelled: No further transitions
- Prevent invalid transitions (e.g., Pending → Completed)
- Add timestamps for status changes

**Interface:**
```typescript
async function updateDeliveryStatus(
  req: Request,
  res: Response
): Promise<void> {
  // req.params.id: Delivery order ID
  // req.body.status: New status
  // req.body.notes: Optional notes
  
  // Validates transition
  // Updates status
  // Returns updated delivery
}
```

### Database Schema

#### Delivery Model (Existing - No Changes)

```javascript
{
  buyer: ObjectId,              // Reference to User
  milkType: String,             // "cow" | "buffalo"
  quantity: Number,             // Liters
  rate: Number,                 // Rate per liter
  totalAmount: Number,          // Total cost
  address: String,              // Delivery address
  deliveryDate: Date,           // Scheduled delivery date
  status: String,               // "Pending" | "Approved" | "Out for Delivery" | "Completed" | "Cancelled"
  paymentMethod: String,        // "cod" | "upi" | "card"
  paymentCompleted: Boolean,    // Payment status
  liveLocation: {               // Optional live location
    latitude: Number,
    longitude: Number,
    accuracy: Number,
    timestamp: Date,
    isLive: Boolean
  },
  handledBy: ObjectId,          // Reference to delivery boy
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date,            // Timestamp when completed
  cancelledAt: Date             // Timestamp when cancelled
}
```

**Note:** The Delivery model already supports "Out for Delivery" status in its enum. No schema changes needed.

## Data Models

### Status Transition Rules

```javascript
const STATUS_TRANSITIONS = {
  "Pending": ["Approved", "Cancelled"],
  "Approved": ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Completed", "Cancelled"],
  "Completed": [],  // Terminal state
  "Cancelled": []   // Terminal state
};

function isValidTransition(currentStatus, newStatus) {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}
```

### Milk Availability Calculation Logic

```javascript
// Pseudocode for calculateSessionMilkCollection
function calculateSessionMilkCollection(date, session, subtractOrders = true) {
  // Step 1: Get milk entries for session
  milkEntries = MilkEntry.find({ date, session });
  
  // Step 2: Calculate total collected
  cowMilkTotal = sum(milkEntries.map(e => e.cow.quantity));
  buffaloMilkTotal = sum(milkEntries.map(e => e.buffalo.quantity));
  
  // Step 3: Calculate reserved milk (if subtractOrders is true)
  if (subtractOrders) {
    acceptedOrders = Delivery.find({
      deliveryDate: date,
      status: { $in: ["Approved", "Out for Delivery"] }
    });
    
    cowMilkReserved = sum(
      acceptedOrders
        .filter(o => o.milkType === "cow")
        .map(o => o.quantity)
    );
    
    buffaloMilkReserved = sum(
      acceptedOrders
        .filter(o => o.milkType === "buffalo")
        .map(o => o.quantity)
    );
  } else {
    cowMilkReserved = 0;
    buffaloMilkReserved = 0;
  }
  
  // Step 4: Calculate available milk
  cowMilkAvailable = max(0, cowMilkTotal - cowMilkReserved);
  buffaloMilkAvailable = max(0, buffaloMilkTotal - buffaloMilkReserved);
  
  return {
    cowMilk: cowMilkAvailable,
    buffaloMilk: buffaloMilkAvailable,
    cowMilkTotal,
    buffaloMilkTotal,
    cowMilkReserved,
    buffaloMilkReserved,
    totalLiters: cowMilkAvailable + buffaloMilkAvailable,
    // ... other fields
  };
}
```

### UI Status Indicators

```javascript
const STATUS_CONFIG = {
  "Pending": {
    color: "yellow",
    icon: "⏳",
    bgClass: "bg-yellow-100",
    textClass: "text-yellow-800",
    borderClass: "border-yellow-200",
    button: "Accept Order",
    buttonColor: "bg-green-600 hover:bg-green-700"
  },
  "Approved": {
    color: "blue",
    icon: "✅",
    bgClass: "bg-blue-100",
    textClass: "text-blue-800",
    borderClass: "border-blue-200",
    button: "Start Delivery",
    buttonColor: "bg-purple-600 hover:bg-purple-700"
  },
  "Out for Delivery": {
    color: "purple",
    icon: "🚚",
    bgClass: "bg-purple-100",
    textClass: "text-purple-800",
    borderClass: "border-purple-200",
    button: "Complete Delivery",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
    secondaryButton: "Navigate",
    secondaryButtonColor: "bg-green-600 hover:bg-green-700"
  },
  "Completed": {
    color: "green",
    icon: "🎉",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
    borderClass: "border-green-200",
    button: null  // No action button
  },
  "Cancelled": {
    color: "red",
    icon: "❌",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    borderClass: "border-red-200",
    button: null  // No action button
  }
};
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 1.1 and 4.2 both test that approved orders reduce availability (consolidated into Property 1)
- Properties 1.5 and 4.5 both test that cancelled orders restore availability (consolidated into Property 2)
- Properties 1.3, 1.4, and 5.2, 5.3 are all UI timing/refresh examples (kept as examples, not properties)
- Property 2.6 and 6.5 both test status indicators (consolidated into Property 7)
- Property 2.7 is subsumed by the button rendering examples (6.1-6.4)

### Core Properties

**Property 1: Approved orders reduce milk availability**

*For any* order with milk type T and quantity Q, when the order status changes from Pending to Approved or Out for Delivery, the available milk for type T should decrease by Q liters.

**Validates: Requirements 1.1, 4.2**

---

**Property 2: Cancelled orders restore milk availability**

*For any* order with milk type T and quantity Q that was previously in Approved or Out for Delivery status, when the order status changes to Cancelled, the available milk for type T should increase by Q liters.

**Validates: Requirements 1.5, 4.5**

---

**Property 3: Milk availability calculation correctness**

*For any* date and session, the displayed milk availability should equal the total collected milk minus the sum of quantities from all orders with status Approved or Out for Delivery for that date.

**Validates: Requirements 1.2**

---

**Property 4: Status transition validation**

*For any* order with current status S, attempting to change to status T should succeed if and only if T is in the valid transitions list for S (Pending→[Approved, Cancelled], Approved→[Out for Delivery, Cancelled], Out for Delivery→[Completed, Cancelled]).

**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

---

**Property 5: Pending orders do not affect availability**

*For any* order with status Pending, the order should not be included in the milk availability calculation (i.e., milk should not be reserved for pending orders).

**Validates: Requirements 4.1**

---

**Property 6: Out for Delivery orders maintain reservation**

*For any* order with status Out for Delivery, the order should be included in the reserved milk calculation (i.e., milk remains reserved during delivery).

**Validates: Requirements 4.3**

---

**Property 7: Status indicator consistency**

*For any* order status (Pending, Approved, Out for Delivery, Completed, Cancelled), the system should return consistent visual indicators (color, icon, CSS classes) for that status.

**Validates: Requirements 2.6, 6.5**

---

**Property 8: Completed orders do not affect availability**

*For any* order with status Completed, the order should not be included in the milk availability calculation (milk was already reserved when status was Approved/Out for Delivery).

**Validates: Requirements 4.4**

---

**Property 9: Order list sorting by status**

*For any* list of orders, when sorted by status, orders should be grouped with Pending first, then Approved, then Out for Delivery, then Completed, then Cancelled.

**Validates: Requirements 6.6**

---

## Error Handling

### Status Transition Errors

**Invalid Transition Attempts:**
- When an invalid status transition is attempted (e.g., Pending → Completed), the system should:
  - Return HTTP 400 Bad Request
  - Provide error message: "Invalid status transition from {currentStatus} to {newStatus}"
  - Not modify the order status
  - Log the attempt for audit purposes

**Example:**
```javascript
// Attempting Pending → Completed
{
  "success": false,
  "message": "Invalid status transition from Pending to Completed. Valid transitions: Approved, Cancelled"
}
```

### Milk Availability Errors

**Insufficient Milk:**
- When a buyer attempts to order more milk than available:
  - Frontend validation prevents order submission
  - Display error popup with available quantity
  - Backend validation as fallback returns HTTP 400
  - Error message: "Insufficient milk available. Available: {available}L, Requested: {requested}L"

**Calculation Errors:**
- When milk availability calculation fails:
  - Return null/empty availability data
  - Display "Loading..." or "Unavailable" in UI
  - Log error for debugging
  - Retry on next polling cycle

### Navigation Errors

**Missing Location Data:**
- When navigation button is clicked but no live location is available:
  - Disable navigation button
  - Show message: "Live location not available for this order"
  - Provide fallback to text address

**Geolocation Errors:**
- When browser geolocation fails:
  - Display error message to user
  - Allow order to proceed without live location
  - Errors: Permission denied, Position unavailable, Timeout

### Concurrent Update Errors

**Race Conditions:**
- When multiple delivery boys try to accept the same order:
  - Use database-level locking or optimistic concurrency control
  - First successful update wins
  - Others receive HTTP 409 Conflict
  - Error message: "This order has already been accepted by another delivery boy"

**Stale Data:**
- When UI displays outdated order status:
  - Polling mechanism refreshes data every 30 seconds
  - Manual refresh button available
  - Optimistic UI updates with rollback on error

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of status transitions
- Edge cases (empty orders, zero availability)
- UI component rendering for each status
- Navigation button presence/absence
- Error conditions and error messages
- Integration between components

**Property-Based Tests** focus on:
- Universal properties across all orders and statuses
- Milk availability calculations with random data
- Status transition validation with all combinations
- Comprehensive input coverage through randomization

Both testing approaches are complementary and necessary for ensuring system correctness.

### Property-Based Testing Configuration

**Library:** For JavaScript/TypeScript, use `fast-check` library
**Minimum Iterations:** 100 runs per property test
**Test Tagging:** Each property test must reference its design document property

**Tag Format:**
```javascript
// Feature: enhanced-delivery-workflow-and-buyer-updates, Property 1: Approved orders reduce milk availability
```

### Unit Testing Strategy

**Frontend Unit Tests:**
- Test BuyerOverview component refresh mechanism
- Test PlaceOrderModal validation logic
- Test DeliveryRequests button rendering for each status
- Test back button navigation on all delivery pages
- Test status indicator rendering
- Mock API calls and test state updates

**Backend Unit Tests:**
- Test calculateSessionMilkCollection with various scenarios
- Test updateDeliveryStatus with valid and invalid transitions
- Test error responses for invalid transitions
- Test concurrent update handling

**Integration Tests:**
- Test end-to-end order placement and availability update
- Test complete delivery workflow from Pending to Completed
- Test cancellation and availability restoration
- Test polling mechanism and real-time updates

### Property-Based Testing Strategy

**Property 1 Test:**
```javascript
// Generate random orders with various milk types and quantities
// Change status to Approved
// Verify availability decreases by order quantity
// Run 100+ iterations with different random orders
```

**Property 2 Test:**
```javascript
// Generate random orders in Approved/Out for Delivery status
// Change status to Cancelled
// Verify availability increases by order quantity
// Run 100+ iterations
```

**Property 3 Test:**
```javascript
// Generate random milk entries and orders
// Calculate expected availability manually
// Compare with calculateSessionMilkCollection result
// Run 100+ iterations with different data sets
```

**Property 4 Test:**
```javascript
// Generate all possible status transition combinations
// Test each transition for validity
// Verify only valid transitions succeed
// Run 100+ iterations
```

**Property 5-9 Tests:**
- Similar approach with random data generation
- Verify properties hold across all generated inputs
- Minimum 100 iterations per test

### Test Coverage Goals

- **Line Coverage:** Minimum 80% for all modified files
- **Branch Coverage:** Minimum 75% for conditional logic
- **Property Coverage:** 100% of correctness properties must have tests
- **Status Transition Coverage:** 100% of valid and invalid transitions tested

### Manual Testing Checklist

- [ ] Place order and verify availability decreases immediately
- [ ] Accept order and verify availability updates for all buyers
- [ ] Complete full delivery workflow (Pending → Approved → Out for Delivery → Completed)
- [ ] Test navigation button with live location
- [ ] Test navigation button without live location
- [ ] Cancel order and verify availability restoration
- [ ] Test back buttons on all delivery pages
- [ ] Verify 30-second polling updates availability
- [ ] Test concurrent order acceptance by multiple delivery boys
- [ ] Verify status indicators display correctly for each status
- [ ] Test with zero milk availability
- [ ] Test with multiple orders of different types
