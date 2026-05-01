# Design Document

## Overview

This design addresses the API endpoint mismatch in the `useDairyInfo` hook that causes 403 Forbidden errors for non-admin users. The hook currently uses the admin-protected endpoint `/api/admin/dairy-info` when it should use the public endpoint `/api/public/dairy-info` for general dairy information display.

## Architecture

### Current Architecture Issue
```
useDairyInfo Hook → /api/admin/dairy-info (❌ Requires admin auth)
DairyTimeStatus → /api/public/dairy-info (✅ Public access)
```

### Fixed Architecture
```
useDairyInfo Hook → /api/public/dairy-info (✅ Public access)
DairyTimeStatus → /api/public/dairy-info (✅ Already correct)
```

## Components and Interfaces

### 1. useDairyInfo Hook
**Current Implementation Issues:**
- Uses `/api/admin/dairy-info` endpoint
- Causes 403 errors for non-admin users
- Inconsistent with DairyTimeStatus component

**Fixed Implementation:**
- Use `/api/public/dairy-info` endpoint
- Maintain same interface and functionality
- Consistent with other public dairy info access

### 2. API Endpoints
**Public Endpoint:** `/api/public/dairy-info`
- ✅ Already exists and working
- ✅ Returns same data structure as admin endpoint
- ✅ No authentication required
- ✅ Used correctly by DairyTimeStatus component

**Admin Endpoint:** `/api/admin/dairy-info`
- ✅ Should remain for admin-specific operations
- ✅ Requires admin authentication
- ✅ Used for dairy info management

## Data Models

### DairyInfo Response Structure
Both public and admin endpoints return the same structure:
```javascript
{
  success: true,
  data: {
    _id: "...",
    dairyName: "string",
    district: "string",
    taluka: "string",
    post: "string",
    pincode: "string",
    place: "string",
    area: "string",
    mobileNo: "string",
    email: "string",
    morningOpenTime: "string",
    morningCloseTime: "string",
    eveningOpenTime: "string",
    eveningCloseTime: "string",
    openingTime: "string", // backward compatibility
    closingTime: "string", // backward compatibility
    sellingRates: {
      cowMilk: { rate: "string", description: "string" },
      buffaloMilk: { rate: "string", description: "string" },
      mixedMilk: { rate: "string", description: "string" }
    }
  } | null,
  message: "string"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Public API Access
*For any* non-admin user accessing dairy information through the useDairyInfo hook, the system should successfully fetch data without authentication errors
**Validates: Requirements 1.1, 1.2**

### Property 2: Data Consistency
*For any* successful API response from the public dairy-info endpoint, the data structure should be identical to the admin endpoint response
**Validates: Requirements 1.4, 2.4**

### Property 3: Error Handling
*For any* API failure or null response, the useDairyInfo hook should handle the error gracefully without breaking dependent components
**Validates: Requirements 3.1, 3.2**

### Property 4: Interface Compatibility
*For any* component using the useDairyInfo hook, the interface and returned data should remain unchanged after the endpoint fix
**Validates: Requirements 4.1, 4.2**

## Error Handling

### API Error Scenarios
1. **Network Errors**: Handle connection failures gracefully
2. **Server Errors**: Handle 5xx responses appropriately
3. **No Data**: Handle null/empty responses from server
4. **Authentication Errors**: Should not occur with public endpoint

### Error Recovery
- Set `dairyInfo` to `null` on errors
- Set `loading` to `false` after error handling
- Log errors to console for debugging
- Provide fallback display values

## Testing Strategy

### Unit Tests
- Test useDairyInfo hook with successful API responses
- Test error handling scenarios
- Test data structure consistency
- Test interface compatibility

### Integration Tests
- Test components using useDairyInfo hook
- Test dairy information display across different user roles
- Test API endpoint accessibility

### Property-Based Tests
- **Property 1**: Generate random user roles and verify public API access
- **Property 2**: Compare public and admin API response structures
- **Property 3**: Test error handling with various failure scenarios
- **Property 4**: Verify interface consistency across hook updates

Each property test should run a minimum of 100 iterations and be tagged with:
**Feature: dairy-info-api-fix, Property {number}: {property_text}**