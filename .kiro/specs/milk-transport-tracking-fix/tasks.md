# Collector Transport Milk Management - Implementation Tasks

## Phase 1: Backend Setup

### 1.1 Add Edit Transport Endpoint
- [ ] Add `editTransportRecord` function to `backend/src/controllers/transport.controller.js`
- [ ] Implement today-only validation
- [ ] Implement status validation
- [ ] Add proper error handling
- [ ] Test endpoint with Postman/curl

### 1.2 Update Transport Routes
- [ ] Add PUT route `/api/employee/transport/edit/:id` to transport routes
- [ ] Ensure employee authentication middleware is applied
- [ ] Test route accessibility

## Phase 2: Frontend Component Creation

### 2.1 Create TransportMilk Component
- [ ] Create `frontend/src/pages/employee/TransportMilk.jsx`
- [ ] Set up component structure and state management
- [ ] Import required dependencies (React, api, icons)
- [ ] Add basic layout structure

### 2.2 Implement Data Fetching
- [ ] Create `fetchData()` function to fetch transport calculation and records
- [ ] Implement `useEffect` hook to fetch data on mount
- [ ] Add loading state handling
- [ ] Add error state handling

### 2.3 Implement Transport Summary Display
- [ ] Create summary cards section
- [ ] Display Total Collection (liters and amount)
- [ ] Display Sales to Buyers (liters and amount)
- [ ] Display Transport Milk (liters and amount)
- [ ] Add conditional note when transport milk > 0
- [ ] Style cards with appropriate colors and icons

### 2.4 Implement Transport Records Table
- [ ] Create records table structure
- [ ] Display columns: Date, Collection, Sales, Transport, Amount, Status, Actions
- [ ] Format dates and numbers appropriately
- [ ] Add empty state message when no records
- [ ] Make table responsive

## Phase 3: Core Functionality

### 3.1 Implement Create Transport Record
- [ ] Add "Create Transport Record" button in header
- [ ] Implement `handleCreateTransport()` function
- [ ] Show button only when transport milk > 0
- [ ] Call POST `/api/transport/create` endpoint
- [ ] Handle success response (refresh data)
- [ ] Handle error response (show error message)
- [ ] Add loading state during creation

### 3.2 Implement Status Update
- [ ] Create `handleUpdateStatus(id, status)` function
- [ ] Add "Mark Transported" button for pending records
- [ ] Add "Mark Completed" button for transported records
- [ ] Call PUT `/api/transport/status/:id` endpoint
- [ ] Handle success response (refresh data)
- [ ] Handle error response (show error message)
- [ ] Add loading state during update

### 3.3 Implement Status Indicators
- [ ] Create `getStatusIcon(status)` function
- [ ] Create `getStatusColor(status)` function
- [ ] Display status badges with appropriate colors
- [ ] Add icons for each status (Clock, Truck, CheckCircle)
- [ ] Style badges consistently

## Phase 4: Edit Functionality

### 4.1 Create Edit Modal Component
- [ ] Create edit modal structure (can be inline or separate component)
- [ ] Add modal state management (showEditModal, editingRecord)
- [ ] Display record details (read-only fields)
- [ ] Add status dropdown (editable)
- [ ] Add notes textarea (editable)
- [ ] Add Cancel and Save buttons
- [ ] Style modal appropriately

### 4.2 Implement Edit Logic
- [ ] Create `handleEditRecord(record)` function to open modal
- [ ] Check if record is from today before showing edit button
- [ ] Create `handleSaveEdit(data)` function
- [ ] Call PUT `/api/employee/transport/edit/:id` endpoint
- [ ] Handle success response (close modal, refresh data)
- [ ] Handle error response (show error message)
- [ ] Add validation for required fields

### 4.3 Add Edit Button to Table
- [ ] Add Edit button (pencil icon) to Actions column
- [ ] Show Edit button only for today's records
- [ ] Hide Edit button for past records
- [ ] Add click handler to open edit modal
- [ ] Style button consistently with other actions

## Phase 5: Navigation Integration

### 5.1 Add to Employee Sidebar
- [ ] Open `frontend/src/components/navigation/EmployeeSidebar.jsx`
- [ ] Add "Transport Milk" menu item
- [ ] Use Truck icon from lucide-react
- [ ] Place after "Milk Collection" menu item
- [ ] Set path to `/employee/transport-milk`

### 5.2 Add Route Configuration
- [ ] Open routing configuration file (App.jsx or routes file)
- [ ] Add route for `/employee/transport-milk`
- [ ] Link to TransportMilk component
- [ ] Ensure employee authentication is required
- [ ] Test navigation from sidebar

## Phase 6: Error Handling & Polish

### 6.1 Implement Error Handling
- [ ] Add error state display component
- [ ] Handle network errors gracefully
- [ ] Handle duplicate transport record error
- [ ] Handle edit not allowed error
- [ ] Handle invalid status error
- [ ] Add retry functionality for failed operations

### 6.2 Add Loading States
- [ ] Add loading spinner for initial data fetch
- [ ] Add loading state for create button
- [ ] Add loading state for status update buttons
- [ ] Add loading state for edit save button
- [ ] Disable buttons during operations

### 6.3 Add Success Notifications
- [ ] Add success message after creating transport record
- [ ] Add success message after updating status
- [ ] Add success message after editing record
- [ ] Auto-hide success messages after 3 seconds

### 6.4 Responsive Design
- [ ] Test on mobile devices
- [ ] Ensure table is scrollable on small screens
- [ ] Ensure modal is responsive
- [ ] Ensure summary cards stack properly on mobile
- [ ] Test all interactions on touch devices

## Phase 7: Testing

### 7.1 Unit Testing
- [ ] Test transport calculation logic
- [ ] Test date validation (today vs past)
- [ ] Test status validation
- [ ] Test error handling functions

### 7.2 Integration Testing
- [ ] Test create transport record flow
- [ ] Test update status flow
- [ ] Test edit today's record flow
- [ ] Test edit restriction for past records
- [ ] Test error scenarios

### 7.3 Manual Testing
- [ ] Test complete user journey
- [ ] Test with different data scenarios
- [ ] Test error cases
- [ ] Test on different browsers
- [ ] Test on different screen sizes

## Phase 8: Cleanup

### 8.1 Remove Old Transport Code
- [ ] Check MilkCollection.jsx for any transport-related code
- [ ] Remove transport-related state/functions if present
- [ ] Remove transport-related UI elements if present
- [ ] Test milk collection page still works correctly

### 8.2 Delete Old Spec Files
- [ ] Archive or delete old bugfix.md (if different from requirements.md)
- [ ] Delete property-based test file: `backend/src/__tests__/milkTransportWorkflowIntegration.property.test.js`
- [ ] Clean up any temporary test files
- [ ] Update .gitignore if needed

### 8.3 Documentation
- [ ] Add comments to complex functions
- [ ] Document API endpoints in backend
- [ ] Update README if needed
- [ ] Add user guide for collectors (optional)

## Phase 9: Deployment

### 9.1 Pre-deployment Checks
- [ ] Run all tests
- [ ] Check for console errors
- [ ] Check for console warnings
- [ ] Verify all features work as expected
- [ ] Get code review approval

### 9.2 Deployment
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Run smoke tests in production
- [ ] Monitor for errors
- [ ] Get user feedback

## Notes

- Focus on replicating the admin page structure and functionality
- The edit feature is the only addition - keep it simple
- Use existing API endpoints where possible
- Follow existing code patterns and styles
- Test thoroughly before deployment
- Get user feedback early and iterate

## Success Criteria

- ✅ All tasks completed
- ✅ All tests passing
- ✅ No console errors or warnings
- ✅ UI matches admin page style
- ✅ Edit functionality works for today's records only
- ✅ Navigation is intuitive
- ✅ Error handling is robust
- ✅ Performance is acceptable (< 2 seconds for operations)
