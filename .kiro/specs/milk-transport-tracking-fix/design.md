# Collector Transport Milk Management - Design Document

## Architecture Overview

This feature replicates the admin's transport milk management page for collectors with an additional edit capability for today's records. The implementation leverages existing backend infrastructure and follows the established UI patterns.

## Component Structure

### Frontend Components

#### 1. TransportMilk.jsx (Employee)
**Location:** `frontend/src/pages/employee/TransportMilk.jsx`

**Purpose:** Main page component for collector transport milk management

**State Management:**
```javascript
{
  transportData: null,           // Today's transport calculation
  transportRecords: [],          // List of transport records
  loading: boolean,              // Loading state
  error: string,                 // Error message
  editingRecord: null,           // Record being edited
  showEditModal: boolean         // Edit modal visibility
}
```

**Key Functions:**
- `fetchData()` - Fetch transport calculation and records
- `handleCreateTransport()` - Create new transport record
- `handleUpdateStatus(id, status)` - Update transport status
- `handleEditRecord(record)` - Open edit modal for today's record
- `handleSaveEdit(data)` - Save edited transport record
- `getStatusIcon(status)` - Return appropriate icon for status
- `getStatusColor(status)` - Return appropriate color for status

**UI Sections:**
1. Page Header with title and "Create Transport Record" button
2. Today's Transport Summary (3 cards: Collection, Sales, Transport)
3. Transport Records Table with actions
4. Edit Modal (for today's records only)

#### 2. EditTransportModal Component (Optional)
**Location:** `frontend/src/components/transport/EditTransportModal.jsx` (if extracted)

**Purpose:** Modal for editing today's transport record

**Props:**
- `record` - Transport record to edit
- `onSave` - Callback when save is clicked
- `onClose` - Callback when modal is closed

## API Integration

### Existing Endpoints (Reuse)

#### 1. Calculate Today's Transport
```
GET /api/transport/calculate
Response: {
  success: true,
  data: {
    date: "2024-03-08",
    totalMilkCollected: 500.5,
    totalMilkSold: 300.0,
    transportMilk: 200.5,
    collectionAmount: 22522.50,
    saleAmount: 13500.00,
    transportAmount: 9022.50
  }
}
```

#### 2. Get Transport Records
```
GET /api/transport/records?limit=10
Response: {
  success: true,
  data: {
    transports: [...],
    pagination: {...}
  }
}
```

#### 3. Create Transport Record
```
POST /api/transport/create
Body: {
  notes: "Daily transport record"
}
Response: {
  success: true,
  data: { transport record }
}
```

#### 4. Update Transport Status
```
PUT /api/transport/status/:id
Body: {
  status: "transported" | "completed",
  notes: "Optional notes"
}
Response: {
  success: true,
  data: { updated transport record }
}
```

### New Endpoint (To Add)

#### 5. Edit Transport Record
```
PUT /api/employee/transport/edit/:id
Body: {
  notes: "Updated notes",
  status: "pending" | "transported" | "completed"
}
Response: {
  success: true,
  data: { updated transport record }
}
```

**Validation:**
- Only allow editing records from today
- Validate status values
- Require authentication (employee role)

**Implementation Location:** `backend/src/controllers/transport.controller.js`

```javascript
export const editTransportRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes, status } = req.body;

  // Find the transport record
  const transport = await Transport.findById(id);
  
  if (!transport) {
    return res.status(404).json({
      success: false,
      error: {
        code: "TRANSPORT_NOT_FOUND",
        message: "Transport record not found"
      }
    });
  }

  // Check if record is from today
  const today = new Date();
  const recordDate = new Date(transport.date);
  const isToday = recordDate.toDateString() === today.toDateString();

  if (!isToday) {
    return res.status(400).json({
      success: false,
      error: {
        code: "EDIT_NOT_ALLOWED",
        message: "Only today's records can be edited"
      }
    });
  }

  // Validate status if provided
  if (status && !["pending", "transported", "completed"].includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_STATUS",
        message: "Status must be one of: pending, transported, completed"
      }
    });
  }

  // Update the record
  if (notes !== undefined) transport.notes = notes;
  if (status) transport.status = status;
  transport.transportedBy = req.user.id;

  await transport.save();

  const updatedTransport = await Transport.findById(id)
    .populate('transportedBy', 'username mobile');

  res.json({
    success: true,
    data: updatedTransport,
    message: "Transport record updated successfully"
  });
});
```

## Database Schema

### Transport Model (Existing)
**Location:** `backend/src/models/Transport.model.js`

```javascript
{
  date: Date,                    // Transport date
  totalMilkCollected: Number,    // Total milk collected (liters)
  totalMilkSold: Number,         // Total milk sold to buyers (liters)
  transportMilk: Number,         // Milk to be transported (liters)
  collectionAmount: Number,      // Total collection amount (₹)
  saleAmount: Number,            // Total sales amount (₹)
  transportAmount: Number,       // Transport milk value (₹)
  status: String,                // pending, transported, completed
  notes: String,                 // Optional notes
  transportedBy: ObjectId,       // Reference to User (employee)
  createdAt: Date,
  updatedAt: Date
}
```

No schema changes required - existing model supports all needed fields.

## UI/UX Design

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Transport Milk Management          [Create Transport Record]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Today's Transport Summary (2024-03-08)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ 🥛 Total     │  │ 💰 Sales to  │  │ 🚚 Transport │      │
│  │ Collection   │  │ Buyers       │  │ Milk         │      │
│  │ 500.5 L      │  │ 300.0 L      │  │ 200.5 L      │      │
│  │ ₹22,522.50   │  │ ₹13,500.00   │  │ ₹9,022.50    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  Note: You have 200.5 liters ready for transport            │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  Transport Records                                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Date       │ Collection│ Sales │ Transport│ Status   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 2024-03-08 │ 500.5 L   │ 300 L │ 200.5 L  │ 🟡 Pending│  │
│  │            │           │       │ ₹9,022   │ [Actions] │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 2024-03-07 │ 480.0 L   │ 280 L │ 200.0 L  │ ✅ Complete│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Edit Modal (Today's Records Only)

```
┌─────────────────────────────────────┐
│  Edit Transport Record              │
├─────────────────────────────────────┤
│                                     │
│  Date: 2024-03-08 (Today)          │
│                                     │
│  Collection: 500.5 L (Read-only)   │
│  Sales: 300.0 L (Read-only)        │
│  Transport: 200.5 L (Read-only)    │
│  Amount: ₹9,022.50 (Read-only)     │
│                                     │
│  Status: [Dropdown]                │
│  ○ Pending                         │
│  ○ Transported                     │
│  ○ Completed                       │
│                                     │
│  Notes: [Text Area]                │
│  ┌─────────────────────────────┐  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Cancel]  [Save Changes]          │
└─────────────────────────────────────┘
```

### Status Indicators

| Status      | Color  | Icon | Badge Style |
|-------------|--------|------|-------------|
| Pending     | Yellow | 🕐   | bg-yellow-100 text-yellow-800 |
| Transported | Blue   | 🚚   | bg-blue-100 text-blue-800 |
| Completed   | Green  | ✅   | bg-green-100 text-green-800 |

### Action Buttons

**For Today's Records:**
- Edit button (pencil icon) - Opens edit modal
- Status update buttons (if applicable)

**For Past Records:**
- No edit button
- Status update buttons (if status is not "completed")

## Navigation Integration

### Employee Sidebar
**Location:** `frontend/src/components/navigation/EmployeeSidebar.jsx`

Add new menu item:
```javascript
{
  name: 'Transport Milk',
  path: '/employee/transport-milk',
  icon: Truck,
  description: 'Manage milk transport records'
}
```

Place it after "Milk Collection" for logical grouping.

### Route Configuration
**Location:** `frontend/src/App.jsx` or routing file

Add route:
```javascript
<Route 
  path="/employee/transport-milk" 
  element={<TransportMilk />} 
/>
```

## Error Handling

### Frontend Error States

1. **Network Errors**
   - Display: "Unable to connect to server. Please check your connection."
   - Action: Retry button

2. **Duplicate Transport Record**
   - Display: "Transport record already exists for today."
   - Action: Refresh to see existing record

3. **Edit Not Allowed**
   - Display: "Only today's records can be edited."
   - Action: Close modal

4. **Invalid Status**
   - Display: "Invalid status value. Please select a valid status."
   - Action: Correct selection

### Backend Error Responses

```javascript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "User-friendly error message"
  }
}
```

**Error Codes:**
- `TRANSPORT_NOT_FOUND` - Transport record not found
- `TRANSPORT_EXISTS` - Transport record already exists for date
- `EDIT_NOT_ALLOWED` - Cannot edit past records
- `INVALID_STATUS` - Invalid status value
- `UNAUTHORIZED` - User not authorized

## Security Considerations

1. **Authentication**
   - All endpoints require employee authentication
   - Use existing auth middleware

2. **Authorization**
   - Only employees can access transport endpoints
   - Verify user role before allowing operations

3. **Data Validation**
   - Validate all input data
   - Sanitize notes field to prevent XSS
   - Validate date formats
   - Validate status enum values

4. **Edit Restrictions**
   - Only allow editing today's records
   - Prevent modification of calculated fields (collection, sales, transport amounts)
   - Log all edit operations for audit trail

## Performance Considerations

1. **Data Fetching**
   - Limit records to 10 most recent
   - Use pagination if needed in future
   - Cache transport calculation for 5 minutes

2. **Real-time Updates**
   - Refresh data after create/update operations
   - No automatic polling (manual refresh only)

3. **Loading States**
   - Show skeleton loaders during data fetch
   - Disable buttons during operations
   - Show progress indicators for long operations

## Testing Strategy

### Unit Tests
- Test transport calculation logic
- Test date validation (today vs past)
- Test status validation
- Test error handling

### Integration Tests
- Test create transport record flow
- Test update status flow
- Test edit today's record flow
- Test edit restriction for past records

### E2E Tests
- Test complete user journey from viewing to editing
- Test error scenarios
- Test navigation and routing

## Implementation Phases

### Phase 1: Basic Page Setup
1. Create TransportMilk.jsx component
2. Add navigation link
3. Implement data fetching
4. Display transport summary
5. Display transport records table

### Phase 2: Core Functionality
1. Implement create transport record
2. Implement status update
3. Add status indicators and icons
4. Add error handling

### Phase 3: Edit Feature
1. Add edit endpoint to backend
2. Create edit modal component
3. Implement edit functionality
4. Add validation for today-only editing
5. Test edit flow

### Phase 4: Polish
1. Add loading states
2. Improve error messages
3. Add success notifications
4. Responsive design adjustments
5. Final testing

## Rollout Plan

1. **Development** - Implement all features
2. **Testing** - Test with sample data
3. **Staging** - Deploy to staging environment
4. **User Acceptance** - Get feedback from collectors
5. **Production** - Deploy to production
6. **Monitoring** - Monitor for errors and performance

## Success Criteria

- ✅ Collectors can view transport summary
- ✅ Collectors can view transport records
- ✅ Collectors can create transport records
- ✅ Collectors can update transport status
- ✅ Collectors can edit today's records only
- ✅ Past records cannot be edited
- ✅ UI matches admin page style
- ✅ All operations complete within 2 seconds
- ✅ Error handling works correctly
- ✅ Navigation is intuitive
