# Implementation Plan: Dairy Info API Fix

## Overview

Fix the API endpoint mismatch in the useDairyInfo hook by changing it from the admin-protected endpoint to the public endpoint, eliminating 403 Forbidden errors for non-admin users.

## Tasks

- [x] 1. Update useDairyInfo Hook API Endpoint
  - Change API call from `/api/admin/dairy-info` to `/api/public/dairy-info`
  - Maintain existing error handling and data processing
  - Ensure interface compatibility is preserved
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [ ]* 1.1 Write unit tests for useDairyInfo hook
  - Test successful API response handling
  - Test error scenarios and graceful degradation
  - Test data structure consistency
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 2. Verify API Endpoint Consistency
  - Confirm public endpoint returns same data structure as admin endpoint
  - Test that public endpoint is accessible without authentication
  - Validate that existing DairyTimeStatus component continues to work
  - _Requirements: 1.4, 2.1, 2.3_

- [ ]* 2.1 Write integration tests for dairy info access
  - Test dairy info display across different user roles
  - Test that 403 errors are eliminated
  - Test fallback behavior when no dairy info exists
  - _Requirements: 1.2, 3.2, 3.3_

- [x] 3. Test Cross-Component Compatibility
  - Verify all components using useDairyInfo hook still work correctly
  - Test dairy name display in headers and navigation
  - Test dairy location and contact information display
  - _Requirements: 4.3, 4.4_

- [ ]* 3.1 Write property tests for API consistency
  - **Property 1: Public API Access**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 3.2 Write property tests for data consistency
  - **Property 2: Data Consistency**
  - **Validates: Requirements 1.4, 2.4**

- [x] 4. Validate Error Handling
  - Test behavior when API returns null data
  - Test behavior when API call fails
  - Ensure console errors are eliminated for normal users
  - _Requirements: 3.1, 3.2, 3.4_

- [ ]* 4.1 Write property tests for error handling
  - **Property 3: Error Handling**
  - **Validates: Requirements 3.1, 3.2**

- [x] 5. Final Integration Testing
  - Test complete user flows for farmers, buyers, and employees
  - Verify dairy time status displays correctly for all user types
  - Confirm no authentication errors in browser console
  - _Requirements: 1.2, 3.4_

- [ ]* 5.1 Write property tests for interface compatibility
  - **Property 4: Interface Compatibility**
  - **Validates: Requirements 4.1, 4.2**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The main fix is a simple one-line change in the useDairyInfo hook
- Focus on maintaining backward compatibility and existing functionality
- Verify that admin users can still access dairy info for management purposes
- Ensure the fix resolves the 403 Forbidden errors shown in browser console