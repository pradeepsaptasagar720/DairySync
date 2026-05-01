# Requirements Document

## Introduction

This feature enhances the milk delivery system by implementing real-time milk availability updates for buyers and completing the delivery workflow with proper status transitions. The system will ensure buyers see accurate milk availability as orders progress through the delivery pipeline, and delivery personnel will have a complete workflow from order acceptance through delivery completion.

## Glossary

- **Buyer**: A user who purchases milk from the system
- **Delivery_Boy**: An employee responsible for delivering milk orders to buyers
- **Order**: A milk purchase request created by a buyer
- **Milk_Availability**: The current quantity of milk available for purchase in a session
- **Order_Status**: The current state of an order (Pending, Approved, Out for Delivery, Completed, Cancelled)
- **Session**: A time period (morning/evening) during which milk collection and delivery occurs
- **Dashboard**: The main interface page for buyers or delivery personnel
- **Buyer_Dashboard**: The buyer's main interface showing milk availability and order placement
- **DeliveryRequests_Page**: The delivery boy's interface for managing active orders
- **DeliveryHistory_Page**: The delivery boy's interface for viewing completed orders
- **DeliveryStats_Page**: The delivery boy's interface for viewing delivery statistics
- **DeliveryOverview_Page**: The delivery boy's main dashboard showing delivery summary
- **PlaceOrderModal**: The UI component buyers use to create new milk orders
- **calculateSessionMilkCollection**: Backend function that calculates available milk by subtracting accepted orders

## Requirements

### Requirement 1: Real-Time Milk Availability Updates for Buyers

**User Story:** As a buyer, I want to see accurate real-time milk availability, so that I know how much milk is actually available for purchase after other orders are accepted.

#### Acceptance Criteria

1. WHEN a delivery boy changes an order status from Pending to Approved, THEN THE System SHALL immediately reduce the displayed milk availability for all buyers
2. WHEN a buyer views the milk availability, THEN THE System SHALL display the quantity calculated by subtracting all approved orders from the total collected milk
3. WHEN a buyer's dashboard is open, THEN THE System SHALL automatically refresh milk availability every 30 seconds
4. WHEN a buyer successfully places an order, THEN THE System SHALL immediately refresh the milk availability display without requiring manual page refresh
5. WHEN an order status changes to Cancelled, THEN THE System SHALL restore the milk availability by adding back the cancelled order quantity

### Requirement 2: Complete Delivery Workflow Status Transitions

**User Story:** As a delivery boy, I want a complete delivery workflow with intermediate status steps, so that I can accurately track orders from acceptance through delivery completion.

#### Acceptance Criteria

1. WHEN a delivery boy accepts a pending order, THEN THE System SHALL change the order status to Approved
2. WHEN a delivery boy starts delivering an approved order, THEN THE System SHALL provide an option to change the order status to Out for Delivery
3. WHEN an order status is Out for Delivery, THEN THE System SHALL provide an option to change the order status to Completed
4. WHEN an order status is Out for Delivery, THEN THE System SHALL display a navigation button to help the delivery boy reach the destination
5. THE System SHALL prevent direct status changes from Approved to Completed without going through Out for Delivery
6. WHEN an order status changes, THEN THE System SHALL display appropriate visual indicators for each status (Pending, Approved, Out for Delivery, Completed)
7. WHEN displaying order status buttons, THEN THE System SHALL only show buttons appropriate for the current order status

### Requirement 3: Navigation Consistency with Back Buttons

**User Story:** As a delivery boy, I want back buttons on all delivery pages, so that I can easily navigate back to the main dashboard or previous page.

#### Acceptance Criteria

1. WHEN a delivery boy is on the DeliveryRequests_Page, THEN THE System SHALL display a back button that navigates to the employee dashboard
2. WHEN a delivery boy is on the DeliveryHistory_Page, THEN THE System SHALL display a back button that navigates to the employee dashboard
3. WHEN a delivery boy is on the DeliveryStats_Page, THEN THE System SHALL display a back button that navigates to the employee dashboard
4. WHEN a delivery boy is on the DeliveryOverview_Page, THEN THE System SHALL display a back button that navigates to the employee dashboard
5. THE System SHALL ensure all back buttons have consistent visual design across all delivery pages
6. WHEN a back button is clicked, THEN THE System SHALL navigate to the appropriate previous page without data loss

### Requirement 4: Order Status Impact on Milk Availability

**User Story:** As a system administrator, I want clear rules for how order status changes affect milk availability, so that the system maintains accurate inventory tracking.

#### Acceptance Criteria

1. WHEN an order status is Pending, THEN THE System SHALL NOT reduce milk availability
2. WHEN an order status changes to Approved, THEN THE System SHALL reduce milk availability by the order quantity
3. WHEN an order status is Out for Delivery, THEN THE System SHALL maintain the reduced milk availability
4. WHEN an order status is Completed, THEN THE System SHALL NOT change milk availability (order already accounted for in Approved status)
5. WHEN an order status changes to Cancelled from any status, THEN THE System SHALL restore milk availability by adding back the order quantity if it was previously reduced

### Requirement 5: Frontend-Backend Synchronization for Milk Availability

**User Story:** As a developer, I want the frontend to properly synchronize with backend milk availability calculations, so that buyers always see accurate data.

#### Acceptance Criteria

1. WHEN the Buyer_Dashboard loads, THEN THE System SHALL fetch milk availability from the backend using calculateSessionMilkCollection
2. WHEN the PlaceOrderModal closes after successful order placement, THEN THE System SHALL trigger an immediate refresh of the Buyer_Dashboard milk availability
3. WHEN the 30-second auto-refresh timer triggers, THEN THE System SHALL fetch updated milk availability from the backend
4. WHEN milk availability data is fetched, THEN THE System SHALL update the display without full page reload
5. THE System SHALL use the same calculateSessionMilkCollection function for all milk availability calculations to ensure consistency

### Requirement 6: Delivery Workflow UI Enhancements

**User Story:** As a delivery boy, I want clear visual indicators and intuitive buttons for each delivery status, so that I can efficiently manage my deliveries.

#### Acceptance Criteria

1. WHEN an order status is Pending, THEN THE System SHALL display an "Accept Order" button
2. WHEN an order status is Approved, THEN THE System SHALL display a "Start Delivery" button
3. WHEN an order status is Out for Delivery, THEN THE System SHALL display both a "Complete Delivery" button and a "Navigate" button
4. WHEN an order status is Completed, THEN THE System SHALL display a completion indicator with no action buttons
5. THE System SHALL use distinct colors or icons for each order status (Pending: yellow/warning, Approved: blue/info, Out for Delivery: purple/primary, Completed: green/success)
6. WHEN displaying multiple orders, THEN THE System SHALL group or sort orders by status for easy management
