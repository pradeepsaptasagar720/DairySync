# Collector Transport Milk Management - Requirements

## Overview
Create a transport milk management page for collectors (employees) that mirrors the admin's transport milk page functionality, with an additional feature to edit today's transport data.

## User Story
As a milk collector/employee, I want to manage transport milk records similar to how the admin does, so that I can track milk that needs to be transported to external buyers/tankers and edit today's records when needed.

## Background
Currently, the admin has a dedicated Transport Milk page (`TransportMilk.jsx`) that shows:
- Today's transport summary (Total Collection, Sales to Buyers, Transport Milk)
- Transport records table with status tracking
- Ability to create transport records and update their status

The collector side needs the same functionality with one additional feature: the ability to edit today's transport data.

## Acceptance Criteria

### 1. Transport Summary Display
**Given** a collector is viewing the transport milk page  
**When** the page loads  
**Then** the system should display today's transport summary showing:
- Total milk collected (liters and amount)
- Total milk sold to buyers (liters and amount)
- Transport milk available (liters and amount)
- Current date

### 2. Create Transport Record
**Given** there is transport milk available (> 0 liters)  
**When** the collector clicks "Create Transport Record"  
**Then** the system should:
- Create a new transport record for today
- Include all calculated values (collection, sales, transport)
- Set initial status as "pending"
- Refresh the records list
- Show success confirmation

**And** if a transport record already exists for today  
**Then** the system should show an error message

### 3. View Transport Records
**Given** a collector is viewing the transport milk page  
**When** the page loads  
**Then** the system should display a table of transport records showing:
- Date
- Collection amount (liters)
- Sales amount (liters)
- Transport amount (liters)
- Total amount (₹)
- Status (pending, transported, completed)
- Actions (status update buttons)

**And** records should be sorted by date (most recent first)  
**And** limit to 10 most recent records

### 4. Update Transport Status
**Given** a transport record exists with status "pending"  
**When** the collector clicks "Mark Transported"  
**Then** the system should update the status to "transported"  
**And** refresh the records list

**Given** a transport record exists with status "transported"  
**When** the collector clicks "Mark Completed"  
**Then** the system should update the status to "completed"  
**And** refresh the records list

### 5. Edit Today's Transport Data (NEW FEATURE)
**Given** a transport record exists for today  
**When** the collector clicks "Edit" on today's record  
**Then** the system should:
- Show an edit modal/form with current values
- Allow editing of: notes, status
- Validate the inputs
- Save changes on submit
- Refresh the records list
- Show success confirmation

**And** only today's records should be editable  
**And** past records should not show edit option

### 6. Status Visual Indicators
**Given** transport records are displayed  
**When** viewing the status column  
**Then** each status should have:
- Pending: Yellow badge with clock icon
- Transported: Blue badge with truck icon
- Completed: Green badge with checkmark icon

### 7. Error Handling
**Given** any API operation fails  
**When** the error occurs  
**Then** the system should:
- Display a user-friendly error message
- Not crash or show blank screen
- Allow the user to retry the operation

### 8. Loading States
**Given** data is being fetched or saved  
**When** the operation is in progress  
**Then** the system should show appropriate loading indicators

## Technical Requirements

### Frontend
- Create new page: `frontend/src/pages/employee/TransportMilk.jsx`
- Use existing API endpoints from `backend/src/controllers/transport.controller.js`
- Match the UI/UX style of admin's TransportMilk page
- Add edit functionality for today's records only
- Use Lucide React icons for consistency
- Implement proper error handling and loading states

### Backend
- Use existing transport controller endpoints:
  - GET `/api/transport/calculate` - Get today's transport calculation
  - GET `/api/transport/records` - Get transport records list
  - POST `/api/transport/create` - Create new transport record
  - PUT `/api/transport/status/:id` - Update transport status
- Add new endpoint (if needed):
  - PUT `/api/transport/edit/:id` - Edit transport record (today only)

### Navigation
- Add "Transport Milk" link to employee sidebar navigation
- Place it near "Milk Collection" for logical grouping

## Out of Scope
- Complex workflow integration between collector and admin
- Real-time synchronization across interfaces
- Transport status tracking during collection
- Automatic transport record creation
- Historical data editing (only today's data can be edited)

## Success Metrics
- Collectors can view transport summary and records
- Collectors can create transport records when milk is available
- Collectors can update transport status
- Collectors can edit today's transport data
- UI matches admin page style and functionality
- All operations complete within 2 seconds
