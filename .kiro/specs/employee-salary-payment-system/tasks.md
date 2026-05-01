# Implementation Plan: Employee Salary Payment System

## Overview

This implementation plan breaks down the Employee Salary Payment System into discrete coding tasks. The system will be built incrementally, starting with core data models, then services, API endpoints, and finally integration features. Each task builds on previous work to ensure a functional system at each checkpoint.

The implementation follows the existing codebase patterns (Node.js/Express/MongoDB) and integrates with the current User model, notification system, and authentication middleware.

## Tasks

- [x] 1. Set up database models and schemas
  - [x] 1.1 Create SalaryStructure model
    - Define schema with payment types, allowances, deductions, and effective dates
    - Add indexes for employee lookup and date range queries
    - Implement pre-save hooks for validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [ ]* 1.2 Write property test for SalaryStructure model
    - **Property 2: Salary Structure Data Persistence Round Trip**
    - **Property 32: Salary Structure Historical Preservation**
    - **Property 33: Allowance Data Persistence Round Trip**
    - **Property 34: Deduction Data Persistence Round Trip**
    - **Validates: Requirements 1.2, 1.5, 1.6, 1.8**
  
  - [x] 1.3 Create EmployeePayment model
    - Define schema with billing period, salary breakdown, payment details, and status tracking
    - Add unique index on employee + billing period to prevent duplicates
    - Implement payment reference number generation in pre-save hook
    - Add indexes for status, payment date, and employee queries
    - _Requirements: 2.1, 2.2, 2.3, 2.8, 2.11_
  
  - [ ]* 1.4 Write property tests for EmployeePayment model
    - **Property 1: Payment Reference Uniqueness**
    - **Property 7: Payment Status Initial Value**
    - **Property 8: Duplicate Payment Prevention**
    - **Validates: Requirements 2.1, 2.8, 2.11**
  
  - [x] 1.5 Create AdvanceRecord model
    - Define schema with advance amount, repayment terms, and tracking fields
    - Add indexes for employee lookup and status queries
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 1.6 Write property tests for AdvanceRecord model
    - **Property 9: Advance Balance Tracking**
    - **Property 35: Advance Repayment Balance Update**
    - **Property 41: Advance Record Data Persistence**
    - **Validates: Requirements 4.1, 4.2, 4.5**

  
  - [x] 1.7 Create SalarySlip model
    - Define schema with slip number, file paths, and email tracking
    - Implement slip number generation in pre-save hook
    - Add indexes for employee, payment, and date queries
    - _Requirements: 7.1, 7.8_
  
  - [x] 1.8 Create TaxConfig model
    - Define schema with TDS slabs, PF/ESI rates, and professional tax slabs
    - Add validation for tax slab ranges
    - Add index for active configuration lookup
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.6_
  
  - [x] 1.9 Create PaymentAudit model
    - Define schema with operation type, entity details, user info, and changes
    - Add indexes for entity lookup, user activity, and timestamp queries
    - _Requirements: 15.1, 15.2, 15.6, 15.7_

- [x] 2. Implement salary calculation service
  - [x] 2.1 Create SalaryCalculatorService class
    - Implement calculateBaseAmount method for monthly/daily/hourly payment types
    - Implement calculateAllowances method for fixed and percentage allowances
    - Implement calculateDeductions method for fixed and percentage deductions
    - Implement calculateGrossSalary method
    - Implement calculateNetPay method
    - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.4, 3.5, 3.6_
  
  - [ ]* 2.2 Write property tests for salary calculations
    - **Property 3: Gross Salary Calculation Correctness**
    - **Property 4: Net Pay Calculation Correctness**
    - **Property 5: Daily Wage Calculation**
    - **Property 6: Hourly Wage Calculation**
    - **Property 40: Unpaid Leave Salary Deduction**
    - **Validates: Requirements 2.4, 2.5, 3.1, 3.2, 3.4, 3.5**
  
  - [x] 2.3 Implement TaxCalculatorService class
    - Implement calculateTDS method with tax slab logic
    - Implement calculatePF method
    - Implement calculateESI method with threshold check
    - Implement calculateProfessionalTax method with state slabs
    - Implement getYTDIncome method
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.7_
  
  - [ ]* 2.4 Write property tests for tax calculations
    - **Property 11: PF Calculation**
    - **Property 12: ESI Calculation**
    - **Property 24: TDS Threshold Application**
    - **Property 60: Professional Tax Calculation**
    - **Property 61: Cumulative Tax Deduction Tracking**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.7**

- [x] 3. Implement advance and loan management service
  - [x] 3.1 Create AdvanceManagerService class
    - Implement createAdvance method
    - Implement calculateRepaymentSchedule method
    - Implement getOutstandingAdvances method
    - Implement getAdvanceDeduction method with net pay validation
    - Implement processRepayment method
    - Implement updateAdvanceBalance method
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [ ]* 3.2 Write property tests for advance management
    - **Property 10: Advance Deduction Non-Negative Net Pay**
    - **Property 42: Penalty Deduction Data Completeness**
    - **Validates: Requirements 4.6, 4.7**

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement payment processing service
  - [ ] 5.1 Create PaymentProcessorService class
    - Implement processPayment method with salary calculation integration
    - Implement generatePaymentReference method
    - Implement validatePayment method
    - Implement checkDuplicatePayment method
    - Implement updatePaymentStatus method
    - Implement completePayment method
    - Implement failPayment method
    - _Requirements: 2.1, 2.3, 2.6, 2.7, 2.9, 2.10, 2.11_
  
  - [ ]* 5.2 Write property tests for payment processing
    - **Property 39: Completion Timestamp Recording**
    - **Validates: Requirements 2.10**
  
  - [ ] 5.3 Implement bulk payment processing
    - Implement processBulkPayments method
    - Add error handling for individual payment failures
    - Implement success/failure count reporting
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7_
  
  - [ ]* 5.4 Write property tests for bulk payment processing
    - **Property 18: Bulk Payment Reference Uniqueness**
    - **Property 19: Bulk Payment Atomicity Per Employee**
    - **Property 20: Bulk Payment Failure Isolation**
    - **Property 47: Bulk Payment Individual Calculation**
    - **Property 48: Bulk Payment Success/Failure Reporting**
    - **Validates: Requirements 8.2, 8.3, 8.5, 8.6, 8.7**

- [ ] 6. Implement salary slip generation service
  - [ ] 6.1 Create SalarySlipGeneratorService class
    - Implement generateSlip method with PDF generation
    - Implement generateSlipNumber method
    - Implement formatSlipData method
    - Implement saveSlip method
    - Implement emailSlip method
    - Implement getSlipDownloadUrl method
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
  
  - [ ]* 6.2 Write property tests for salary slip generation
    - **Property 16: Salary Slip Auto-Generation**
    - **Property 17: Salary Slip Data Completeness**
    - **Property 46: Salary Slip Storage and Retrieval**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.8**

- [ ] 7. Implement audit logging service
  - [ ] 7.1 Create AuditLoggerService class
    - Implement logPaymentOperation method
    - Implement logBulkOperation method
    - Implement getAuditTrail method
    - Implement getUserActivity method
    - _Requirements: 15.1, 15.2, 15.6, 15.7_
  
  - [ ]* 7.2 Write property tests for audit logging
    - **Property 29: Audit Log Creation for Payment Operations**
    - **Property 30: Audit Log Detail Completeness**
    - **Property 67: Salary Structure Change Audit Trail**
    - **Property 68: Bulk Payment Batch Identifier Logging**
    - **Validates: Requirements 15.1, 15.2, 15.6, 15.7**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create salary structure management API endpoints
  - [ ] 9.1 Implement POST /api/admin/salary/structure
    - Create controller method to handle salary structure creation
    - Validate payment type, allowances, and deductions
    - Integrate with AuditLoggerService
    - Add authentication and admin authorization middleware
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 15.3, 15.4_
  
  - [ ] 9.2 Implement GET /api/admin/salary/structure/:employeeId
    - Create controller method to retrieve active salary structure for employee
    - Handle employee not found error
    - _Requirements: 1.2, 11.2_
  
  - [ ] 9.3 Implement PUT /api/admin/salary/structure/:id
    - Create controller method to update salary structure
    - Implement historical preservation logic
    - Integrate with AuditLoggerService
    - _Requirements: 1.7, 1.8, 15.6_
  
  - [ ] 9.4 Implement GET /api/admin/salary/structures
    - Create controller method with pagination and filtering
    - Support filters for employee, payment type, and active status
    - _Requirements: 1.2_
  
  - [ ]* 9.5 Write unit tests for salary structure endpoints
    - Test successful creation, retrieval, and update
    - Test validation errors
    - Test authentication and authorization

- [ ] 10. Create payment processing API endpoints
  - [ ] 10.1 Implement POST /api/admin/salary/payment
    - Create controller method to process single payment
    - Integrate with PaymentProcessorService and SalaryCalculatorService
    - Integrate with AuditLoggerService
    - Add duplicate payment check
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.8, 2.11, 15.1_
  
  - [ ] 10.2 Implement GET /api/admin/salary/payment/:id
    - Create controller method to retrieve payment details
    - Populate employee and salary structure references
    - _Requirements: 2.3_
  
  - [ ] 10.3 Implement PUT /api/admin/salary/payment/:id
    - Create controller method to update payment
    - Prevent modification of completed payments
    - Integrate with AuditLoggerService
    - _Requirements: 2.9, 15.2, 15.5_
  
  - [ ] 10.4 Implement GET /api/admin/salary/payments
    - Create controller method with pagination and filtering
    - Support filters for employee, status, payment method, and date range
    - _Requirements: 6.1, 6.3, 6.4, 6.5_
  
  - [ ] 10.5 Implement POST /api/admin/salary/payment/:id/complete
    - Create controller method to mark payment as completed
    - Trigger salary slip generation
    - Trigger employee notification
    - Record completion timestamp
    - _Requirements: 2.9, 2.10, 7.1, 14.1_
  
  - [ ]* 10.6 Write property tests for payment endpoints
    - **Property 31: Completed Payment Immutability**
    - **Property 28: Completed Payment Notification Trigger**
    - **Validates: Requirements 15.5, 14.1**
  
  - [ ]* 10.7 Write unit tests for payment endpoints
    - Test successful payment creation and completion
    - Test duplicate payment prevention
    - Test completed payment modification prevention
    - Test validation errors

- [ ] 11. Create bulk payment processing endpoint
  - [ ] 11.1 Implement POST /api/admin/salary/payment/bulk
    - Create controller method for bulk payment processing
    - Integrate with PaymentProcessorService.processBulkPayments
    - Return success/failure counts and details
    - Integrate with AuditLoggerService for batch logging
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 15.7_
  
  - [ ]* 11.2 Write unit tests for bulk payment endpoint
    - Test successful bulk processing
    - Test partial failure handling
    - Test batch audit logging

- [ ] 12. Create payment approval workflow endpoints
  - [ ] 12.1 Implement POST /api/admin/salary/payment/:id/approve
    - Create controller method to approve payment
    - Update approval status and payment status
    - Record approver and timestamp
    - Trigger approver notification
    - _Requirements: 13.1, 13.2, 13.3, 13.6_
  
  - [ ] 12.2 Implement POST /api/admin/salary/payment/:id/reject
    - Create controller method to reject payment
    - Update approval status and payment status to failed
    - Record rejection reason
    - _Requirements: 13.4, 13.6_
  
  - [ ]* 12.3 Write property tests for approval workflow
    - **Property 25: Payment Approval Workflow Enforcement**
    - **Property 26: Approval Status Transition**
    - **Property 27: Rejection Status and Reason Recording**
    - **Property 62: Approval Notification Trigger**
    - **Property 63: Approval History Audit Trail**
    - **Validates: Requirements 13.1, 13.3, 13.4, 13.5, 13.6**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Create advance management API endpoints
  - [ ] 14.1 Implement POST /api/admin/salary/advance
    - Create controller method to record advance
    - Integrate with AdvanceManagerService
    - _Requirements: 4.1, 4.4_
  
  - [ ] 14.2 Implement GET /api/admin/salary/advance/:id
    - Create controller method to retrieve advance details
    - Include repayment history
    - _Requirements: 4.1, 4.2_
  
  - [ ] 14.3 Implement GET /api/admin/salary/advances
    - Create controller method with pagination and filtering
    - Support filters for employee and status
    - _Requirements: 4.1, 4.2_
  
  - [ ] 14.4 Implement GET /api/admin/salary/advance/employee/:employeeId
    - Create controller method to get all advances for employee
    - Calculate total outstanding balance
    - _Requirements: 4.2, 11.4_
  
  - [ ]* 14.5 Write unit tests for advance endpoints
    - Test advance creation and retrieval
    - Test outstanding balance calculation
    - Test repayment tracking

- [ ] 15. Create salary slip API endpoints
  - [ ] 15.1 Implement GET /api/admin/salary/slip/:paymentId
    - Create controller method to retrieve salary slip metadata
    - _Requirements: 7.8_
  
  - [ ] 15.2 Implement POST /api/admin/salary/slip/:paymentId/generate
    - Create controller method to manually generate salary slip
    - Integrate with SalarySlipGeneratorService
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 15.3 Implement POST /api/admin/salary/slip/:paymentId/email
    - Create controller method to email salary slip
    - Integrate with SalarySlipGeneratorService.emailSlip
    - _Requirements: 7.7_
  
  - [ ] 15.4 Implement GET /api/admin/salary/slip/:paymentId/download
    - Create controller method to download salary slip PDF
    - Return file stream or download URL
    - _Requirements: 7.6_
  
  - [ ]* 15.5 Write unit tests for salary slip endpoints
    - Test slip generation and retrieval
    - Test email sending
    - Test PDF download

- [ ] 16. Create tax configuration API endpoints
  - [ ] 16.1 Implement POST /api/admin/salary/tax-config
    - Create controller method to create tax configuration
    - Validate tax slabs and rates
    - _Requirements: 12.6_
  
  - [ ] 16.2 Implement GET /api/admin/salary/tax-config
    - Create controller method to retrieve active tax configuration
    - _Requirements: 12.6_
  
  - [ ] 16.3 Implement PUT /api/admin/salary/tax-config/:id
    - Create controller method to update tax configuration
    - _Requirements: 12.6_
  
  - [ ]* 16.4 Write unit tests for tax config endpoints
    - Test configuration creation and retrieval
    - Test validation errors

- [ ] 17. Create dashboard and analytics endpoints
  - [ ] 17.1 Implement GET /api/admin/salary/dashboard
    - Create controller method to aggregate dashboard data
    - Calculate total pending payments
    - Calculate total completed payments for current month
    - Calculate count of employees with pending payments
    - Calculate payment status distribution
    - Calculate monthly payroll trend for last 12 months
    - Calculate top deduction categories
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7_
  
  - [ ]* 17.2 Write property tests for dashboard analytics
    - **Property 21: Dashboard Pending Amount Aggregation**
    - **Property 22: Dashboard Monthly Total Aggregation**
    - **Property 23: Dashboard Status Distribution Accuracy**
    - **Property 49: Dashboard Employee Count with Pending Payments**
    - **Property 50: Dashboard Date Range Filtering**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.6**

- [ ] 18. Create reporting and export endpoints
  - [ ] 18.1 Implement GET /api/admin/salary/reports/monthly
    - Create controller method to generate monthly payroll report
    - Group payments by employee
    - Support date range filtering
    - _Requirements: 10.1, 10.7_
  
  - [ ] 18.2 Implement GET /api/admin/salary/reports/deductions
    - Create controller method to generate deduction summary report
    - Group deductions by type
    - Calculate totals for each type
    - _Requirements: 10.2_
  
  - [ ] 18.3 Implement GET /api/admin/salary/reports/payment-methods
    - Create controller method to generate payment method distribution report
    - Count payments by method
    - _Requirements: 10.3_
  
  - [ ] 18.4 Implement POST /api/admin/salary/reports/export
    - Create controller method to export payment data
    - Support CSV and Excel formats
    - Include all payment fields and calculated totals
    - Support date range filtering
    - _Requirements: 10.4, 10.5, 10.6, 10.7_
  
  - [ ]* 18.5 Write property tests for reporting
    - **Property 51: Monthly Payroll Report Completeness**
    - **Property 52: Deduction Summary Report Grouping**
    - **Property 53: Payment Method Distribution Report Accuracy**
    - **Property 54: Report Export Data Completeness**
    - **Property 55: Report Date Range Filtering**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.6, 10.7**

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Integrate with employee profile pages
  - [ ] 20.1 Implement GET /api/admin/employee/:id/salary-info
    - Create controller method to retrieve employee salary information
    - Include current salary structure
    - Include outstanding advance balance
    - Include outstanding loan balance
    - Include year-to-date earnings
    - _Requirements: 11.2, 11.4, 11.5, 11.6_
  
  - [ ] 20.2 Implement GET /api/admin/employee/:id/payment-history
    - Create controller method to retrieve employee payment history
    - Support pagination and filtering
    - Sort in reverse chronological order
    - _Requirements: 6.1, 6.2, 6.7, 11.3_
  
  - [ ] 20.3 Implement GET /api/admin/employee/:id/advances
    - Create controller method to retrieve employee advances
    - Include repayment history
    - _Requirements: 4.1, 4.2, 11.4_
  
  - [ ]* 20.4 Write property tests for employee profile integration
    - **Property 13: Year-to-Date Earnings Aggregation**
    - **Property 14: Payment History Chronological Ordering**
    - **Property 15: Payment History Date Range Filtering**
    - **Property 36: Cumulative Bonus Tracking**
    - **Property 37: Payment Method Filtering Accuracy**
    - **Property 38: Payment Status Filtering Accuracy**
    - **Property 44: Payment History Completeness**
    - **Property 45: Payment History Display Fields**
    - **Property 56: Employee Profile Current Salary Structure Display**
    - **Property 57: Employee Profile Payment Timeline Chronological Order**
    - **Property 58: Employee Profile Outstanding Balance Display**
    - **Property 59: Employee Profile YTD Earnings Display**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 11.2, 11.3, 11.4, 11.5, 11.6**

- [ ] 21. Implement notification integration
  - [ ] 21.1 Create payment notification triggers
    - Integrate with existing notification system
    - Send notification when payment is completed
    - Send notification when salary slip is generated
    - Send notification to approvers when payment is pending approval
    - _Requirements: 13.5, 14.1, 14.3, 14.4_
  
  - [ ]* 21.2 Write property tests for notification triggers
    - **Property 64: In-App Notification Creation for Completed Payments**
    - **Property 65: Salary Slip Generation Notification**
    - **Validates: Requirements 14.3, 14.4**
  
  - [ ]* 21.3 Write unit tests for notification integration
    - Test notification creation on payment completion
    - Test notification creation on slip generation
    - Test approver notification on pending approval

- [ ] 22. Implement security and authorization
  - [ ] 22.1 Add authentication middleware to all salary endpoints
    - Apply JWT authentication middleware
    - _Requirements: 15.4_
  
  - [ ] 22.2 Add admin authorization middleware
    - Create middleware to restrict salary operations to admin users
    - _Requirements: 15.3_
  
  - [ ]* 22.3 Write property tests for security
    - **Property 66: Payment API Authentication Requirement**
    - **Validates: Requirements 15.4**
  
  - [ ]* 22.4 Write unit tests for authorization
    - Test unauthenticated request rejection
    - Test non-admin user request rejection
    - Test admin user access

- [ ] 23. Add routes to Express app
  - [ ] 23.1 Create salary routes file
    - Define all salary-related routes
    - Apply authentication and authorization middleware
    - Mount routes in main app
    - _Requirements: All API endpoints_
  
  - [ ]* 23.2 Write integration tests for complete workflows
    - Test end-to-end payment processing workflow
    - Test bulk payment workflow
    - Test approval workflow
    - Test advance deduction workflow

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate complete workflows
- The implementation follows existing codebase patterns (Node.js/Express/MongoDB)
- All services integrate with existing systems (User model, notifications, authentication)
