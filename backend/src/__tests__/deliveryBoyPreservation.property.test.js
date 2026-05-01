import request from 'supertest';
import app from '../app.js';
import User from '../models/User.model.js';
import Delivery from '../models/Delivery.model.js';
import OTP from '../models/OTP.model.js';
import ChatMessage from '../models/ChatMessage.model.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * Property-Based Test for Delivery Boy Preservation Requirements
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 * 
 * Property 2: Preservation - Delivery Workflow Functionality
 * For any delivery workflow action (accept, out for delivery, OTP completion, chat, GPS tracking)
 * that is NOT related to displaying the delivery list, the fixed code SHALL produce exactly the 
 * same behavior as the original code, preserving all existing functionality.
 * 
 * IMPORTANT: These tests run on UNFIXED code to observe baseline behavior.
 * They MUST PASS on unfixed code (confirming current behavior).
 * They MUST ALSO PASS on fixed code (confirming no regressions).
 */

describe('Delivery Boy Preservation - Property Tests', () => {
  let deliveryBoyUser;
  let deliveryBoyToken;
  let milkCollectorUser;
  let milkCollectorToken;
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
    await OTP.deleteMany({});
    await ChatMessage.deleteMany({});

    // Create delivery boy user
    deliveryBoyUser = await User.create({
      username: 'deliveryboy_preservation',
      email: 'deliveryboy_preservation@test.com',
      mobile: '9876543220',
      password: 'hashedpassword',
      role: 'employee',
      employeeRole: 'delivery_boy',
      approved: true,
      isVerified: true,
      isActive: true,
      uniqueId: 'E000002'
    });

    // Create milk collector user
    milkCollectorUser = await User.create({
      username: 'milkcollector_test',
      email: 'milkcollector@test.com',
      mobile: '9876543221',
      password: 'hashedpassword',
      role: 'employee',
      employeeRole: 'milk_collector',
      approved: true,
      isVerified: true,
      isActive: true,
      uniqueId: 'E000003'
    });

    // Create buyer user
    buyerUser = await User.create({
      username: 'buyer_preservation',
      email: 'buyer_preservation@test.com',
      mobile: '9876543222',
      password: 'hashedpassword',
      role: 'buyer',
      approved: true,
      isVerified: true,
      uniqueId: 'B000002'
    });

    // Generate tokens
    deliveryBoyToken = jwt.sign(
      { id: deliveryBoyUser._id, role: deliveryBoyUser.role, employeeRole: deliveryBoyUser.employeeRole },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    milkCollectorToken = jwt.sign(
      { id: milkCollectorUser._id, role: milkCollectorUser.role, employeeRole: milkCollectorUser.employeeRole },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test deliveries with various statuses
    testDeliveries = await Delivery.insertMany([
      // Pending delivery for acceptance test
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
      // Accepted delivery for out-for-delivery test
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
        deliveryPersonId: deliveryBoyUser._id,
        acceptedAt: new Date()
      },
      // Out for delivery for OTP test
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
        deliveryPersonId: deliveryBoyUser._id,
        acceptedAt: new Date(),
        outForDeliveryAt: new Date()
      }
    ]);
  }, 30000);

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Delivery.deleteMany({});
    await OTP.deleteMany({});
    await ChatMessage.deleteMany({});
  }, 30000);

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  }, 30000);

  /**
   * Property 2: Preservation - Accepting Pending Deliveries
   * 
   * **Validates: Requirement 3.1**
   * 
   * For any pending delivery, accepting it SHALL update status to "Accepted"
   * and show it in the active deliveries list. This behavior must remain unchanged.
   */
  it('Property 2: Accepting a pending delivery updates status to Accepted and preserves workflow', async () => {
    const pendingDelivery = testDeliveries[0];

    // WHEN a delivery boy accepts a pending delivery
    const response = await request(app)
      .put(`/api/delivery/requests/${pendingDelivery._id}`)
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        status: 'Accepted',
        notes: 'Accepted for delivery'
      });

    // THEN the system SHALL return 200 OK
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // AND the delivery status SHALL be updated to "Accepted"
    expect(response.body.data.status).toBe('Accepted');
    console.log('✓ Delivery status updated to Accepted');

    // AND the handledBy field SHALL be set to the delivery boy
    expect(response.body.data.handledBy._id).toBe(deliveryBoyUser._id.toString());
    console.log('✓ handledBy field set correctly');

    // AND the acceptedAt timestamp SHALL be set
    expect(response.body.data.acceptedAt).toBeDefined();
    console.log('✓ acceptedAt timestamp set');

    // AND the delivery SHALL appear in the active deliveries list
    const listResponse = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    expect(listResponse.status).toBe(200);
    const acceptedDelivery = listResponse.body.data.requests.find(
      d => d._id === pendingDelivery._id.toString()
    );
    expect(acceptedDelivery).toBeDefined();
    expect(acceptedDelivery.status).toBe('Accepted');
    console.log('✓ Accepted delivery appears in active list');

    console.log('✅ Preservation Test PASSED: Accepting pending deliveries works correctly');
  }, 30000);

  /**
   * Property 2: Preservation - Marking Delivery as Out for Delivery
   * 
   * **Validates: Requirement 3.2**
   * 
   * For any accepted delivery, marking it as "Out for Delivery" SHALL update the status
   * and maintain all existing functionality (OTP generation, GPS tracking, chat).
   */
  it('Property 2: Marking delivery as Out for Delivery preserves OTP, GPS, and chat functionality', async () => {
    const acceptedDelivery = testDeliveries[1];

    // WHEN a delivery boy marks delivery as "Out for Delivery"
    const response = await request(app)
      .put(`/api/delivery/requests/${acceptedDelivery._id}`)
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        status: 'Out for Delivery'
      });

    // THEN the system SHALL return 200 OK
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // AND the delivery status SHALL be updated to "Out for Delivery"
    expect(response.body.data.status).toBe('Out for Delivery');
    console.log('✓ Delivery status updated to Out for Delivery');

    // AND the outForDeliveryAt timestamp SHALL be set
    expect(response.body.data.outForDeliveryAt).toBeDefined();
    console.log('✓ outForDeliveryAt timestamp set');

    // AND OTP generation SHALL be available
    const otpResponse = await request(app)
      .post('/api/otp/generate')
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        orderId: acceptedDelivery._id.toString()
      });

    expect(otpResponse.status).toBe(200);
    expect(otpResponse.body.success).toBe(true);
    expect(otpResponse.body.data.otpGenerated).toBe(true);
    console.log('✓ OTP generation works for Out for Delivery status');

    // AND chat functionality SHALL be available
    const chatResponse = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        orderId: acceptedDelivery._id.toString(),
        message: 'On my way to deliver your order'
      });

    expect(chatResponse.status).toBe(201);
    expect(chatResponse.body.success).toBe(true);
    console.log('✓ Chat functionality works for Out for Delivery status');

    // AND GPS tracking SHALL be available (delivery remains in active list)
    const listResponse = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    const outForDeliveryOrder = listResponse.body.data.requests.find(
      d => d._id === acceptedDelivery._id.toString()
    );
    expect(outForDeliveryOrder).toBeDefined();
    expect(outForDeliveryOrder.status).toBe('Out for Delivery');
    console.log('✓ Out for Delivery order appears in active list for GPS tracking');

    console.log('✅ Preservation Test PASSED: Out for Delivery workflow preserved');
  }, 30000);

  /**
   * Property 2: Preservation - OTP Verification Completes Delivery
   * 
   * **Validates: Requirement 3.3**
   * 
   * For any delivery with status "Out for Delivery", OTP verification SHALL mark
   * the delivery as "Completed" and update all related records.
   */
  it('Property 2: OTP verification completes delivery and updates all related records', async () => {
    const outForDeliveryOrder = testDeliveries[2];

    // First, generate OTP
    const otpGenResponse = await request(app)
      .post('/api/otp/generate')
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        orderId: outForDeliveryOrder._id.toString()
      });

    expect(otpGenResponse.status).toBe(200);
    expect(otpGenResponse.body.data.otpGenerated).toBe(true);
    console.log('✓ OTP generated successfully');

    // Get the OTP from the API response (fallback OTP for testing)
    const generatedOTP = otpGenResponse.body.data.fallbackOTP;
    expect(generatedOTP).toBeDefined();
    console.log(`✓ Retrieved OTP from API response: ${generatedOTP}`);

    // WHEN a delivery boy verifies OTP
    const verifyResponse = await request(app)
      .post('/api/otp/verify')
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        orderId: outForDeliveryOrder._id.toString(),
        otp: generatedOTP
      });

    // THEN the system SHALL return 200 OK
    if (verifyResponse.status !== 200) {
      console.error('OTP verification failed:', verifyResponse.body);
    }
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.success).toBe(true);

    // AND the delivery status SHALL be "Completed"
    expect(verifyResponse.body.data.orderStatus).toBe('Completed');
    console.log('✓ Delivery marked as Completed');

    // AND the delivery record SHALL be updated with completion details
    const updatedDelivery = await Delivery.findById(outForDeliveryOrder._id);
    expect(updatedDelivery.status).toBe('Completed');
    expect(updatedDelivery.completedAt).toBeDefined();
    expect(updatedDelivery.otpVerified).toBe(true);
    expect(updatedDelivery.otpVerifiedAt).toBeDefined();
    console.log('✓ Delivery record updated with completion details');

    // AND for COD orders, payment SHALL be marked as completed
    if (updatedDelivery.paymentMethod === 'cod') {
      expect(updatedDelivery.paymentCompleted).toBe(true);
      expect(updatedDelivery.paymentDate).toBeDefined();
      console.log('✓ COD payment marked as completed');
    }

    console.log('✅ Preservation Test PASSED: OTP verification workflow preserved');
  }, 30000);

  /**
   * Property 2: Preservation - Delivery Boy Access Control
   * 
   * **Validates: Requirement 3.6**
   * 
   * The delivery routes SHALL remain restricted to delivery_boy role only.
   * Other employee roles (like milk_collector) SHALL NOT have access to delivery_boy endpoints.
   * This access control must remain unchanged.
   */
  it('Property 2: Delivery routes remain restricted to delivery_boy role only', async () => {
    // WHEN a milk collector tries to access the delivery requests endpoint
    const response = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${milkCollectorToken}`);

    // THEN the system SHALL return 403 Forbidden
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    console.log('✓ Milk collector correctly denied access to delivery_boy endpoints');

    // WHEN a delivery boy accesses the same endpoint
    const deliveryBoyResponse = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    // THEN the system SHALL return 200 OK
    expect(deliveryBoyResponse.status).toBe(200);
    expect(deliveryBoyResponse.body.success).toBe(true);
    console.log('✓ Delivery boy has correct access to delivery endpoints');

    console.log('✅ Preservation Test PASSED: Access control preserved');
  }, 30000);

  /**
   * Property 2: Preservation - Backend API Returns All Deliveries
   * 
   * **Validates: Requirement 3.5**
   * 
   * The backend API SHALL continue to return all deliveries with proper data structure
   * and filtering support. The API behavior must remain unchanged.
   */
  it('Property 2: Backend API returns all deliveries with proper filtering support', async () => {
    // WHEN requesting deliveries without status filter
    const allResponse = await request(app)
      .get('/api/delivery/requests')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    expect(allResponse.status).toBe(200);
    expect(allResponse.body.success).toBe(true);
    expect(allResponse.body.data.requests).toBeDefined();
    expect(Array.isArray(allResponse.body.data.requests)).toBe(true);
    console.log(`✓ API returns ${allResponse.body.data.requests.length} deliveries without filter`);

    // WHEN requesting deliveries with status filter
    const pendingResponse = await request(app)
      .get('/api/delivery/requests?status=Pending')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    expect(pendingResponse.status).toBe(200);
    expect(pendingResponse.body.success).toBe(true);
    const pendingDeliveries = pendingResponse.body.data.requests;
    expect(pendingDeliveries.every(d => d.status === 'Pending')).toBe(true);
    console.log(`✓ API correctly filters ${pendingDeliveries.length} Pending deliveries`);

    // WHEN requesting deliveries with pagination
    const paginatedResponse = await request(app)
      .get('/api/delivery/requests?page=1&limit=2')
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    expect(paginatedResponse.status).toBe(200);
    expect(paginatedResponse.body.data.pagination).toBeDefined();
    expect(paginatedResponse.body.data.pagination.page).toBe(1);
    expect(paginatedResponse.body.data.pagination.limit).toBe(2);
    console.log('✓ API supports pagination correctly');

    // AND summary statistics SHALL be provided
    expect(allResponse.body.data.summary).toBeDefined();
    expect(Array.isArray(allResponse.body.data.summary)).toBe(true);
    console.log('✓ API provides summary statistics');

    console.log('✅ Preservation Test PASSED: Backend API functionality preserved');
  }, 30000);

  /**
   * Property 2: Preservation - Chat Functionality for Active Deliveries
   * 
   * **Validates: Requirement 3.2**
   * 
   * For active deliveries (Accepted, Out for Delivery), chat functionality SHALL
   * continue to work without any changes.
   */
  it('Property 2: Chat functionality continues to work for active deliveries', async () => {
    const acceptedDelivery = testDeliveries[1];

    // WHEN a delivery boy sends a chat message
    const sendResponse = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        orderId: acceptedDelivery._id.toString(),
        message: 'Hello, I will deliver your order soon'
      });

    // THEN the system SHALL return 201 Created
    expect(sendResponse.status).toBe(201);
    expect(sendResponse.body.success).toBe(true);
    expect(sendResponse.body.data.message).toBe('Hello, I will deliver your order soon');
    console.log('✓ Chat message sent successfully');

    // AND the message SHALL be stored in the database
    const messages = await ChatMessage.find({ orderId: acceptedDelivery._id });
    expect(messages.length).toBe(1);
    expect(messages[0].message).toBe('Hello, I will deliver your order soon');
    console.log('✓ Chat message stored in database');

    // AND the delivery SHALL have updated chat activity
    const updatedDelivery = await Delivery.findById(acceptedDelivery._id);
    expect(updatedDelivery.lastChatActivity).toBeDefined();
    expect(updatedDelivery.unreadMessagesCount.buyer).toBe(1);
    console.log('✓ Delivery chat activity updated');

    // WHEN retrieving chat messages
    const getResponse = await request(app)
      .get(`/api/chat/messages/${acceptedDelivery._id}`)
      .set('Authorization', `Bearer ${deliveryBoyToken}`);

    // THEN the system SHALL return the messages
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.success).toBe(true);
    expect(getResponse.body.data.messages.length).toBe(1);
    console.log('✓ Chat messages retrieved successfully');

    console.log('✅ Preservation Test PASSED: Chat functionality preserved');
  }, 30000);

  /**
   * Property 2: Preservation - Status Transition Validation
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3**
   * 
   * The system SHALL continue to enforce valid status transitions and reject
   * invalid transitions. This validation logic must remain unchanged.
   */
  it('Property 2: Status transition validation continues to work correctly', async () => {
    const pendingDelivery = testDeliveries[0];

    // WHEN attempting an invalid status transition (Pending -> Completed)
    const invalidResponse = await request(app)
      .put(`/api/delivery/requests/${pendingDelivery._id}`)
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        status: 'Completed'
      });

    // THEN the system SHALL reject the transition
    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.success).toBe(false);
    expect(invalidResponse.body.error.code).toBe('INVALID_TRANSITION');
    console.log('✓ Invalid status transition rejected');

    // WHEN attempting a valid status transition (Pending -> Accepted)
    const validResponse = await request(app)
      .put(`/api/delivery/requests/${pendingDelivery._id}`)
      .set('Authorization', `Bearer ${deliveryBoyToken}`)
      .send({
        status: 'Accepted'
      });

    // THEN the system SHALL accept the transition
    expect(validResponse.status).toBe(200);
    expect(validResponse.body.success).toBe(true);
    expect(validResponse.body.data.status).toBe('Accepted');
    console.log('✓ Valid status transition accepted');

    console.log('✅ Preservation Test PASSED: Status transition validation preserved');
  }, 30000);
});
