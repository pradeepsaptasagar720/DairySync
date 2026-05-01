# Design Document

## Overview

This design implements billing period protection to prevent milk collectors from modifying milk entries for dates that fall within periods where bills have already been generated. The system will validate entry dates against existing bill periods and block unauthorized modifications.

## Architecture

### Protection Flow
```
1. User attempts milk entry operation (create/update/delete)
2. System extracts entry date and farmer ID
3. System queries existing bill periods for the farmer
4. System checks if entry date falls within any bill period
5. If protected: Reject operation with detailed error message
6. If allowed: Proceed with normal operation
```

### Validation Layers
```
Frontend Validation → Backend API Validation → Database Constraints
```

## Components and Interfaces

### BillingPeriodValidator
```javascript
class BillingPeriodValidator {
  // Check if a date is within any billed period for a farmer
  async isDateProtected(farmerId, entryDate) {
    const billPeriods = await this.getBillPeriodsForFarmer(farmerId);
    return billPeriods.some(period => 
      entryDate >= period.dateFrom && entryDate <= period.dateTo
    );
  }
  
  // Get all bill periods that protect a specific date
  async getProtectingPeriods(farmerId, entryDate) {
    const billPeriods = await this.getBillPeriodsForFarmer(farmerId);
    return billPeriods.filter(period => 
      entryDate >= period.dateFrom && entryDate <= period.dateTo
    );
  }
  
  // Get all bill periods for a farmer
  async getBillPeriodsForFarmer(farmerId) {
    return await FarmerPayment.find({
      farmer: farmerId,
      billPeriod: { $exists: true }
    }).select('billPeriod').lean();
  }
}
```

### Frontend Validation
```javascript
// Pre-submission validation in milk collection forms
const validateEntryDate = async (farmerId, entryDate) => {
  try {
    const response = await EmployeeService.checkBillingPeriodProtection({
      farmerId,
      entryDate
    });
    
    if (response.data.isProtected) {
      throw new Error(`Cannot modify entry for ${entryDate}. Date falls within billed period: ${response.data.protectedPeriods.map(p => `${p.dateFrom} to ${p.dateTo}`).join(', ')}`);
    }
  } catch (error) {
    throw error;
  }
};
```

### Backend API Endpoints
```javascript
// Check if date is protected
GET /api/employee/check-billing-protection?farmerId=X&entryDate=Y

// Enhanced milk entry endpoints with validation
POST /api/employee/milk-entry (with billing period validation)
PUT /api/employee/milk-entry/:id (with billing period validation)
DELETE /api/employee/milk-entry/:id (with billing period validation)
```

## Data Models

### BillingPeriodProtection
```javascript
{
  farmerId: ObjectId,
  entryDate: String, // YYYY-MM-DD format
  isProtected: Boolean,
  protectedPeriods: [{
    dateFrom: String,
    dateTo: String,
    billId: ObjectId,
    generatedAt: Date
  }],
  checkedAt: Date
}
```

### Enhanced Error Response
```javascript
{
  success: false,
  error: {
    code: "BILLING_PERIOD_PROTECTED",
    message: "Cannot modify milk entry for protected billing period",
    details: {
      entryDate: "2024-01-15",
      farmerId: "farmer123",
      protectedPeriods: [{
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
        reason: "Bill already generated for this period"
      }]
    }
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Billing Period Protection Enforcement
*For any* milk entry operation on a date that falls within an existing bill period for that farmer, the system should reject the operation with appropriate error message
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Bill Period Detection Accuracy
*For any* farmer and date combination, the system should correctly identify all bill periods that protect that date
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Farmer-Specific Protection
*For any* milk entry operation, the system should only check bill periods for the specific farmer involved, not other farmers
**Validates: Requirements 2.5**

### Property 4: Validation Consistency
*For any* milk entry operation, both frontend and backend validation should produce consistent results for the same input
**Validates: Requirements 4.1, 4.2**

### Property 5: Error Message Completeness
*For any* rejected operation due to billing protection, the error message should include all relevant bill periods that caused the rejection
**Validates: Requirements 3.1, 3.2, 3.5**

## Error Handling

### Protection Violation Errors
- **BILLING_PERIOD_PROTECTED**: Entry date falls within billed period
- **MULTIPLE_PERIODS_PROTECTED**: Entry date falls within multiple bill periods
- **VALIDATION_FAILED**: Unable to validate billing period protection

### User-Friendly Messages
- "Cannot create milk entry for [date]. This date is part of a billing period ([dateFrom] to [dateTo]) for which bills have already been generated."
- "Cannot update milk entry for [date]. Multiple billing periods protect this date: [list of periods]."
- "Cannot delete milk entry for [date]. This entry is part of processed billing records."

### Fallback Behavior
- If validation service is unavailable, default to allowing operations with warning
- Log all protection violations for audit purposes
- Provide manual override mechanism for administrators

## Testing Strategy

### Unit Tests
- Test BillingPeriodValidator with various date and farmer combinations
- Test error message generation for different scenarios
- Test edge cases (boundary dates, multiple periods, no periods)
- Test performance with large numbers of bill periods

### Property Tests
- Verify protection enforcement across random date ranges and farmers
- Test bill period detection accuracy with generated test data
- Validate farmer-specific protection isolation
- Test validation consistency between frontend and backend

### Integration Tests
- Test complete milk entry workflow with billing protection
- Verify API endpoint responses for protected and unprotected dates
- Test user interface feedback for various protection scenarios
- Validate database query performance under load

## Implementation Plan

### Phase 1: Backend Validation
1. Implement BillingPeriodValidator class
2. Add validation to milk entry API endpoints
3. Create billing period check endpoint
4. Add comprehensive error handling

### Phase 2: Frontend Integration
1. Add pre-submission validation to milk collection forms
2. Implement user-friendly error messages
3. Add visual indicators for protected dates
4. Create date picker restrictions

### Phase 3: User Experience Enhancement
1. Add calendar view showing protected periods
2. Implement bulk validation for multiple entries
3. Add administrative override interface
4. Create audit logging for all operations

### Phase 4: Performance Optimization
1. Implement caching for frequently checked periods
2. Optimize database queries for bill period lookup
3. Add batch validation for multiple entries
4. Monitor and tune performance metrics