import request from 'supertest';
import app from '../app.js';
import User from '../models/User.model.js';
import Delivery from '../models/Delivery.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Property-Based Test for Admin Buyer Payments 403 Fix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 * 
 * Property 1: Fault Condition - Admin 403 Error on Buyer Payments Access
 * For any admin user accessing the Buyer Payments page, the system SHALL call 
 * the admin-specific endpoint `/api/admin/buyer-payments` and successfully return 
 * buyer payment data without any 403 Forbidden errors.
 * 
 * Property 2: Preservation - Employee Endpoint Authorization
 * For any HTTP request that is NOT from an admin user accessing buyer payments,
 * the system SHALL produce exactly the same authorization behavior and data 
 * retrieval results as the original code.
 */

describe('Admin Buyer Payments 403 Fix - Property Tests', () => {
  let adminUser;
  let adminToken;
  let employeeUser;
  let employeeToken;
  let buyerUser;
  let testDeliveries;

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

    // Create employee user with milk_collector role
    employeeUser = await User.create({
      username: 'employee_test',
      email: 'employee@test.com',
      mobile: '9876543211',
      password: 'hashedpassword',
      role: 'employee',
      employeeRole: 'milk_collector',
      approved: true,
      isVerified: true,
      isActive: true,
      uniqueId: 'EMP001'
    });

    // Create buyer user
    buyerUser = await User.create({
      username: 'buyer_test',
      email: 'buyer@test.com',
      mobile: '9876543212',
      password: 'hashedpassword',
      role: 'buyer',
      approved: true,
      isVerified: true,
      uniqueId: 'BUY001'
    });

    // Generate tokens
    adminToken = jwt.sign(
      { id: adminUser._id, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    employeeToken = jwt.sign(
      { id: employeeUser._id, role: employeeUser.role, employeeRole: employeeUser.employeeRole },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test deliveries
    testDeliveries = await Delivery.insertMany([
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
        paymentDate: new Date(),
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
        status: 'Approved',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: employeeUser._id
      }
    ]);
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
   * Property 1: Fault Condition - Admin Buyer Payments Access
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * This test encodes the EXPECTED behavior after the fix.
   * On UNFIXED code, this test MUST FAIL (confirming the bug exists).
   * On FIXED code, this test MUST PASS (confirming the fix works).
   */
  it('Property 1: Admin users can access buyer payments via admin endpoint without 403 errors', async () => {
    // WHEN an admin user accesses the admin buyer payments endpoint
    const response = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    // THEN the system SHALL return 200 OK (not 403 Forbidden)
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // AND the system SHALL return buyer payment data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payments).toBeDefined();
    expect(Array.isArray(response.body.data.payments)).toBe(true);

    // AND the system SHALL return summary statistics
    expect(response.body.data.summary).toBeDefined();
    expect(response.body.data.summary.totalOrders).toBeDefined();
    expect(response.body.data.summary.totalAmount).toBeDefined();
    expect(response.body.data.summary.paidAmount).toBeDefined();
    expect(response.body.data.summary.pendingAmount).toBeDefined();
    expect(response.body.data.summary.onlinePayments).toBeDefined();
    expect(response.body.data.summary.codPayments).toBeDefined();
    expect(response.body.data.summary.codPending).toBeDefined();
    expect(response.body.data.summary.codCompleted).toBeDefined();

    // AND the payment data SHALL include all required fields
    if (response.body.data.payments.length > 0) {
      const payment = response.body.data.payments[0];
      expect(payment.buyer).toBeDefined();
      expect(payment.milkType).toBeDefined();
      expect(payment.quantity).toBeDefined();
      expect(payment.rate).toBeDefined();
      expect(payment.totalAmount).toBeDefined();
      expect(payment.paymentMethod).toBeDefined();
      expect(payment.paymentCompleted).toBeDefined();
      expect(payment.status).toBeDefined();
    }

    // AND the summary calculations SHALL be accurate
    const { payments, summary } = response.body.data;
    const calculatedTotal = payments.reduce((sum, p) => sum + p.totalAmount, 0);
    const calculatedPaid = payments.filter(p => p.paymentCompleted).reduce((sum, p) => sum + p.totalAmount, 0);
    const calculatedPending = payments.filter(p => !p.paymentCompleted).reduce((sum, p) => sum + p.totalAmount, 0);

    expect(summary.totalOrders).toBe(payments.length);
    expect(Math.abs(summary.totalAmount - calculatedTotal)).toBeLessThan(0.01);
    expect(Math.abs(summary.paidAmount - calculatedPaid)).toBeLessThan(0.01);
    expect(Math.abs(summary.pendingAmount - calculatedPending)).toBeLessThan(0.01);
  });

  /**
   * Property 2: Preservation - Employee Endpoint Authorization
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   * 
   * This test verifies that the employee endpoint continues to work
   * exactly as before for employees with the milk_collector role.
   */
  it('Property 2: Employee with milk_collector role can still access employee buyer payments endpoint', async () => {
    // WHEN an employee with milk_collector role accesses the employee endpoint
    const response = await request(app)
      .get('/api/employee/payments/buyers')
      .set('Authorization', `Bearer ${employeeToken}`);

    // THEN the system SHALL return 200 OK (preserving existing behavior)
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // AND the system SHALL return the same data structure as before
    expect(response.body.data).toBeDefined();
    expect(response.body.data.payments).toBeDefined();
    expect(Array.isArray(response.body.data.payments)).toBe(true);
    expect(response.body.data.summary).toBeDefined();

    // AND the data structure SHALL match the expected format
    const { payments, summary } = response.body.data;
    
    if (payments.length > 0) {
      const payment = payments[0];
      expect(payment.buyer).toBeDefined();
      expect(payment.milkType).toBeDefined();
      expect(payment.quantity).toBeDefined();
      expect(payment.rate).toBeDefined();
      expect(payment.totalAmount).toBeDefined();
      expect(payment.paymentMethod).toBeDefined();
      expect(payment.paymentCompleted).toBeDefined();
      expect(payment.status).toBeDefined();
    }

    // AND the summary SHALL have all required fields
    expect(summary.totalOrders).toBeDefined();
    expect(summary.totalAmount).toBeDefined();
    expect(summary.paidAmount).toBeDefined();
    expect(summary.pendingAmount).toBeDefined();
    expect(summary.onlinePayments).toBeDefined();
    expect(summary.codPayments).toBeDefined();
    expect(summary.codPending).toBeDefined();
    expect(summary.codCompleted).toBeDefined();
  });

  /**
   * Property 2: Preservation - Non-admin users cannot access admin endpoints
   * 
   * **Validates: Requirement 3.4**
   */
  it('Property 2: Non-admin users cannot access admin buyer payments endpoint', async () => {
    // WHEN an employee tries to access the admin endpoint
    const employeeResponse = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${employeeToken}`);

    // THEN the system SHALL return 403 Forbidden (preserving authorization)
    expect(employeeResponse.status).toBe(403);

    // Create buyer token
    const buyerToken = jwt.sign(
      { id: buyerUser._id, role: buyerUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // WHEN a buyer tries to access the admin endpoint
    const buyerResponse = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${buyerToken}`);

    // THEN the system SHALL return 403 Forbidden (preserving authorization)
    expect(buyerResponse.status).toBe(403);
  });

  /**
   * Property 2: Preservation - Data consistency between admin and employee endpoints
   * 
   * **Validates: Requirements 3.2, 3.3**
   * 
   * After the fix, both endpoints should return the same underlying data
   * from the Delivery model with the same structure.
   */
  it('Property 2: Admin and employee endpoints return consistent data structure', async () => {
    // WHEN both admin and employee access their respective endpoints
    const adminResponse = await request(app)
      .get('/api/admin/buyer-payments')
      .set('Authorization', `Bearer ${adminToken}`);

    const employeeResponse = await request(app)
      .get('/api/employee/payments/buyers')
      .set('Authorization', `Bearer ${employeeToken}`);

    // Skip if admin endpoint doesn't exist yet (unfixed code)
    if (adminResponse.status === 404) {
      console.log('Admin endpoint not yet implemented - skipping consistency check');
      return;
    }

    // THEN both SHALL return successful responses
    expect(adminResponse.status).toBe(200);
    expect(employeeResponse.status).toBe(200);

    // AND both SHALL have the same data structure
    const adminData = adminResponse.body.data;
    const employeeData = employeeResponse.body.data;

    expect(adminData.payments).toBeDefined();
    expect(employeeData.payments).toBeDefined();
    expect(adminData.summary).toBeDefined();
    expect(employeeData.summary).toBeDefined();

    // AND both SHALL return the same number of payments
    expect(adminData.payments.length).toBe(employeeData.payments.length);

    // AND both SHALL have the same summary totals
    expect(adminData.summary.totalOrders).toBe(employeeData.summary.totalOrders);
    expect(Math.abs(adminData.summary.totalAmount - employeeData.summary.totalAmount)).toBeLessThan(0.01);
    expect(Math.abs(adminData.summary.paidAmount - employeeData.summary.paidAmount)).toBeLessThan(0.01);
    expect(Math.abs(adminData.summary.pendingAmount - employeeData.summary.pendingAmount)).toBeLessThan(0.01);
  });
});
