# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Admin 403 Error on Buyer Payments Access
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing case: admin user accessing `/admin/buyer-payments` page
  - Test that admin user login → navigate to Buyer Payments page → API call to `/api/employee/payments/buyers` returns 403 Forbidden
  - Test that console shows "Error fetching buyer payments: Request failed with status code 403"
  - Test that payment table and summary cards show no data despite existing deliveries in database
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: specific 403 response, error messages, empty UI state
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Employee Endpoint and Authorization Preservation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs:
    - Employee with milk_collector role accessing `/api/employee/payments/buyers` succeeds with 200 OK
    - Employee endpoint returns buyer payment data with correct structure (payments array, summary object)
    - Non-admin users attempting to access admin endpoints receive authorization errors
    - All other admin endpoints continue to function with proper authorization
  - Write property-based tests capturing observed behavior patterns:
    - For all employee requests with milk_collector role to `/api/employee/payments/buyers`, response status is 200 and data structure matches expected format
    - For all non-admin user requests to admin endpoints, authorization behavior is unchanged
    - For all admin requests to other admin endpoints (not buyer-payments), behavior is unchanged
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for Admin Buyer Payments 403 Error

  - [x] 3.1 Create admin buyer payments endpoint
    - Add `getAdminBuyerPayments` function to `backend/src/controllers/admin.controller.js`
    - Mirror logic from `employee.controller.js` `getBuyerPayments` function
    - Query Delivery model for deliveries with status in ["Completed", "Out for Delivery", "Approved"]
    - Populate buyer details (username, mobile, uniqueId) and handledBy details (username)
    - Sort by createdAt descending
    - Calculate summary statistics (totalOrders, totalAmount, paidAmount, pendingAmount, onlinePayments, codPayments, codPending, codCompleted)
    - Return formatted response with payments array and summary object
    - Export `getAdminBuyerPayments` function
    - _Bug_Condition: isBugCondition(request) where request.user.role === 'admin' AND request.path === '/api/employee/payments/buyers' AND NOT request.user.hasRole('milk_collector')_
    - _Expected_Behavior: Admin requests to `/api/admin/buyer-payments` return 200 OK with buyer payment data (payments array, summary object) without 403 errors_
    - _Preservation: Employee endpoint `/api/employee/payments/buyers` continues to require milk_collector role and function exactly as before; all other authorization and data retrieval logic remains unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Add admin route for buyer payments
    - Import `getAdminBuyerPayments` in `backend/src/routes/admin.routes.js`
    - Add route: `router.get("/buyer-payments", getAdminBuyerPayments);`
    - Place after farmer-payments route for consistency
    - _Requirements: 2.1_

  - [x] 3.3 Update frontend to use admin endpoint
    - Modify `frontend/src/pages/admin/BuyerPayments.jsx`
    - Change API call in `fetchBuyerPayments` function from `/api/employee/payments/buyers` to `/api/admin/buyer-payments`
    - Update line 22: `const response = await api.get("/api/admin/buyer-payments");`
    - _Requirements: 2.1, 2.3_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Admin Successfully Accesses Buyer Payments
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify admin user can access Buyer Payments page without 403 errors
    - Verify API call to `/api/admin/buyer-payments` returns 200 OK
    - Verify payment data and summary statistics are displayed correctly
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Employee Endpoint and Authorization Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm employee endpoint `/api/employee/payments/buyers` still requires milk_collector role
    - Confirm employee endpoint returns same data structure and format
    - Confirm all other authorization rules are preserved
    - Confirm no regressions in other admin endpoints

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
  - Verify admin can access buyer payments without 403 errors
  - Verify employee endpoint continues to work with proper role
  - Verify no regressions in authorization or data retrieval
