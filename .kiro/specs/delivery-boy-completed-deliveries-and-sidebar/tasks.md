# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - Completed Deliveries Remain in Active List
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - deliveries with status "Completed" or "Cancelled" appearing in DeliveryRequests page
  - Test that DeliveryRequests page displays only active deliveries (Pending, Accepted, Out for Delivery) and excludes completed/cancelled deliveries
  - The test assertions should match the Expected Behavior Properties from design:
    - For any delivery where status is "Completed" or "Cancelled", it SHALL NOT appear in DeliveryRequests page
    - For any delivery where status is "Pending", "Accepted", or "Out for Delivery", it SHALL appear in DeliveryRequests page
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Completed deliveries remaining visible in active list
    - Cancelled deliveries remaining visible in active list
    - No separation between active and completed deliveries
    - No sidebar navigation for delivery boy role
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Delivery Workflow Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (active delivery workflows)
  - Observe: Accepting a pending delivery updates status to "Accepted" and shows in active list
  - Observe: Marking delivery as "Out for Delivery" generates OTP, enables GPS tracking, and maintains chat functionality
  - Observe: Completing OTP verification marks delivery as "Completed" and updates all related records
  - Observe: Milk collector can view all deliveries in read-only monitoring mode
  - Observe: Other employee roles (milk_collector) can use EmployeeSidebar without issues
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements:
    - For all delivery workflow actions (accept, out for delivery, OTP completion), behavior remains unchanged
    - For all active deliveries, chat, GPS tracking, and communication features continue to work
    - For milk collector role, all deliveries remain visible in monitoring dashboard
    - For other employee roles, sidebar navigation continues to work without changes
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for completed deliveries appearing in active list and missing sidebar navigation

  - [x] 3.1 Add client-side filtering to DeliveryRequests component
    - Open `frontend/src/pages/employee/DeliveryRequests.jsx`
    - Locate the `fetchDeliveryRequests` function where delivery data is fetched
    - After receiving the API response, add filtering logic to show only active statuses:
      ```javascript
      const activeDeliveries = res.data.data.requests.filter(
        delivery => ['Pending', 'Accepted', 'Out for Delivery'].includes(delivery.status)
      );
      ```
    - Update state management to store `activeDeliveries` instead of all deliveries
    - Update summary card calculations to reflect only active delivery counts
    - Ensure page title remains "My Delivery Requests" to indicate active orders only
    - _Bug_Condition: isBugCondition(delivery) where delivery.status IN ['Completed', 'Cancelled'] AND delivery is displayed in DeliveryRequests page_
    - _Expected_Behavior: For any delivery where isBugCondition returns true, the fixed DeliveryRequests component SHALL NOT display that delivery in the active orders list_
    - _Preservation: Active delivery display, status updates, OTP workflow, chat functionality, GPS tracking, milk collector view, and other sidebar navigation must remain unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Create CompletedDeliveries page component
    - Create new file `frontend/src/pages/employee/CompletedDeliveries.jsx`
    - Copy structure from DeliveryRequests.jsx but filter for completed statuses:
      ```javascript
      const completedDeliveries = res.data.data.requests.filter(
        delivery => ['Completed', 'Cancelled'].includes(delivery.status)
      );
      ```
    - Remove action buttons (accept, out for delivery) since completed deliveries are read-only
    - Display only status badges and delivery details (no OTP modal, chat buttons, or action buttons)
    - Add completion timestamps using `completedAt` field for completed deliveries
    - Add summary cards showing counts for Completed and Cancelled deliveries separately
    - Set page title to "Completed Deliveries"
    - _Bug_Condition: isBugCondition(delivery) where delivery.status IN ['Completed', 'Cancelled']_
    - _Expected_Behavior: Completed deliveries SHALL be displayed only in the dedicated CompletedDeliveries page_
    - _Preservation: Completed deliveries are read-only and do not affect any active delivery workflows_
    - _Requirements: 2.3_

  - [x] 3.3 Add Completed Deliveries link to EmployeeSidebar
    - Open `frontend/src/components/navigation/EmployeeSidebar.jsx`
    - Locate the `allLinks` array where sidebar links are defined
    - Add new link for Completed Deliveries:
      ```javascript
      { 
        to: "/delivery/completed-deliveries", 
        label: "Completed Deliveries", 
        icon: "✅", 
        roles: ["delivery_boy"] 
      }
      ```
    - Ensure delivery boy links are properly ordered:
      1. Dashboard (📊)
      2. Delivery Requests (🚚)
      3. Completed Deliveries (✅) - NEW
      4. My Earnings (💰)
    - Verify the existing role-based filtering logic correctly shows/hides links based on employeeRole
    - _Bug_Condition: Delivery boy role lacks sidebar navigation to completed deliveries page_
    - _Expected_Behavior: Sidebar SHALL provide link to Completed Deliveries page for delivery_boy role_
    - _Preservation: Other employee roles (milk_collector) sidebar links must continue to work without changes_
    - _Requirements: 2.4, 2.5_

  - [x] 3.4 Add route for CompletedDeliveries page
    - Open `frontend/src/App.jsx` (or the file containing routing configuration)
    - Import the CompletedDeliveries component:
      ```javascript
      import CompletedDeliveries from './pages/employee/CompletedDeliveries';
      ```
    - Add new route definition in the appropriate section (likely within employee/delivery routes):
      ```javascript
      <Route path="/delivery/completed-deliveries" element={<CompletedDeliveries />} />
      ```
    - Verify route is protected and accessible only to delivery_boy role
    - Ensure route follows the existing `/delivery/` prefix pattern for consistency
    - _Bug_Condition: No route exists for completed deliveries page_
    - _Expected_Behavior: Route SHALL be accessible to delivery_boy role and render CompletedDeliveries component_
    - _Preservation: Existing routes for other roles and pages must remain unchanged_
    - _Requirements: 2.3, 2.4_

  - [x] 3.5 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Active Deliveries Display Correctly
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied:
      - DeliveryRequests page displays only active deliveries (Pending, Accepted, Out for Delivery)
      - Completed and Cancelled deliveries do NOT appear in DeliveryRequests page
      - Completed deliveries appear in the new CompletedDeliveries page
      - Sidebar navigation includes link to Completed Deliveries page
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.6 Verify preservation tests still pass
    - **Property 2: Preservation** - Delivery Workflow Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Verify all preserved behaviors:
      - Accepting pending deliveries updates status to "Accepted" and shows in active list
      - Marking delivery as "Out for Delivery" generates OTP, enables GPS tracking, maintains chat
      - OTP verification completes delivery and updates all related records
      - Milk collector can view all deliveries in read-only monitoring mode
      - Other employee roles (milk_collector) can use EmployeeSidebar without issues
      - Chat functionality, GPS tracking, and call/SMS buttons work for active deliveries
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run all exploration and preservation tests
  - Verify DeliveryRequests page shows only active deliveries (Pending, Accepted, Out for Delivery)
  - Verify CompletedDeliveries page shows only completed deliveries (Completed, Cancelled)
  - Verify sidebar navigation works for delivery boy role with new Completed Deliveries link
  - Verify all existing delivery workflows (accept, out for delivery, OTP, chat, GPS) continue to work
  - Verify milk collector monitoring dashboard still shows all deliveries
  - Verify other employee roles' sidebar navigation remains unchanged
  - Ask the user if questions arise
