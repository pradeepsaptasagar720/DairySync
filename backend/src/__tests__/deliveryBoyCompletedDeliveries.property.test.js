import request from 'supertest';
import app from '../app.js';
import User from '../models/User.model.js';
import Delivery from '../models/Delivery.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Property-Based Test for Delivery Boy Completed Deliveries and Sidebar Bugfix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 * 
 * Property 1: Fault Condition - Completed Deliveries Remain in Active List
 * For any delivery where status is "Completed" or "Cancelled", it SHALL NOT appear 
 * in the DeliveryRequests page (active deliveries list). Only deliveries with status 
 * "Pending", "Accepted", or "Out for Delivery" SHALL appear in the active list.
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * This test encodes the EXPECTED behavior after the fix.
 * On UNFIXED code, this test will FAIL (confirming the bug exists).
 * On FIXED code, this test will PASS (confirming the fix works).
 */

describe('Delivery Boy Completed Deliveries Bugfix - Property Tests', () => {
  let deliveryBoyUser;
  let deliveryBoyToken;
  let buyerUser;
  let testDeliveries;

  beforeAll(async () => {
    // Ensure database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dairy-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  }, 30000);

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Delivery.deleteMany({});

    // Create delivery boy user
    deliveryBoyUser = await User.create({
      username: 'deliveryboy_test',
      email: 'deliveryboy@test.com',
      mobile: '9876543210',
      password: 'hashedpassword',
      role: 'employee',
      employeeRole: 'delivery_boy',
      approved: true,
      isVerified: true,
      isActive: true,
      uniqueId: 'E000001'
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
      uniqueId: 'B000001'
    });

    // Generate token
    deliveryBoyToken = jwt.sign(
      { id: deliveryBoyUser._id, role: deliveryBoyUser.role, employeeRole: deliveryBoyUser.employeeRole },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test deliveries with ALL statuses to test the bug condition
    testDeliveries = await Delivery.insertMany([
      // Active deliveries (SHOULD appear in DeliveryRequests page)
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 10,
        rate: 50,
        totalAmount: 500,
        address: 'Test Address 1',
        deliveryDate: new Date(),
        status: 'Pending',
        paymentMethod: 'cod',
        paymentCompleted: false
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 5,
        rate: 60,
        totalAmount: 300,
        address: 'Test Address 2',
        deliveryDate: new Date(),
        status: 'Accepted',
        paymentMethod: 'upi',
        paymentCompleted: false,
        handledBy: deliveryBoyUser._id,
        acceptedAt: new Date()
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 8,
        rate: 50,
        totalAmount: 400,
        address: 'Test Address 3',
        deliveryDate: new Date(),
        status: 'Out for Delivery',
        paymentMethod: 'cod',
        paymentCompleted: false,
        handledBy: deliveryBoyUser._id,
        acceptedAt: new Date(),
        outForDeliveryAt: new Date()
      },
      // Completed/Cancelled deliveries (SHOULD NOT appear in DeliveryRequests page)
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 12,
        rate: 50,
        totalAmount: 600,
        address: 'Test Address 4',
        deliveryDate: new Date(Date.now() - 86400000), // Yesterday
        status: 'Completed',
        paymentMethod: 'upi',
        paymentCompleted: true,
        paymentDate: new Date(Date.now() - 86400000),
        handledBy: deliveryBoyUser._id,
        acceptedAt: new Date(Date.now() - 86400000),
        outForDeliveryAt: new Date(Date.now() - 86400000),
        completedAt: new Date(Date.now() - 86400000),
        otpVerified: true,
        otpVerifiedAt: new Date(Date.now() - 86400000)
      },
      {
        buyer: buyerUser._id,
        milkType: 'buffalo',
        quantity: 7,
        rate: 60,
        totalAmount: 420,
        address: 'Test Address 5',
        deliveryDate: new Date(Date.now() - 172800000), // 2 days ago
        status: 'Cancelled',
        paymentMethod: 'cod',
        paymentCompleted: false,
        notes: 'Buyer cancelled the order',
        rejectionReason: 'Customer request'
      },
      {
        buyer: buyerUser._id,
        milkType: 'cow',
        quantity: 15,
        rate: 50,
        totalAmount: 750,
        address: 'Test Address 6',
        deliveryDate: new Date(Date.now() - 259200000), // 3 days ago
        status: 'Completed',
        paymentMethod: 'cod',
        paymentCompleted: true,
        paymentDate: new Date(Date.now() - 259200000),
        handledBy: deliveryBoyUser._id,
        acceptedAt: new Date(Date.now() - 259200000),
        outForDeliveryAt: new Date(Date.now() - 259200000),
        completedAt: new Date(Date.now() - 259200000),
        otpVerified: true,
        otpVerifiedAt: new Date(Date.now() - 259200000)
      }
    ]);
  }, 30000);

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Delivery.deleteMany({});
  }, 30000);

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  }, 30000);

  /**
   * Property 1: Fault Condition - Completed Deliveries Remain in Active List
   * 
   * **Validates: Requirements 1.1, 1.2, 2.1, 2.2**
   * 
   * This test encodes the EXPECTED behavior after the fix.
   * On UNFIXED code, this test MUST FAIL (confirming the bug exists).
   * On FIXED code, this test MUST PASS (confirming the fix works).
   * 
   * Expected Behavior:
   * - DeliveryRequests page displays ONLY active deliveries (Pending, Accepted, Out for Delivery)
   * - Completed and Cancelled deliveries SHALL NOT appear in the active list
   */
  it('Property 1: DeliveryRequests page displays only active deliveries and excludes completed/cancelled deliveries', async () => {
    // WHEN a delivery boy accesses the delivery requests endpoint
    const response = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    // THEN the system SHALL return 200 OK
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // AND the system SHALL return delivery data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.requests).toBeDefined();
    expect(Array.isArray(response.body.data.requests)).toBe(true);

    const deliveries = response.body.data.requests;

    // Count deliveries by status
    const pendingDeliveries = deliveries.filter(d => d.status === 'Pending');
    const acceptedDeliveries = deliveries.filter(d => d.status === 'Accepted');
    const outForDeliveryDeliveries = deliveries.filter(d => d.status === 'Out for Delivery');
    const completedDeliveries = deliveries.filter(d => d.status === 'Completed');
    const cancelledDeliveries = deliveries.filter(d => d.status === 'Cancelled');

    // CRITICAL ASSERTIONS - These define the expected behavior
    
    // For any delivery where status is "Pending", it SHALL appear in DeliveryRequests page
    expect(pendingDeliveries.length).toBe(1);
    console.log(`✓ Found ${pendingDeliveries.length} Pending delivery (expected: 1)`);

    // For any delivery where status is "Accepted", it SHALL appear in DeliveryRequests page
    expect(acceptedDeliveries.length).toBe(1);
    console.log(`✓ Found ${acceptedDeliveries.length} Accepted delivery (expected: 1)`);

    // For any delivery where status is "Out for Delivery", it SHALL appear in DeliveryRequests page
    expect(outForDeliveryDeliveries.length).toBe(1);
    console.log(`✓ Found ${outForDeliveryDeliveries.length} Out for Delivery delivery (expected: 1)`);

    // For any delivery where status is "Completed", it SHALL NOT appear in DeliveryRequests page
    expect(completedDeliveries.length).toBe(0);
    if (completedDeliveries.length > 0) {
      console.error(`✗ BUG DETECTED: Found ${completedDeliveries.length} Completed deliveries in active list (expected: 0)`);
      console.error('Completed deliveries that should NOT be visible:', completedDeliveries.map(d => ({
        id: d._id,
        status: d.status,
        completedAt: d.completedAt,
        totalAmount: d.totalAmount
      })));
    } else {
      console.log(`✓ Found ${completedDeliveries.length} Completed deliveries (expected: 0)`);
    }

    // For any delivery where status is "Cancelled", it SHALL NOT appear in DeliveryRequests page
    expect(cancelledDeliveries.length).toBe(0);
    if (cancelledDeliveries.length > 0) {
      console.error(`✗ BUG DETECTED: Found ${cancelledDeliveries.length} Cancelled deliveries in active list (expected: 0)`);
      console.error('Cancelled deliveries that should NOT be visible:', cancelledDeliveries.map(d => ({
        id: d._id,
        status: d.status,
        rejectionReason: d.rejectionReason,
        totalAmount: d.totalAmount
      })));
    } else {
      console.log(`✓ Found ${cancelledDeliveries.length} Cancelled deliveries (expected: 0)`);
    }

    // Total active deliveries should be exactly 3 (Pending + Accepted + Out for Delivery)
    const activeDeliveries = deliveries.filter(d => 
      ['Pending', 'Accepted', 'Out for Delivery'].includes(d.status)
    );
    expect(activeDeliveries.length).toBe(3);
    console.log(`✓ Total active deliveries: ${activeDeliveries.length} (expected: 3)`);

    // Total deliveries returned should be exactly 3 (no completed/cancelled)
    expect(deliveries.length).toBe(3);
    console.log(`✓ Total deliveries in response: ${deliveries.length} (expected: 3)`);

    // Verify that all returned deliveries have active statuses only
    deliveries.forEach(delivery => {
      expect(['Pending', 'Accepted', 'Out for Delivery']).toContain(delivery.status);
    });
    console.log('✓ All returned deliveries have active statuses only');

    // Document the bug condition for counterexample analysis
    if (completedDeliveries.length > 0 || cancelledDeliveries.length > 0) {
      console.error('\n=== BUG CONDITION DETECTED ===');
      console.error('Completed/Cancelled deliveries are appearing in the active DeliveryRequests list.');
      console.error('This confirms the bug exists in the unfixed code.');
      console.error(`Total completed deliveries visible: ${completedDeliveries.length}`);
      console.error(`Total cancelled deliveries visible: ${cancelledDeliveries.length}`);
      console.error('Expected: 0 completed and 0 cancelled deliveries in active list');
      console.error('Actual: Completed and cancelled deliveries are mixed with active deliveries');
      console.error('================================\n');
    }
  }, 30000);

  /**
   * Property 1: Fault Condition - Verify Active Statuses Are Included
   * 
   * **Validates: Requirements 2.2**
   * 
   * This test verifies that active deliveries (Pending, Accepted, Out for Delivery)
   * ARE correctly included in the DeliveryRequests page.
   */
  it('Property 1: DeliveryRequests page includes all active delivery statuses', async () => {
    // WHEN a delivery boy accesses the delivery requests endpoint
    const response = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    // THEN the system SHALL return 200 OK
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const deliveries = response.body.data.requests;

    // Verify each active status is represented
    const statuses = deliveries.map(d => d.status);
    
    // SHALL include Pending deliveries
    expect(statuses).toContain('Pending');
    console.log('✓ Pending deliveries are included');

    // SHALL include Accepted deliveries
    expect(statuses).toContain('Accepted');
    console.log('✓ Accepted deliveries are included');

    // SHALL include Out for Delivery deliveries
    expect(statuses).toContain('Out for Delivery');
    console.log('✓ Out for Delivery deliveries are included');

    // SHALL NOT include Completed deliveries
    expect(statuses).not.toContain('Completed');
    if (statuses.includes('Completed')) {
      console.error('✗ BUG: Completed status found in active list');
    } else {
      console.log('✓ Completed deliveries are excluded');
    }

    // SHALL NOT include Cancelled deliveries
    expect(statuses).not.toContain('Cancelled');
    if (statuses.includes('Cancelled')) {
      console.error('✗ BUG: Cancelled status found in active list');
    } else {
      console.log('✓ Cancelled deliveries are excluded');
    }
  }, 30000);

  /**
   * Property 1: Fault Condition - Summary Calculations Exclude Completed/Cancelled
   * 
   * **Validates: Requirements 2.2**
   * 
   * This test verifies that summary statistics only reflect active deliveries,
   * not completed or cancelled ones.
   */
  it('Property 1: Summary statistics reflect only active deliveries', async () => {
    // WHEN a delivery boy accesses the delivery requests endpoint
    const response = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    // THEN the system SHALL return 200 OK
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const { requests, summary } = response.body.data;

    // Calculate expected values from active deliveries only
    const activeDeliveries = requests.filter(d => 
      ['Pending', 'Accepted', 'Out for Delivery'].includes(d.status)
    );

    // Summary should reflect only active deliveries
    const pendingCount = summary.find(s => s._id === 'Pending')?.count || 0;
    const acceptedCount = summary.find(s => s._id === 'Accepted')?.count || 0;
    const outForDeliveryCount = summary.find(s => s._id === 'Out for Delivery')?.count || 0;
    const completedCount = summary.find(s => s._id === 'Completed')?.count || 0;
    const cancelledCount = summary.find(s => s._id === 'Cancelled')?.count || 0;

    // Verify active status counts
    expect(pendingCount).toBe(1);
    expect(acceptedCount).toBe(1);
    expect(outForDeliveryCount).toBe(1);

    // Verify completed/cancelled are not in summary (or have 0 count)
    expect(completedCount).toBe(0);
    expect(cancelledCount).toBe(0);

    console.log('Summary breakdown:');
    console.log(`  Pending: ${pendingCount} (expected: 1)`);
    console.log(`  Accepted: ${acceptedCount} (expected: 1)`);
    console.log(`  Out for Delivery: ${outForDeliveryCount} (expected: 1)`);
    console.log(`  Completed: ${completedCount} (expected: 0)`);
    console.log(`  Cancelled: ${cancelledCount} (expected: 0)`);

    if (completedCount > 0 || cancelledCount > 0) {
      console.error('✗ BUG: Summary includes completed/cancelled deliveries');
    } else {
      console.log('✓ Summary correctly excludes completed/cancelled deliveries');
    }
  }, 30000);
});
