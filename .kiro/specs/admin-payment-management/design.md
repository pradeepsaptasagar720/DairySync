# Design Document

## Overview

The Admin Payment Management System is a comprehensive financial management module that enables administrators to handle all payment operations across three key stakeholder groups: farmers, buyers, and employees. The system provides a unified interface for payment processing, tracking, and reporting while maintaining data integrity and security.

## Architecture

The system follows a modular architecture with separate components for each payment type while sharing common functionality:

```
Frontend (React)
├── Payment Pages
│   ├── FarmerPayments.jsx
│   ├── BuyerPayments.jsx
│   └── EmployeePayments.jsx
├── Shared Components
│   ├── PaymentForm.jsx
│   ├── PaymentTable.jsx
│   ├── PaymentFilters.jsx
│   └── PaymentModal.jsx
└── Services
    └── paymentService.js

Backend (Node.js/Express)
├── Models
│   ├── FarmerPayment.model.js (existing)
│   ├── BuyerPayment.model.js (new)
│   └── EmployeePayment.model.js (new)
├── Controllers
│   └── payment.controller.js (new)
├── Routes
│   └── payment.routes.js (new)
└── Services
    └── paymentService.js (new)
```

## Components and Interfaces

### Frontend Components

#### 1. FarmerPayments Component
- **Purpose**: Manage farmer payment operations
- **Features**: List, create, edit, search, filter farmer payments
- **Props**: None (uses internal state and API calls)
- **State**: payments, loading, filters, selectedPayment

#### 2. BuyerPayments Component
- **Purpose**: Manage buyer received amount tracking
- **Features**: List, create, edit, search, filter buyer payments
- **Props**: None (uses internal state and API calls)
- **State**: payments, loading, filters, selectedPayment

#### 3. EmployeePayments Component
- **Purpose**: Manage employee payment operations
- **Features**: List, create, edit, search, filter employee payments
- **Props**: None (uses internal state and API calls)
- **State**: payments, loading, filters, selectedPayment

#### 4. PaymentForm Component (Shared)
- **Purpose**: Reusable form for payment creation/editing
- **Props**: paymentType, initialData, onSubmit, onCancel
- **Features**: Form validation, dynamic fields based on payment type

#### 5. PaymentTable Component (Shared)
- **Purpose**: Display payments in tabular format
- **Props**: payments, columns, onEdit, onDelete, onView
- **Features**: Sorting, pagination, action buttons

#### 6. PaymentFilters Component (Shared)
- **Purpose**: Filter and search functionality
- **Props**: onFilterChange, paymentType
- **Features**: Date range, status, payment method, search filters

### Backend API Endpoints

#### Farmer Payments
- `GET /api/admin/payments/farmers` - Get all farmer payments
- `POST /api/admin/payments/farmers` - Create farmer payment
- `PUT /api/admin/payments/farmers/:id` - Update farmer payment
- `DELETE /api/admin/payments/farmers/:id` - Delete farmer payment
- `GET /api/admin/payments/farmers/export` - Export farmer payments

#### Buyer Payments
- `GET /api/admin/payments/buyers` - Get all buyer payments
- `POST /api/admin/payments/buyers` - Create buyer payment
- `PUT /api/admin/payments/buyers/:id` - Update buyer payment
- `DELETE /api/admin/payments/buyers/:id` - Delete buyer payment
- `GET /api/admin/payments/buyers/export` - Export buyer payments

#### Employee Payments
- `GET /api/admin/payments/employees` - Get all employee payments
- `POST /api/admin/payments/employees` - Create employee payment
- `PUT /api/admin/payments/employees/:id` - Update employee payment
- `DELETE /api/admin/payments/employees/:id` - Delete employee payment
- `GET /api/admin/payments/employees/export` - Export employee payments

#### Analytics
- `GET /api/admin/payments/analytics` - Get payment analytics
- `GET /api/admin/payments/summary` - Get payment summary

## Data Models

### BuyerPayment Model (New)
```javascript
{
  buyer: ObjectId (ref: User),
  buyerName: String,
  buyerMobile: String,
  amount: Number,
  paymentType: String (enum),
  paymentDate: Date,
  orderPeriod: {
    dateFrom: Date,
    dateTo: Date
  },
  processedBy: ObjectId (ref: User),
  status: String (enum),
  notes: String,
  referenceNumber: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

### EmployeePayment Model (New)
```javascript
{
  employee: ObjectId (ref: User),
  employeeName: String,
  employeeMobile: String,
  amount: Number,
  paymentType: String (enum),
  employeePaymentType: String (enum: salary, bonus, overtime, other),
  paymentDate: Date,
  paymentPeriod: {
    dateFrom: Date,
    dateTo: Date
  },
  processedBy: ObjectId (ref: User),
  status: String (enum),
  notes: String,
  referenceNumber: String (unique),
  createdAt: Date,
  updatedAt: Date
}
```

### FarmerPayment Model (Existing - Enhanced)
The existing FarmerPayment model already contains the necessary fields and will be used as-is.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Payment Reference Number Uniqueness
*For any* payment record created in the system, the reference number should be unique across all payment types (farmer, buyer, employee)
**Validates: Requirements 4.5**

### Property 2: Payment Amount Validation
*For any* payment amount entered, the value should be a positive number greater than zero
**Validates: Requirements 4.2**

### Property 3: Payment Date Validation
*For any* payment date selected, the date should not be in the future
**Validates: Requirements 4.3**

### Property 4: Payment Status Transitions
*For any* payment status change, the transition should follow valid state progression (pending → completed/cancelled)
**Validates: Requirements 7.5**

### Property 5: Payment Search Functionality
*For any* search query entered, the results should contain only payments matching the search criteria
**Validates: Requirements 5.1**

### Property 6: Payment Filter Consistency
*For any* combination of filters applied, the results should satisfy all filter conditions simultaneously
**Validates: Requirements 5.5**

### Property 7: Payment Export Data Integrity
*For any* payment export operation, the exported data should match the filtered payment records exactly
**Validates: Requirements 6.1**

### Property 8: Payment Audit Trail
*For any* payment modification operation, an audit log entry should be created with user identification and timestamp
**Validates: Requirements 9.2**

## Error Handling

### Frontend Error Handling
- **Network Errors**: Display user-friendly messages for API failures
- **Validation Errors**: Show inline validation messages for form fields
- **Loading States**: Display loading indicators during API calls
- **Empty States**: Show appropriate messages when no payments exist

### Backend Error Handling
- **Validation Errors**: Return structured error responses with field-specific messages
- **Database Errors**: Log errors and return generic error messages to clients
- **Authentication Errors**: Return 401 status for unauthorized access
- **Not Found Errors**: Return 404 status for non-existent resources

### Error Response Format
```javascript
{
  success: false,
  message: "Error description",
  errors: {
    field1: "Field-specific error message",
    field2: "Another field error"
  }
}
```

## Testing Strategy

### Unit Testing
- Test individual components with mock data
- Test API endpoints with various input scenarios
- Test validation functions with edge cases
- Test utility functions for calculations and formatting

### Property-Based Testing
- Test payment creation with randomly generated valid data
- Test search functionality with various query patterns
- Test filter combinations with random filter sets
- Test export functionality with different data sets
- Each property test should run minimum 100 iterations
- Tag format: **Feature: admin-payment-management, Property {number}: {property_text}**

### Integration Testing
- Test complete payment workflows from creation to completion
- Test cross-component interactions and data flow
- Test API integration with database operations
- Test authentication and authorization flows

### User Interface Testing
- Test responsive design across different screen sizes
- Test form interactions and validation feedback
- Test table sorting, pagination, and filtering
- Test modal dialogs and user interactions

The testing approach combines specific unit tests for concrete scenarios with property-based tests for comprehensive input coverage, ensuring both functional correctness and robust handling of edge cases.