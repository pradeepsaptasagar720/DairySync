import request from 'supertest';
import app from '../app.js';
import User from '../models/User.model.js';
import Delivery from '../models/Delivery.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Property-Based Test for Accepted Order Payment Tracking Bugfix
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * Property 1: Fault Condition - Accepted Orders Appear in Payment Tracking
 * For any order where the bug condition holds (order.status = "Accepted"), 
 * the fixed getAdminBuyerPayments function SHALL include that order in the 
 * returned payments array and SHALL include the order's totalAmount in the 
 * summary calculations (totalAmount, paidAmount or pendingAmount based on 
 * paymentCompleted status, and payment method counts).
 * 
 * CRITICAL: This test MUST FAIL on unfixed code (this confirms the bug exists).
 * When the test FAILS, it proves that "Accepted" orders are excluded from 
 * admin payment tracking.
 * 
 * After the fix is implemented, this SAME test will PASS, confirming the 
 * expected behavior is satisfied.
 */

describe('Accepted Order Payment Tracking - Bug Condition Exploration', () => {
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
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Delivery.deleteMany({});
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  /**
   * Property 1: Accepted Orders Appear in Admin Payment Tracking
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * EXPECTED OUTCOME ON UNFIXED CODE: This test FAILS
   * - Order with "Accepted" status is NOT in payments array
   * - Summary totals do NOT include the accepted order amount
   * - This failure confirms the bug exists
   * 
   * EXPECTED OUTCOME ON FIXED CODE: This test PASSES
   * - Order with "Accepted" status IS in payments array
   * - Summary totals DO include the accepted order amount
   * - This confirms the fix works correctly
   */
  it('Property 1: Orders with status="Accepted" appear in getAdminBuyerPayments response', async () => {
    // GIVEN an order with status "Accepted" (bug condition)
    const acceptedOrder = await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'cow',
      quantity: 5,
      rate: 50,
      totalAmount: 250,
      address: 'Test Address 1',
      deliveryDate: new Date(),
      status: 'Accepted', // BUG CONDITION: This status should be visible but is currently excluded
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

    // AND the order with "Accepted" status SHALL appear in the payments array
    const payments = response.body.data.payments;
    const acceptedOrderInResponse = payments.find(
      p => p._id.toString() === acceptedOrder._id.toString()
    );

    // ASSERTION: This will FAIL on unfixed code (proving bug exists)
    expect(acceptedOrderInResponse).toBeDefined();
    expect(acceptedOrderInResponse.status).toBe('Accepted');
    expect(acceptedOrderInResponse.totalAmount).toBe(250);
    expect(acceptedOrderInResponse.paymentMethod).toBe('cod');
    expect(acceptedOrderInResponse.paymentCompleted).toBe(false);
  });

  /**
   * Property 1: Accepted Orders Included in Summary.totalAmount
   * 
   * **Validates: Requirement 2.3**
   */
  it('Property 1: Accepted orders are included in summary.totalAmount calculation', async () => {
    // GIVEN multiple orders including one with "Accepted" status
    await Delivery.insertMany([
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 10,
        rate: 50,
        totalAmount: 500,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Completed',
        paymentMethod: 'upi',
        paymentCompleted: true,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 5,
        rate: 60,
        totalAmount: 300,
        address: 'Test Address 2',
        deliveryDate: new Date(),
        status: 'Accepted', // BUG CONDITION
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 3,
        rate: 50,
        totalAmount: 150,
        address: 'Test Address 3',
        deliveryDate: new Date(),
        status: 'Pending',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      }
    ]);

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the summary.totalAmount SHALL include the accepted order amount
    const summary = response.body.data.summary;
    
    // Expected: 500 (Completed) + 300 (Accepted) + 150 (Pending) = 950
    // On unfixed code: 500 (Completed) + 150 (Pending) = 650 (missing Accepted)
    
    // ASSERTION: This will FAIL on unfixed code (proving bug exists)
    expect(summary.totalAmount).toBe(950);
    expect(summary.totalOrders).toBe(3);
  });

  /**
   * Property 1: Accepted Orders with paymentCompleted=true in summary.paidAmount
   * 
   * **Validates: Requirement 2.3**
   */
  it('Property 1: Accepted orders with paymentCompleted=true are included in summary.paidAmount', async () => {
    // GIVEN an accepted order with payment completed
    await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'cow',
      quantity: 5,
      rate: 50,
      totalAmount: 250,
      address: 'Test Address 1',
      deliveryDate: new Date(),
      status: 'Accepted', // BUG CONDITION
      paymentMethod: 'upi',
      paymentCompleted: true, // Payment is completed
      paymentDate: new Date(),
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the summary.paidAmount SHALL include the accepted order amount
    const summary = response.body.data.summary;
    
    // ASSERTION: This will FAIL on unfixed code (proving bug exists)
    expect(summary.paidAmount).toBe(250);
    expect(summary.totalAmount).toBe(250);
    expect(summary.pendingAmount).toBe(0);
  });

  /**
   * Property 1: Accepted Orders with paymentCompleted=false in summary.pendingAmount
   * 
   * **Validates: Requirement 2.3**
   */
  it('Property 1: Accepted orders with paymentCompleted=false are included in summary.pendingAmount', async () => {
    // GIVEN an accepted order with payment pending
    await Delivery.create({
      buyer: buyerUser._id,
      milkType: 'cow',
      quantity: 5,
      rate: 50,
      totalAmount: 250,
      address: 'Test Address 1',
      deliveryDate: new Date(),
      status: 'Accepted', // BUG CONDITION
      paymentMethod: 'cod',
      paymentCompleted: false, // Payment is pending
      handledBy: employeeUser._id
    });

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the summary.pendingAmount SHALL include the accepted order amount
    const summary = response.body.data.summary;
    
    // ASSERTION: This will FAIL on unfixed code (proving bug exists)
    expect(summary.pendingAmount).toBe(250);
    expect(summary.totalAmount).toBe(250);
    expect(summary.paidAmount).toBe(0);
  });

  /**
   * Property 1: Accepted Orders Counted in Payment Method Summaries
   * 
   * **Validates: Requirement 2.3**
   */
  it('Property 1: Accepted orders are counted in payment method summaries (COD)', async () => {
    // GIVEN accepted orders with COD payment method
    await Delivery.insertMany([
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 5,
        rate: 50,
        totalAmount: 250,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Accepted', // BUG CONDITION
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
        status: 'Accepted', // BUG CONDITION
        paymentMethod: 'cod',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      }
    ]);

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the payment method summaries SHALL include accepted orders
    const summary = response.body.data.summary;
    
    // ASSERTION: This will FAIL on unfixed code (proving bug exists)
    expect(summary.codPayments).toBe(2); // Both COD orders
    expect(summary.codPending).toBe(1); // One pending
    expect(summary.codCompleted).toBe(1); // One completed
  });

  /**
   * Property 1: Accepted Orders Counted in Payment Method Summaries (Online)
   * 
   * **Validates: Requirement 2.3**
   */
  it('Property 1: Accepted orders are counted in payment method summaries (Online)', async () => {
    // GIVEN accepted orders with online payment methods
    await Delivery.insertMany([
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 5,
        rate: 50,
        totalAmount: 250,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Accepted', // BUG CONDITION
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(),
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
        status: 'Accepted', // BUG CONDITION
        paymentMethod: 'card',
        paymentCompleted: true,
        paymentDate: new Date(),
        handledBy: employeeUser._id
      }
    ]);

    // WHEN admin views the buyer payments page
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the online payment count SHALL include accepted orders
    const summary = response.body.data.summary;
    
    // ASSERTION: This will FAIL on unfixed code (proving bug exists)
    expect(summary.onlinePayments).toBe(2); // Both online payments (upi + card)
  });

  /**
   * Property 1: Status Transition - Order Disappears When Accepted
   * 
   * **Validates: Requirement 2.1**
   * 
   * This test demonstrates the bug in action: when a delivery boy accepts
   * an order (status changes from "Pending" to "Accepted"), the order
   * disappears from the admin payment tracking.
   */
  it('Property 1: Order remains visible after status transition from Pending to Accepted', async () => {
    // GIVEN an order with "Pending" status
    const order = await Delivery.create({
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

    // WHEN admin views the buyer payments page (before acceptance)
    const responseBefore = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the order SHALL be visible
    const paymentsBefore = responseBefore.body.data.payments;
    const orderBeforeAcceptance = paymentsBefore.find(
      p => p._id.toString() === order._id.toString()
    );
    expect(orderBeforeAcceptance).toBeDefined();
    expect(orderBeforeAcceptance.status).toBe('Pending');

    // WHEN delivery boy accepts the order (status changes to "Accepted")
    order.status = 'Accepted';
    order.acceptedAt = new Date();
    await order.save();

    // AND admin views the buyer payments page again (after acceptance)
    const responseAfter = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the order SHALL still be visible (not disappear)
    const paymentsAfter = responseAfter.body.data.payments;
    const orderAfterAcceptance = paymentsAfter.find(
      p => p._id.toString() === order._id.toString()
    );

    // ASSERTION: This will FAIL on unfixed code (order disappears after acceptance)
    expect(orderAfterAcceptance).toBeDefined();
    expect(orderAfterAcceptance.status).toBe('Accepted');
    expect(orderAfterAcceptance.totalAmount).toBe(250);
  });
});
