# Design Document

## Overview

This design addresses the payment status persistence issue where the payment status reverts from "Paid" back to "Pay" after processing a payment. The root cause is a race condition between local state updates and background API calls that overwrite the local state.

## Architecture

### Current Flow (Problematic)
```
1. User clicks "Pay" → processPayment()
2. API call to process payment → Success
3. Local state updated → Status shows "Paid"
4. Background fetchPaymentHistory() called
5. API response overwrites local state → Status reverts to "Pay"
```

### New Flow (Fixed)
```
1. User clicks "Pay" → processPayment()
2. API call to process payment → Success
3. Local state updated with optimistic update
4. Status shows "Paid" immediately
5. Background API refresh (delayed) → Merge with local state
6. Status remains "Paid" consistently
```

## Components and Interfaces

### State Management Enhancement

#### PaymentStatusManager
```javascript
class PaymentStatusManager {
  constructor() {
    this.localUpdates = new Map(); // Track local optimistic updates
    this.lastApiSync = new Date();
  }
  
  // Update payment status optimistically
  updatePaymentStatus(farmerId, amount, status) {
    this.localUpdates.set(farmerId, {
      amount,
      status,
      timestamp: new Date(),
      source: 'local'
    });
  }
  
  // Merge API response with local updates
  mergeApiResponse(apiPayments) {
    const merged = new Map();
    
    // Start with API data
    apiPayments.forEach(payment => {
      merged.set(payment.farmer._id, {
        amount: payment.amount,
        status: payment.status,
        timestamp: new Date(payment.paymentDate),
        source: 'api'
      });
    });
    
    // Override with newer local updates
    this.localUpdates.forEach((localUpdate, farmerId) => {
      const apiUpdate = merged.get(farmerId);
      if (!apiUpdate || localUpdate.timestamp > apiUpdate.timestamp) {
        merged.set(farmerId, localUpdate);
      }
    });
    
    return merged;
  }
}
```

### Enhanced Payment Processing

#### Optimistic Updates
- Update local state immediately when payment is processed
- Mark updates with timestamp and source
- Preserve local updates during API refreshes

#### Smart State Merging
- Compare timestamps between local and API data
- Prioritize more recent updates
- Handle conflicts gracefully

#### Delayed API Refresh
- Add configurable delay before background refresh
- Allow database replication to complete
- Prevent immediate state overwrites

## Data Models

### PaymentStatusEntry
```javascript
{
  farmerId: string,
  amount: number,
  status: 'unpaid' | 'pending' | 'paid',
  timestamp: Date,
  source: 'local' | 'api',
  billPeriod: {
    dateFrom: string,
    dateTo: string
  }
}
```

### PaymentState
```javascript
{
  paymentStatus: Map<string, number>, // farmerId -> paid amount
  pendingFarmers: Set<string>,        // farmers with pending payments
  localUpdates: Map<string, PaymentStatusEntry>, // optimistic updates
  lastApiSync: Date,                  // last successful API sync
  isRefreshing: boolean              // refresh in progress
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Payment Status Persistence
*For any* successfully processed payment, the payment status should remain "Paid" until the bill period changes or the page is refreshed with different filters
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: State Consistency
*For any* payment status update, local state changes should be preserved during background API calls unless the API provides more recent data
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Optimistic Update Reliability
*For any* payment processing operation, the UI should show the expected status immediately and maintain it until server confirmation or error
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: State Merge Correctness
*For any* API response containing payment data, the merge operation should preserve local updates that are more recent than the API data
**Validates: Requirements 2.4, 3.2**

### Property 5: Error Recovery
*For any* payment processing failure, the system should revert to the previous state and provide clear error feedback
**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### Payment Processing Errors
- Revert optimistic updates on API failure
- Show specific error messages
- Maintain original payment status

### API Communication Errors
- Preserve local state during network issues
- Show connection status indicators
- Provide manual refresh options

### State Conflict Resolution
- Use timestamp-based conflict resolution
- Log conflicts for debugging
- Prioritize completed payments over pending

## Testing Strategy

### Unit Tests
- Test PaymentStatusManager merge logic
- Test optimistic update functionality
- Test error handling scenarios
- Test state persistence across API calls

### Property Tests
- Verify payment status persistence across random payment sequences
- Test state merge correctness with various API response scenarios
- Validate optimistic updates under different timing conditions
- Test error recovery with random failure scenarios

### Integration Tests
- Test complete payment processing flow
- Verify UI updates correctly reflect state changes
- Test background API refresh behavior
- Validate user experience across multiple payments

## Implementation Plan

### Phase 1: State Management Enhancement
1. Implement PaymentStatusManager class
2. Add optimistic update tracking
3. Implement smart state merging logic

### Phase 2: Payment Processing Updates
1. Update processPayment to use optimistic updates
2. Modify fetchPaymentHistory to merge instead of replace
3. Add configurable delay for background refresh

### Phase 3: UI Improvements
1. Add loading states for payment processing
2. Implement error feedback mechanisms
3. Add manual refresh controls

### Phase 4: Testing and Validation
1. Implement comprehensive test suite
2. Add debugging and logging capabilities
3. Validate fix with real-world scenarios