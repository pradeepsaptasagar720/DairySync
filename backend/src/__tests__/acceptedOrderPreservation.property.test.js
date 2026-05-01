import request from 'supertest';
import app from '../app.js';
import User from '../models/User.model.js';
import Delivery from '../models/Delivery.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Property-Based Test for Accepted Order Payment Tracking - Preservation
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * Property 2: Preservation - Non-Accepted Orders Display Unchanged
 * For any order where the bug condition does NOT hold (order.status IN 
 * ["Pending", "Approved", "Out for Delivery", "Completed"]), the fixed 
 * getAdminBuyerPayments function SHALL produce exactly the same result as 
 * the original function, preserving the order's presence in the payments 
 * array, its formatting, and its contribution to summary calculations.
 * 
 * IMPORTANT: This test follows observation-first methodology.
 * These tests are run on UNFIXED code to observe baseline behavior.
 * They should PASS on unfixed code (confirming behavior to preserve).
 * After the fix, these tests should still PASS (confirming no regressions).
 */

describe('Accepted Order Payment Tracking - Preservation Tests', () => {
  let adminUser;
  let adminToken;
  let buyerUser;
  let employeeUser;

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Delivery.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      username: 'admin_test',
      email: 'admin@test.com',
      mobile: '9876543210',
      password: 'hashedpassword',
      role: 'admin',
      approved: true,
      isVerified: true,
      uniqueId: 'ADMIN001'
    });

    // Create buyer user
    buyerUser = await User.create({
      username: 'buyer_test',
      email: 'buyer@test.com',
      mobile: '9876543211',
      password: 'hashedpassword',
      role: 'buyer',
      approved: true,
      isVerified: true,
      uniqueId: 'BUY001'
    });

    // Create employee user (delivery boy)
    employeeUser = await User.create({
      username: 'employee_test',
      email: 'employee@test.com',
      mobile: '9876543212',
      password: 'hashedpassword',
      role: 'employee',
      employeeRole: 'delivery_boy',
      approved: true,
      isVerified: true,
      isActive: true,
      uniqueId: 'EMP001'
    });

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  }, 30000);

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Delivery.deleteMany({});
  }, 30000);

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Property 2: Orders with "Pending" status appear in payments array
   * 
   * **Validates: Requirement 3.1**
   * 
   * EXPECTED OUTCOME: This test PASSES on unfixed code
   * - Confirms baseline behavior: "Pending" orders are visible
   * - After fix: Should still PASS (no regression)
   */
  it('Property 2: Orders with status="Pending" appear in payments array', async () => {
    // GIVEN an order with status "Pending"
    const pendingOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'cow',
      quantity: 5,
      rate: 50,
      totalAmount: 250,
      address: 'Test Address 1',
      deliveryDate: new Date(),
      status: 'Pending',
      paymentMethod: 'cod',
      paymentCompleted: false,
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the system SHALL return 200 OK
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // AND the order with "Pending" status SHALL appear in the payments array
    const payments = response.body.data.payments;
    const pendingOrderInResponse = payments.find(
      p => p._id.toString() === pendingOrder._id.toString()
    );

    expect(pendingOrderInResponse).toBeDefined();
    expect(pendingOrderInResponse.status).toBe('Pending');
    expect(pendingOrderInResponse.totalAmount).toBe(250);
    expect(pendingOrderInResponse.paymentMethod).toBe('cod');
  });

  /**
   * Property 2: Orders with "Approved" status appear in payments array
   * 
   * **Validates: Requirement 3.1**
   */
  it('Property 2: Orders with status="Approved" appear in payments array', async () => {
    // GIVEN an order with status "Approved"
    const approvedOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'buffalo',
      quantity: 3,
      rate: 60,
      totalAmount: 180,
      address: 'Test Address 2',
      deliveryDate: new Date(),
      status: 'Approved',
      paymentMethod: 'upi',
      paymentCompleted: true,
      paymentDate: new Date(),
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the order with "Approved" status SHALL appear in the payments array
    const payments = response.body.data.payments;
    const approvedOrderInResponse = payments.find(
      p => p._id.toString() === approvedOrder._id.toString()
    );

    expect(approvedOrderInResponse).toBeDefined();
    expect(approvedOrderInResponse.status).toBe('Approved');
    expect(approvedOrderInResponse.totalAmount).toBe(180);
    expect(approvedOrderInResponse.paymentMethod).toBe('upi');
  });

  /**
   * Property 2: Orders with "Out for Delivery" status appear in payments array
   * 
   * **Validates: Requirement 3.1**
   */
  it('Property 2: Orders with status="Out for Delivery" appear in payments array', async () => {
    // GIVEN an order with status "Out for Delivery"
    const outForDeliveryOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'cow',
      quantity: 10,
      rate: 50,
      totalAmount: 500,
      address: 'Test Address 3',
      deliveryDate: new Date(),
      status: 'Out for Delivery',
      paymentMethod: 'card',
      paymentCompleted: false,
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the order with "Out for Delivery" status SHALL appear in the payments array
    const payments = response.body.data.payments;
    const outForDeliveryOrderInResponse = payments.find(
      p => p._id.toString() === outForDeliveryOrder._id.toString()
    );

    expect(outForDeliveryOrderInResponse).toBeDefined();
    expect(outForDeliveryOrderInResponse.status).toBe('Out for Delivery');
    expect(outForDeliveryOrderInResponse.totalAmount).toBe(500);
    expect(outForDeliveryOrderInResponse.paymentMethod).toBe('card');
  });

  /**
   * Property 2: Orders with "Completed" status appear in payments array
   * 
   * **Validates: Requirement 3.1**
   */
  it('Property 2: Orders with status="Completed" appear in payments array', async () => {
    // GIVEN an order with status "Completed"
    const completedOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'buffalo',
      quantity: 7,
      rate: 60,
      totalAmount: 420,
      address: 'Test Address 4',
      deliveryDate: new Date(),
      status: 'Completed',
      paymentMethod: 'upi',
      paymentCompleted: true,
      paymentDate: new Date(),
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the order with "Completed" status SHALL appear in the payments array
    const payments = response.body.data.payments;
    const completedOrderInResponse = payments.find(
      p => p._id.toString() === completedOrder._id.toString()
    );

    expect(completedOrderInResponse).toBeDefined();
    expect(completedOrderInResponse.status).toBe('Completed');
    expect(completedOrderInResponse.totalAmount).toBe(420);
    expect(completedOrderInResponse.paymentMethod).toBe('upi');
  });

  /**
   * Property 2: Summary calculations work correctly for existing statuses
   * 
   * **Validates: Requirement 3.2**
   */
  it('Property 2: Summary calculations include all existing status orders correctly', async () => {
    // GIVEN multiple orders with existing statuses
    await Delivery.insertMany([
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 5,
        rate: 50,
        totalAmount: 250,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Pending',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 3,
        rate: 60,
        totalAmount: 180,
        address: 'Test Address 2',
        deliveryDate: new Date(),
        status: 'Approved',
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 10,
        rate: 50,
        totalAmount: 500,
        address: 'Test Address 3',
        deliveryDate: new Date(),
        status: 'Out for Delivery',
        paymentMethod: 'card',
        paymentCompleted: false,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 7,
        rate: 60,
        totalAmount: 420,
        address: 'Test Address 4',
        deliveryDate: new Date(),
        status: 'Completed',
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      }
    ]);

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the summary SHALL calculate totals correctly
    const summary = response.body.data.summary;
    
    // Total: 250 + 180 + 500 + 420 = 1350
    expect(summary.totalAmount).toBe(1350);
    expect(summary.totalOrders).toBe(4);
    
    // Paid: 180 (Approved) + 420 (Completed) = 600
    expect(summary.paidAmount).toBe(600);
    
    // Pending: 250 (Pending) + 500 (Out for Delivery) = 750
    expect(summary.pendingAmount).toBe(750);
  });

  /**
   * Property 2: Payment method counts are accurate for existing statuses
   * 
   * **Validates: Requirement 3.2**
   */
  it('Property 2: Payment method counts work correctly for existing statuses', async () => {
    // GIVEN orders with various payment methods and existing statuses
    await Delivery.insertMany([
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 5,
        rate: 50,
        totalAmount: 250,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Pending',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 3,
        rate: 60,
        totalAmount: 180,
        address: 'Test Address 2',
        deliveryDate: new Date(),
        status: 'Completed',
        paymentMethod: 'cod',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 10,
        rate: 50,
        totalAmount: 500,
        address: 'Test Address 3',
        deliveryDate: new Date(),
        status: 'Out for Delivery',
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 7,
        rate: 60,
        totalAmount: 420,
        address: 'Test Address 4',
        deliveryDate: new Date(),
        status: 'Approved',
        paymentMethod: 'card',
        paymentCompleted: false,
        handledBy: employeeUser._id
      }
    ]);

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the payment method counts SHALL be accurate
    const summary = response.body.data.summary;
    
    // COD: 2 orders (1 pending, 1 completed)
    expect(summary.codPayments).toBe(2);
    expect(summary.codPending).toBe(1);
    expect(summary.codCompleted).toBe(1);
    
    // Online: 2 orders (upi + card)
    expect(summary.onlinePayments).toBe(2);
  });

  /**
   * Property 2: Orders with "Cancelled" status remain excluded
   * 
   * **Validates: Requirement 3.4**
   * 
   * This test confirms that "Cancelled" orders should NOT appear in the
   * payment tracking, and this behavior must be preserved after the fix.
   */
  it('Property 2: Orders with status="Cancelled" do NOT appear in payments array', async () => {
    // GIVEN orders with various statuses including "Cancelled"
    const cancelledOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'cow',
      quantity: 5,
      rate: 50,
      totalAmount: 250,
      address: 'Test Address 1',
      deliveryDate: new Date(),
      status: 'Cancelled',
      paymentMethod: 'cod',
      paymentCompleted: false,
      handledBy: employeeUser._id
    });

    const pendingOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'buffalo',
      quantity: 3,
      rate: 60,
      totalAmount: 180,
      address: 'Test Address 2',
      deliveryDate: new Date(),
      status: 'Pending',
      paymentMethod: 'upi',
      paymentCompleted: false,
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the "Cancelled" order SHALL NOT appear in the payments array
    const payments = response.body.data.payments;
    const cancelledOrderInResponse = payments.find(
      p => p._id.toString() === cancelledOrder._id.toString()
    );
    const pendingOrderInResponse = payments.find(
      p => p._id.toString() === pendingOrder._id.toString()
    );

    // Cancelled order should NOT be in the response
    expect(cancelledOrderInResponse).toBeUndefined();
    
    // Pending order should be in the response
    expect(pendingOrderInResponse).toBeDefined();
    
    // Summary should only include the pending order
    const summary = response.body.data.summary;
    expect(summary.totalAmount).toBe(180); // Only pending order
    expect(summary.totalOrders).toBe(1); // Only pending order
  });

  /**
   * Property 2: Multiple orders with existing statuses display correctly
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * This comprehensive test verifies that all existing statuses work
   * correctly together, and this behavior is preserved after the fix.
   */
  it('Property 2: Multiple orders with all existing statuses display correctly', async () => {
    // GIVEN multiple orders with all existing statuses
    const orders = await Delivery.insertMany([
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 5,
        rate: 50,
        totalAmount: 250,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Pending',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 3,
        rate: 60,
        totalAmount: 180,
        address: 'Test Address 2',
        deliveryDate: new Date(),
        status: 'Approved',
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 10,
        rate: 50,
        totalAmount: 500,
        address: 'Test Address 3',
        deliveryDate: new Date(),
        status: 'Out for Delivery',
        paymentMethod: 'card',
        paymentCompleted: false,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 7,
        rate: 60,
        totalAmount: 420,
        address: 'Test Address 4',
        deliveryDate: new Date(),
        status: 'Completed',
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 2,
        rate: 50,
        totalAmount: 100,
        address: 'Test Address 5',
        deliveryDate: new Date(),
        status: 'Cancelled',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      }
    ]);

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN all orders except "Cancelled" SHALL appear in the payments array
    const payments = response.body.data.payments;
    
    // Verify each order (except Cancelled) is present
    const pendingOrder = payments.find(p => p.status === 'Pending');
    const approvedOrder = payments.find(p => p.status === 'Approved');
    const outForDeliveryOrder = payments.find(p => p.status === 'Out for Delivery');
    const completedOrder = payments.find(p => p.status === 'Completed');
    const cancelledOrder = payments.find(p => p.status === 'Cancelled');

    expect(pendingOrder).toBeDefined();
    expect(approvedOrder).toBeDefined();
    expect(outForDeliveryOrder).toBeDefined();
    expect(completedOrder).toBeDefined();
    expect(cancelledOrder).toBeUndefined(); // Cancelled should NOT appear

    // Verify summary calculations
    const summary = response.body.data.summary;
    
    // Total: 250 + 180 + 500 + 420 = 1350 (excluding Cancelled 100)
    expect(summary.totalAmount).toBe(1350);
    expect(summary.totalOrders).toBe(4); // 4 orders (excluding Cancelled)
    
    // Paid: 180 (Approved) + 420 (Completed) = 600
    expect(summary.paidAmount).toBe(600);
    
    // Pending: 250 (Pending) + 500 (Out for Delivery) = 750
    expect(summary.pendingAmount).toBe(750);
  });
});
