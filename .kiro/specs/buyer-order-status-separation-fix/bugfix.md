# Bugfix Requirements Document

## Introduction

This document addresses two related bugs in the buyer payment and order management system that affect data visibility and order categorization. Bug 1 prevents admins from seeing all buyer purchases needed for profit/sales analysis. Bug 2 causes incorrect separation of active vs historical orders for buyers, with "Out for Delivery" orders appearing in the wrong section.

Both bugs stem from incorrect status filtering in backend controller queries, resulting in missing or miscategorized data on the frontend.

## Bug Analysis

### Current Behavior (Defect)

**Bug 1: Admin Buyer Payments Data Visibility**

1.1 WHEN admin accesses the buyer payments page THEN the system displays empty data, excluding orders with "Pending" and "Approved" statuses

1.2 WHEN admin attempts to analyze profit/sales data THEN the system only shows orders with "Completed" and "Out for Delivery" statuses, providing incomplete business analytics

**Bug 2: Buyer Order Status and History Separation**

1.3 WHEN buyer accesses Order Status page THEN the system excludes "Out for Delivery" orders, showing only "Pending" and "Approved" orders

1.4 WHEN buyer accesses Order History page THEN the system incorrectly includes "Out for Delivery" orders alongside completed and cancelled orders

1.5 WHEN an order status is "Out for Delivery" THEN the system categorizes it as historical instead of active

### Expected Behavior (Correct)

**Bug 1: Admin Buyer Payments Data Visibility**

2.1 WHEN admin accesses the buyer payments page THEN the system SHALL display ALL buyer purchases including orders with statuses: "Pending", "Approved", "Out for Delivery", and "Completed"

2.2 WHEN admin attempts to analyze profit/sales data THEN the system SHALL provide complete business analytics by including all relevant order statuses

**Bug 2: Buyer Order Status and History Separation**

2.3 WHEN buyer accesses Order Status page THEN the system SHALL display only current/active orders with statuses: "Pending", "Approved", and "Out for Delivery"

2.4 WHEN buyer accesses Order History page THEN the system SHALL display only completed and cancelled orders, excluding "Out for Delivery" orders

2.5 WHEN an order status is "Out for Delivery" THEN the system SHALL categorize it as an active order visible in Order Status

2.6 WHEN an order status changes to "Completed" THEN the system SHALL automatically move it from Order Status to Order History

### Unchanged Behavior (Regression Prevention)

3.1 WHEN employee accesses buyer payments endpoint THEN the system SHALL CONTINUE TO correctly include statuses ["Completed", "Out for Delivery", "Approved"]

3.2 WHEN orders have status "Cancelled" THEN the system SHALL CONTINUE TO display them in Order History

3.3 WHEN orders have status "Completed" THEN the system SHALL CONTINUE TO display them in Order History

3.4 WHEN the Delivery model is queried THEN the system SHALL CONTINUE TO access all necessary fields (milkType, quantity, rate, totalAmount, paymentMethod, paymentCompleted, paymentDate, status, buyer, handledBy)

3.5 WHEN frontend pages call backend endpoints THEN the system SHALL CONTINUE TO use the correct API routes without modification

3.6 WHEN status enum values are referenced THEN the system SHALL CONTINUE TO use ["Pending", "Accepted", "Out for Delivery", "Completed", "Cancelled"]
