# Design Document: Employee Salary Payment System

## Overview

The Employee Salary Payment System is a comprehensive payroll management module for the dairy management application. It enables administrators to manage employee salary structures, process payments through multiple methods, track payment history, generate salary slips, and handle deductions, advances, bonuses, and statutory compliance.

The system integrates with the existing User model (which already contains employee data including salary field) and extends it with dedicated salary management models. It supports three payment types: Monthly Salary, Daily Wages, and Hourly Rate, with attendance-based calculations for daily and hourly workers.

### Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Architecture**: RESTful API with MVC pattern
- **Authentication**: JWT-based authentication (existing system)
- **File Generation**: PDF generation for salary slips

### Key Features

1. Flexible salary structure management (monthly/daily/hourly)
2. Multi-method payment processing (Bank Transfer, Cash, UPI, Cheque)
3. Attendance-based salary calculations
4. Comprehensive deduction management (PF, ESI, TDS, advances, loans)
5. Bonus and incentive tracking
6. Automated salary slip generation
7. Bulk payment processing
8. Payment approval workflow
9. Tax calculation and compliance
10. Audit trail and security

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│  (Payment Management, Salary Configuration, Reports)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Express)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Salary     │  │   Payment    │  │   Report     │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Salary     │  │   Payment    │  │   Tax        │      │
│  │  Calculator  │  │  Processor   │  │  Calculator  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Slip       │  │   Advance    │  │   Audit      │      │
│  │  Generator   │  │  Manager     │  │  Logger      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (MongoDB)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Salary     │  │   Employee   │  │   Payment    │      │
│  │  Structure   │  │   Payment    │  │   Audit      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Advance    │  │   Salary     │  │   Tax        │      │
│  │   Record     │  │   Slip       │  │   Config     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **User Model**: Extends existing User model with salary-related references
2. **Notification System**: Sends payment notifications to employees
3. **Audit System**: Logs all payment operations
4. **Authentication**: Uses existing JWT middleware for API security

## Components and Interfaces

### 1. Salary Structure Model

Manages employee salary configurations including base salary, allowances, and deductions.

```javascript
// SalaryStructure.model.js
{
  employee: ObjectId (ref: User),
  employeeName: String,
  employeeUniqueId: String,
  
  paymentType: String (enum: ['monthly', 'daily', 'hourly']),
  baseSalary: Number,
  
  // For daily/hourly workers
  dailyRate: Number,
  hourlyRate: Number,
  overtimeRate: Number,
  
  // Allowances
  allowances: [{
    type: String (enum: ['HRA', 'DA', 'TA', 'Medical', 'Custom']),
    name: String,
    amount: Number,
    calculationMethod: String (enum: ['fixed', 'percentage']),
    percentage: Number,
    isActive: Boolean
  }],
  
  // Deductions
  deductions: [{
    type: String (enum: ['PF', 'ESI', 'TDS', 'Professional_Tax', 'Custom']),
    name: String,
    amount: Number,
    calculationMethod: String (enum: ['fixed', 'percentage']),
    percentage: Number,
    isActive: Boolean
  }],
  
  effectiveFrom: Date,
  effectiveTo: Date,
  isActive: Boolean,
  
  createdBy: ObjectId (ref: User),
  updatedBy: ObjectId (ref: User),
  
  timestamps: true
}
```

### 2. Employee Payment Model

Records individual salary payment transactions.

```javascript
// EmployeePayment.model.js
{
  employee: ObjectId (ref: User),
  employeeName: String,
  employeeUniqueId: String,
  employeeMobile: String,
  
  // Payment period
  billingPeriod: {
    dateFrom: Date,
    dateTo: Date,
    month: Number,
    year: Number
  },
  
  // Salary calculation
  salaryStructure: ObjectId (ref: SalaryStructure),
  paymentType: String (enum: ['monthly', 'daily', 'hourly']),
  baseSalary: Number,
  
  // Attendance data (for daily/hourly)
  daysWorked: Number,
  hoursWorked: Number,
  overtimeHours: Number,
  unpaidLeaveDays: Number,
  
  // Allowances breakdown
  allowances: [{
    type: String,
    name: String,
    amount: Number
  }],
  totalAllowances: Number,
  
  // Deductions breakdown
  deductions: [{
    type: String,
    name: String,
    amount: Number
  }],
  totalDeductions: Number,
  
  // Advance/Loan deductions
  advanceDeduction: Number,
  loanDeduction: Number,
  
  // Bonus/Incentive
  bonuses: [{
    type: String,
    reason: String,
    amount: Number
  }],
  totalBonuses: Number,
  
  // Calculated amounts
  grossSalary: Number,
  netPay: Number,
  
  // Payment details
  paymentMethod: String (enum: ['bank_transfer', 'cash', 'upi', 'cheque']),
  paymentDate: Date,
  paymentReference: String (unique),
  
  // Bank details (for bank transfer)
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String
  },
  
  // Cheque details
  chequeNumber: String,
  chequeDate: Date,
  
  // UPI details
  upiId: String,
  upiTransactionId: String,
  
  // Status tracking
  status: String (enum: ['pending', 'processing', 'completed', 'failed', 'cancelled']),
  approvalStatus: String (enum: ['pending_approval', 'approved', 'rejected']),
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  rejectionReason: String,
  
  completedAt: Date,
  failureReason: String,
  
  // Salary slip
  salarySlipGenerated: Boolean,
  salarySlipPath: String,
  salarySlipSentAt: Date,
  
  // Processing details
  processedBy: ObjectId (ref: User),
  notes: String,
  
  // Audit
  isPartialPayment: Boolean,
  partialPaymentReason: String,
  
  timestamps: true
}
```

### 3. Advance Record Model

Tracks employee advances and their repayment.

```javascript
// AdvanceRecord.model.js
{
  employee: ObjectId (ref: User),
  employeeName: String,
  employeeUniqueId: String,
  
  advanceAmount: Number,
  advanceDate: Date,
  reason: String,
  
  // Repayment terms
  repaymentType: String (enum: ['lump_sum', 'installments']),
  installmentAmount: Number,
  numberOfInstallments: Number,
  installmentsRemaining: Number,
  
  // Tracking
  amountRepaid: Number,
  outstandingBalance: Number,
  
  status: String (enum: ['active', 'fully_repaid', 'written_off']),
  
  // Linked payments
  repaymentHistory: [{
    payment: ObjectId (ref: EmployeePayment),
    amount: Number,
    date: Date
  }],
  
  approvedBy: ObjectId (ref: User),
  processedBy: ObjectId (ref: User),
  
  timestamps: true
}
```

### 4. Salary Slip Model

Stores generated salary slip metadata and file paths.

```javascript
// SalarySlip.model.js
{
  employee: ObjectId (ref: User),
  payment: ObjectId (ref: EmployeePayment),
  
  slipNumber: String (unique),
  month: Number,
  year: Number,
  
  filePath: String,
  fileUrl: String,
  
  generatedAt: Date,
  generatedBy: ObjectId (ref: User),
  
  emailSent: Boolean,
  emailSentAt: Date,
  emailTo: String,
  
  downloadCount: Number,
  lastDownloadedAt: Date,
  
  timestamps: true
}
```

### 5. Tax Configuration Model

Stores tax slabs and statutory deduction rates.

```javascript
// TaxConfig.model.js
{
  configName: String,
  financialYear: String,
  
  // TDS slabs
  tdsSlabs: [{
    minIncome: Number,
    maxIncome: Number,
    taxRate: Number,
    fixedAmount: Number
  }],
  
  // Statutory rates
  pfRate: Number,
  esiRate: Number,
  esiThreshold: Number,
  professionalTaxSlabs: [{
    minSalary: Number,
    maxSalary: Number,
    taxAmount: Number
  }],
  
  isActive: Boolean,
  effectiveFrom: Date,
  effectiveTo: Date,
  
  createdBy: ObjectId (ref: User),
  
  timestamps: true
}
```

### 6. Payment Audit Model

Logs all payment-related operations for audit trail.

```javascript
// PaymentAudit.model.js
{
  operationType: String (enum: ['create', 'update', 'delete', 'approve', 'reject', 'complete', 'fail']),
  entityType: String (enum: ['payment', 'salary_structure', 'advance', 'bulk_payment']),
  entityId: ObjectId,
  
  performedBy: ObjectId (ref: User),
  performedByName: String,
  performedByRole: String,
  
  changes: Object,
  previousState: Object,
  newState: Object,
  
  ipAddress: String,
  userAgent: String,
  
  timestamp: Date,
  
  timestamps: true
}
```

## Data Models

### Salary Calculation Flow

```
1. Get Salary Structure
   ↓
2. Calculate Base Amount
   - Monthly: baseSalary
   - Daily: dailyRate × daysWorked
   - Hourly: hourlyRate × hoursWorked + overtimeRate × overtimeHours
   ↓
3. Apply Allowances
   - Fixed allowances: add amount
   - Percentage allowances: add (baseAmount × percentage / 100)
   ↓
4. Calculate Gross Salary
   grossSalary = baseAmount + totalAllowances + totalBonuses
   ↓
5. Apply Deductions
   - Statutory: PF, ESI, TDS, Professional Tax
   - Advances: installment amount
   - Loans: installment amount
   - Penalties: fixed amounts
   ↓
6. Calculate Net Pay
   netPay = grossSalary - totalDeductions
   ↓
7. Validate Net Pay
   - Ensure netPay >= 0
   - If negative, flag for review
```

### Payment Reference Number Format

```
Format: EP{YYYYMMDD}{NNNN}
Example: EP202401150001

Where:
- EP: Employee Payment prefix
- YYYYMMDD: Payment date
- NNNN: Sequential number (4 digits, padded with zeros)
```

### Salary Slip Number Format

```
Format: SS{YYYY}{MM}{NNNN}
Example: SS20240100001

Where:
- SS: Salary Slip prefix
- YYYY: Year
- MM: Month (01-12)
- NNNN: Sequential number (4 digits, padded with zeros)
```

## API Endpoints

### Salary Structure Management

```
POST   /api/admin/salary/structure
GET    /api/admin/salary/structure/:employeeId
PUT    /api/admin/salary/structure/:id
DELETE /api/admin/salary/structure/:id
GET    /api/admin/salary/structures (with pagination, filters)
```

### Payment Processing

```
POST   /api/admin/salary/payment
GET    /api/admin/salary/payment/:id
PUT    /api/admin/salary/payment/:id
DELETE /api/admin/salary/payment/:id
GET    /api/admin/salary/payments (with pagination, filters)
POST   /api/admin/salary/payment/:id/approve
POST   /api/admin/salary/payment/:id/reject
POST   /api/admin/salary/payment/:id/complete
POST   /api/admin/salary/payment/bulk
```

### Advance Management

```
POST   /api/admin/salary/advance
GET    /api/admin/salary/advance/:id
PUT    /api/admin/salary/advance/:id
GET    /api/admin/salary/advances (with pagination, filters)
GET    /api/admin/salary/advance/employee/:employeeId
```

### Salary Slip

```
GET    /api/admin/salary/slip/:paymentId
POST   /api/admin/salary/slip/:paymentId/generate
POST   /api/admin/salary/slip/:paymentId/email
GET    /api/admin/salary/slip/:paymentId/download
```

### Reports and Analytics

```
GET    /api/admin/salary/dashboard
GET    /api/admin/salary/reports/monthly
GET    /api/admin/salary/reports/deductions
GET    /api/admin/salary/reports/payment-methods
POST   /api/admin/salary/reports/export
```

### Tax Configuration

```
POST   /api/admin/salary/tax-config
GET    /api/admin/salary/tax-config
PUT    /api/admin/salary/tax-config/:id
```

### Employee Profile Integration

```
GET    /api/admin/employee/:id/salary-info
GET    /api/admin/employee/:id/payment-history
GET    /api/admin/employee/:id/advances
```

## Service Layer

### 1. Salary Calculator Service

```javascript
class SalaryCalculatorService {
  // Calculate salary based on payment type
  calculateSalary(salaryStructure, attendanceData, billingPeriod)
  
  // Calculate base amount
  calculateBaseAmount(paymentType, baseSalary, dailyRate, hourlyRate, attendance)
  
  // Calculate allowances
  calculateAllowances(baseAmount, allowances)
  
  // Calculate deductions
  calculateDeductions(grossSalary, deductions, taxConfig)
  
  // Calculate statutory deductions
  calculatePF(basicSalary, pfRate)
  calculateESI(grossSalary, esiRate, esiThreshold)
  calculateTDS(annualIncome, tdsSlabs)
  calculateProfessionalTax(monthlySalary, ptSlabs)
  
  // Calculate net pay
  calculateNetPay(grossSalary, totalDeductions)
  
  // Validate calculations
  validateSalaryCalculation(calculationResult)
}
```

### 2. Payment Processor Service

```javascript
class PaymentProcessorService {
  // Process single payment
  processPayment(paymentData, adminId)
  
  // Process bulk payments
  processBulkPayments(employeeIds, billingPeriod, paymentMethod, adminId)
  
  // Update payment status
  updatePaymentStatus(paymentId, status, reason)
  
  // Complete payment
  completePayment(paymentId, adminId)
  
  // Fail payment
  failPayment(paymentId, reason, adminId)
  
  // Cancel payment
  cancelPayment(paymentId, reason, adminId)
  
  // Generate payment reference
  generatePaymentReference(paymentDate)
  
  // Validate payment
  validatePayment(paymentData)
  
  // Check duplicate payment
  checkDuplicatePayment(employeeId, billingPeriod)
}
```

### 3. Advance Manager Service

```javascript
class AdvanceManagerService {
  // Create advance record
  createAdvance(advanceData, adminId)
  
  // Calculate repayment schedule
  calculateRepaymentSchedule(advanceAmount, installmentAmount)
  
  // Process advance repayment
  processRepayment(advanceId, paymentId, amount)
  
  // Get outstanding advances
  getOutstandingAdvances(employeeId)
  
  // Get advance deduction for payment
  getAdvanceDeduction(employeeId, netPay)
  
  // Update advance balance
  updateAdvanceBalance(advanceId, repaidAmount)
}
```

### 4. Salary Slip Generator Service

```javascript
class SalarySlipGeneratorService {
  // Generate salary slip PDF
  generateSlip(paymentId)
  
  // Create slip number
  generateSlipNumber(month, year)
  
  // Format slip data
  formatSlipData(payment, employee, salaryStructure)
  
  // Save slip to storage
  saveSlip(slipData, filePath)
  
  // Email slip
  emailSlip(slipId, employeeEmail)
  
  // Get slip download URL
  getSlipDownloadUrl(slipId)
}
```

### 5. Tax Calculator Service

```javascript
class TaxCalculatorService {
  // Get active tax configuration
  getActiveTaxConfig()
  
  // Calculate TDS
  calculateTDS(annualIncome, tdsSlabs)
  
  // Calculate PF
  calculatePF(basicSalary, pfRate)
  
  // Calculate ESI
  calculateESI(grossSalary, esiRate, threshold)
  
  // Calculate Professional Tax
  calculateProfessionalTax(monthlySalary, ptSlabs)
  
  // Get year-to-date income
  getYTDIncome(employeeId, currentMonth)
  
  // Project annual income
  projectAnnualIncome(monthlyGross, currentMonth)
}
```

### 6. Audit Logger Service

```javascript
class AuditLoggerService {
  // Log payment operation
  logPaymentOperation(operationType, entityType, entityId, changes, userId)
  
  // Log bulk operation
  logBulkOperation(operationType, entityIds, userId)
  
  // Get audit trail
  getAuditTrail(entityType, entityId, filters)
  
  // Get user activity
  getUserActivity(userId, dateRange)
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Payment Reference Uniqueness
*For any* set of employee payments, all payment reference numbers should be unique across the entire system.
**Validates: Requirements 2.1**

### Property 2: Salary Structure Data Persistence Round Trip
*For any* salary structure with base salary, payment type, and effective date, creating the structure then retrieving it should return equivalent data.
**Validates: Requirements 1.2**

### Property 3: Gross Salary Calculation Correctness
*For any* payment with base amount, allowances, and bonuses, the gross salary should equal base amount plus total allowances plus total bonuses.
**Validates: Requirements 2.4, 5.3**

### Property 4: Net Pay Calculation Correctness
*For any* payment with gross salary and deductions, the net pay should equal gross salary minus total deductions.
**Validates: Requirements 2.5**

### Property 5: Daily Wage Calculation
*For any* employee with daily payment type, the base salary should equal daily rate multiplied by days worked.
**Validates: Requirements 3.1**

### Property 6: Hourly Wage Calculation
*For any* employee with hourly payment type, the base salary should equal (hourly rate × hours worked) plus (overtime rate × overtime hours).
**Validates: Requirements 3.2, 3.4**

### Property 7: Payment Status Initial Value
*For any* newly created payment, the initial status should be 'pending'.
**Validates: Requirements 2.8**

### Property 8: Duplicate Payment Prevention
*For any* employee and billing period, attempting to create a second payment for the same employee and period should fail.
**Validates: Requirements 2.11**

### Property 9: Advance Balance Tracking
*For any* advance record, the outstanding balance should equal advance amount minus amount repaid.
**Validates: Requirements 4.2**

### Property 10: Advance Deduction Non-Negative Net Pay
*For any* payment with advance deduction, the net pay after deduction should be greater than or equal to zero.
**Validates: Requirements 4.6**

### Property 11: PF Calculation
*For any* employee payment, the Provident Fund deduction should equal basic salary multiplied by PF rate.
**Validates: Requirements 12.2**

### Property 12: ESI Calculation
*For any* employee payment where gross salary is below ESI threshold, the ESI deduction should equal gross salary multiplied by ESI rate.
**Validates: Requirements 12.3**

### Property 13: Year-to-Date Earnings Aggregation
*For any* employee and year, the YTD earnings should equal the sum of all completed payment amounts in that year.
**Validates: Requirements 6.6**

### Property 14: Payment History Chronological Ordering
*For any* employee's payment history, the payments should be sorted in reverse chronological order (newest first).
**Validates: Requirements 6.7**

### Property 15: Payment History Date Range Filtering
*For any* date range filter, all returned payments should have payment dates within the specified range.
**Validates: Requirements 6.3**

### Property 16: Salary Slip Auto-Generation
*For any* payment that transitions to completed status, a salary slip should be automatically generated.
**Validates: Requirements 7.1**

### Property 17: Salary Slip Data Completeness
*For any* generated salary slip, it should include employee name, employee ID, payment period, base salary, all allowances, all deductions, gross salary, net pay, payment date, payment method, and payment reference.
**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

### Property 18: Bulk Payment Reference Uniqueness
*For any* bulk payment operation, all generated payment reference numbers should be unique.
**Validates: Requirements 8.3**

### Property 19: Bulk Payment Atomicity Per Employee
*For any* bulk payment operation, each selected employee should receive exactly one payment record.
**Validates: Requirements 8.5**

### Property 20: Bulk Payment Failure Isolation
*For any* bulk payment operation where one payment fails, all other payments should continue processing.
**Validates: Requirements 8.7**

### Property 21: Dashboard Pending Amount Aggregation
*For any* point in time, the total pending payment amount should equal the sum of all payments with status 'pending'.
**Validates: Requirements 9.1**

### Property 22: Dashboard Monthly Total Aggregation
*For any* month, the total completed payments should equal the sum of all payments with status 'completed' in that month.
**Validates: Requirements 9.2**

### Property 23: Dashboard Status Distribution Accuracy
*For any* payment status distribution, the count for each status should match the actual number of payments with that status.
**Validates: Requirements 9.4**

### Property 24: TDS Threshold Application
*For any* employee payment where gross salary exceeds TDS threshold, TDS deduction should be applied; otherwise, TDS should be zero.
**Validates: Requirements 12.5**

### Property 25: Payment Approval Workflow Enforcement
*For any* payment where approval is enabled, the status cannot transition to 'processing' unless approval status is 'approved'.
**Validates: Requirements 13.1**

### Property 26: Approval Status Transition
*For any* payment that is approved, the approval status should change to 'approved' and the payment status should change to 'processing'.
**Validates: Requirements 13.3**

### Property 27: Rejection Status and Reason Recording
*For any* payment that is rejected, the approval status should be 'rejected', payment status should be 'failed', and rejection reason should be recorded.
**Validates: Requirements 13.4**

### Property 28: Completed Payment Notification Trigger
*For any* payment that transitions to 'completed' status, a notification should be sent to the employee.
**Validates: Requirements 14.1**

### Property 29: Audit Log Creation for Payment Operations
*For any* payment creation, modification, or deletion operation, an audit log entry should be created.
**Validates: Requirements 15.1**

### Property 30: Audit Log Detail Completeness
*For any* payment modification, the audit log should include admin user ID, timestamp, and changes made.
**Validates: Requirements 15.2**

### Property 31: Completed Payment Immutability
*For any* payment with status 'completed', attempts to modify the payment should fail.
**Validates: Requirements 15.5**

### Property 32: Salary Structure Historical Preservation
*For any* salary structure update, both the old and new salary structure records should exist in the system.
**Validates: Requirements 1.8**

### Property 33: Allowance Data Persistence Round Trip
*For any* allowance with type, amount, and calculation method, adding it to a salary structure then retrieving should return equivalent data.
**Validates: Requirements 1.5**

### Property 34: Deduction Data Persistence Round Trip
*For any* deduction with type, amount, and calculation method, adding it to a salary structure then retrieving should return equivalent data.
**Validates: Requirements 1.6**

### Property 35: Advance Repayment Balance Update
*For any* advance with a repayment, the outstanding balance after repayment should equal the previous balance minus the repayment amount.
**Validates: Requirements 4.5**

### Property 36: Cumulative Bonus Tracking
*For any* employee, the cumulative bonuses should equal the sum of all bonus amounts in all completed payments.
**Validates: Requirements 5.5**

### Property 37: Payment Method Filtering Accuracy
*For any* payment method filter, all returned payments should have the specified payment method.
**Validates: Requirements 6.4**

### Property 38: Payment Status Filtering Accuracy
*For any* payment status filter, all returned payments should have the specified status.
**Validates: Requirements 6.5**

### Property 39: Completion Timestamp Recording
*For any* payment that transitions to 'completed' status, the completedAt timestamp should be set to the current time.
**Validates: Requirements 2.10**

### Property 40: Unpaid Leave Salary Deduction
*For any* employee with unpaid leave days, the base salary should be reduced proportionally based on the number of unpaid days.
**Validates: Requirements 3.5**

### Property 41: Advance Record Data Persistence
*For any* advance with amount, date, and repayment terms, creating the advance then retrieving it should return equivalent data.
**Validates: Requirements 4.1**

### Property 42: Penalty Deduction Data Completeness
*For any* penalty deduction, it should include both reason and amount fields.
**Validates: Requirements 4.7**

### Property 43: Bonus Data Completeness
*For any* bonus added to a payment, it should include type, amount, and reason fields.
**Validates: Requirements 5.2**

### Property 44: Payment History Completeness
*For any* employee, querying payment history should return all payments associated with that employee.
**Validates: Requirements 6.1**

### Property 45: Payment History Display Fields
*For any* payment in payment history, it should display payment date, amount, payment method, and status.
**Validates: Requirements 6.2**

### Property 46: Salary Slip Storage and Retrieval
*For any* generated salary slip, it should be stored and retrievable for future access.
**Validates: Requirements 7.8**

### Property 47: Bulk Payment Individual Calculation
*For any* bulk payment operation, each employee's salary should be calculated independently based on their salary structure.
**Validates: Requirements 8.2**

### Property 48: Bulk Payment Success/Failure Reporting
*For any* bulk payment operation, the result should include counts of successful and failed payments.
**Validates: Requirements 8.6**

### Property 49: Dashboard Employee Count with Pending Payments
*For any* point in time, the count of employees with pending payments should equal the number of unique employees with at least one pending payment.
**Validates: Requirements 9.3**

### Property 50: Dashboard Date Range Filtering
*For any* date range filter on dashboard, all displayed data should be from within the specified date range.
**Validates: Requirements 9.6**

### Property 51: Monthly Payroll Report Completeness
*For any* monthly payroll report, it should include all employees who received payments in that month.
**Validates: Requirements 10.1**

### Property 52: Deduction Summary Report Grouping
*For any* deduction summary report, deductions should be grouped by type with accurate totals.
**Validates: Requirements 10.2**

### Property 53: Payment Method Distribution Report Accuracy
*For any* payment method distribution report, the count for each method should match actual payment counts.
**Validates: Requirements 10.3**

### Property 54: Report Export Data Completeness
*For any* exported payment data, it should include all payment fields and calculated totals.
**Validates: Requirements 10.6**

### Property 55: Report Date Range Filtering
*For any* report with date range specification, only data within that range should be included.
**Validates: Requirements 10.7**

### Property 56: Employee Profile Current Salary Structure Display
*For any* employee profile view, it should display the currently active salary structure.
**Validates: Requirements 11.2**

### Property 57: Employee Profile Payment Timeline Chronological Order
*For any* employee profile payment timeline, payments should be displayed in chronological order.
**Validates: Requirements 11.3**

### Property 58: Employee Profile Outstanding Balance Display
*For any* employee profile, it should display current outstanding advance balance and loan balance.
**Validates: Requirements 11.4, 11.5**

### Property 59: Employee Profile YTD Earnings Display
*For any* employee profile, it should display year-to-date earnings.
**Validates: Requirements 11.6**

### Property 60: Professional Tax Calculation
*For any* employee payment, the Professional Tax should be calculated based on configured state tax slabs.
**Validates: Requirements 12.4**

### Property 61: Cumulative Tax Deduction Tracking
*For any* employee, cumulative tax deductions should equal the sum of all tax deductions across all payments.
**Validates: Requirements 12.7**

### Property 62: Approval Notification Trigger
*For any* payment pending approval, a notification should be sent to designated approvers.
**Validates: Requirements 13.5**

### Property 63: Approval History Audit Trail
*For any* payment approval or rejection, the approval history should record approver name and timestamp.
**Validates: Requirements 13.6**

### Property 64: In-App Notification Creation for Completed Payments
*For any* payment that transitions to 'completed' status, an in-app notification should be created for the employee.
**Validates: Requirements 14.3**

### Property 65: Salary Slip Generation Notification
*For any* salary slip that is generated, a notification should be sent to the employee.
**Validates: Requirements 14.4**

### Property 66: Payment API Authentication Requirement
*For any* payment-related API endpoint, unauthenticated requests should be rejected.
**Validates: Requirements 15.4**

### Property 67: Salary Structure Change Audit Trail
*For any* salary structure creation, modification, or deletion, an audit log entry should be created.
**Validates: Requirements 15.6**

### Property 68: Bulk Payment Batch Identifier Logging
*For any* bulk payment operation, the audit log should include a batch identifier linking all payments in the operation.
**Validates: Requirements 15.7**

## Error Handling

### Validation Errors

1. **Invalid Payment Type**: Return 400 error when payment type is not one of: monthly, daily, hourly
2. **Invalid Payment Method**: Return 400 error when payment method is not one of: bank_transfer, cash, upi, cheque
3. **Invalid Payment Status**: Return 400 error when status transition is invalid
4. **Negative Amounts**: Return 400 error when salary, allowance, or deduction amounts are negative
5. **Missing Required Fields**: Return 400 error with specific field names when required data is missing
6. **Invalid Date Range**: Return 400 error when start date is after end date
7. **Duplicate Payment**: Return 409 error when attempting to create duplicate payment for same employee/period

### Business Logic Errors

1. **Insufficient Balance**: Return 400 error when advance deduction would result in negative net pay
2. **Inactive Salary Structure**: Return 400 error when attempting to use inactive salary structure
3. **Employee Not Found**: Return 404 error when employee ID doesn't exist
4. **Payment Not Found**: Return 404 error when payment ID doesn't exist
5. **Unauthorized Access**: Return 403 error when non-admin user attempts payment operations
6. **Completed Payment Modification**: Return 403 error when attempting to modify completed payment
7. **Approval Required**: Return 403 error when attempting to process payment without approval

### System Errors

1. **Database Connection**: Return 500 error with retry message when database is unavailable
2. **PDF Generation Failure**: Return 500 error when salary slip PDF generation fails
3. **Email Sending Failure**: Log error but don't fail payment when email notification fails
4. **File Storage Failure**: Return 500 error when salary slip file cannot be saved
5. **Calculation Overflow**: Return 500 error when salary calculations exceed number limits

### Error Response Format

```javascript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable error message",
    details: {
      field: "fieldName",
      value: "invalidValue",
      constraint: "constraintViolated"
    }
  }
}
```

## Testing Strategy

### Dual Testing Approach

The system requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Both approaches are complementary and necessary

### Unit Testing Focus

Unit tests should focus on:
- Specific calculation examples (e.g., salary calculation with known values)
- Edge cases (e.g., zero salary, maximum deductions, boundary dates)
- Error conditions (e.g., invalid payment types, missing fields)
- Integration points (e.g., notification sending, PDF generation)
- API endpoint responses and status codes

Avoid writing too many unit tests for scenarios that property tests can cover through randomization.

### Property-Based Testing

**Library**: Use `fast-check` for JavaScript/Node.js property-based testing

**Configuration**: Each property test must run minimum 100 iterations

**Test Tagging**: Each property test must include a comment tag:
```javascript
// Feature: employee-salary-payment-system, Property 1: Payment Reference Uniqueness
```

**Property Test Examples**:

```javascript
// Property 3: Gross Salary Calculation Correctness
test('gross salary equals base + allowances + bonuses', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0, max: 100000 }), // base amount
      fc.array(fc.float({ min: 0, max: 10000 })), // allowances
      fc.array(fc.float({ min: 0, max: 10000 })), // bonuses
      (base, allowances, bonuses) => {
        const totalAllowances = allowances.reduce((sum, a) => sum + a, 0);
        const totalBonuses = bonuses.reduce((sum, b) => sum + b, 0);
        const grossSalary = calculateGrossSalary(base, allowances, bonuses);
        
        expect(grossSalary).toBeCloseTo(base + totalAllowances + totalBonuses, 2);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 8: Duplicate Payment Prevention
test('duplicate payments for same employee and period should fail', () => {
  fc.assert(
    fc.property(
      fc.string(), // employee ID
      fc.date(), // billing period start
      fc.date(), // billing period end
      async (employeeId, dateFrom, dateTo) => {
        const paymentData = {
          employee: employeeId,
          billingPeriod: { dateFrom, dateTo }
        };
        
        await createPayment(paymentData);
        
        await expect(createPayment(paymentData)).rejects.toThrow('Duplicate payment');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Test complete workflows:
1. Create salary structure → Process payment → Generate slip → Send notification
2. Record advance → Process payment with deduction → Update advance balance
3. Bulk payment processing → Individual payment creation → Audit logging
4. Payment approval workflow → Status transitions → Notification triggers

### API Testing

Test all endpoints with:
- Valid requests (200/201 responses)
- Invalid requests (400 responses)
- Unauthorized requests (401/403 responses)
- Not found scenarios (404 responses)
- Server errors (500 responses)

### Performance Testing

- Bulk payment processing with 100+ employees
- Payment history queries with 1000+ records
- Dashboard analytics with 12 months of data
- Report generation with large datasets

### Security Testing

- Authentication bypass attempts
- Authorization boundary testing
- SQL injection prevention
- XSS prevention in notes/reason fields
- Rate limiting on API endpoints

