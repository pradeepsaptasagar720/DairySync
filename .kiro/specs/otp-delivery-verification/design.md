# Design Document: OTP-Based Delivery Verification System

## Overview

This design document describes the implementation of an enhanced delivery workflow system with OTP-based verification for secure delivery completion. The system transforms the current simple accept/cancel workflow into a comprehensive multi-step process similar to real-world delivery applications (Swiggy, Zomato, Amazon).

The system introduces:
- **Multi-step delivery workflow**: Approved → Accepted → Out for Delivery → Completed
- **OTP generation and verification**: Secure 6-digit OTP sent to buyers when delivery goes out
- **Real-time notifications**: Status updates pushed to buyers instantly
- **Post-delivery ratings**: Buyers can rate delivery experience
- **Comprehensive audit logging**: All OTP operations tracked for security

The design integrates with the existing delivery system, extending the current `Delivery` model and `delivery.controller.js` with new OTP-specific functionality while maintaining backward compatibility.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Delivery Boy UI          │         Buyer UI                    │
│  - Order List             │  - Order Tracking                   │
│  - Status Buttons         │  - OTP Display                      │
│  - OTP Entry Modal        │  - Status Timeline                  │
│  - Resend OTP             │  - Rating Modal                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  Delivery Controller      │    OTP Controller                   │
│  - updateDeliveryStatus   │    - generateOTP                    │
│  - getDeliveryRequests    │    - verifyOTP                      │
│                           │    - resendOTP                      │
│                           │                                     │
│  Rating Controller        │                                     │
│  - submitRating           │                                     │
│  - getRatings             │                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  OTP Service              │    SMS Service                      │
│  - generate()             │    - sendOTP()                      │
│  - verify()               │    - sendStatusUpdate()             │
│  - invalidate()           │                                     │
│                           │                                     │
│  Notification Service     │    Audit Service                    │
│  - notifyStatusChange()   │    - logOTPOperation()              │
│  - sendRealTimeUpdate()   │    - logVerificationAttempt()       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│  Delivery Model           │    OTP Model                        │
│  Rating Model             │    OTPLog Model                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                              │
├─────────────────────────────────────────────────────────────────┤
│  Twilio SMS API           │    Socket.IO (Real-time)            │
└─────────────────────────────────────────────────────────────────┘
```

### Workflow State Machine

```
┌─────────┐
│ Pending │ (Admin assigns to delivery boy)
└────┬────┘
     │
     ▼
┌──────────┐
│ Approved │ (Delivery boy sees order)
└────┬─────┘
     │ Accept Order
     ▼
┌──────────┐
│ Accepted │ (Delivery boy accepted)
└────┬─────┘
     │ Out for Delivery
     ▼
┌──────────────────┐
│ Out for Delivery │ ──► [OTP Generated & Sent to Buyer]
└────┬─────────────┘
     │ Complete Delivery (requires OTP)
     ▼
┌───────────┐
│ Completed │ ──► [Rating enabled for buyer]
└───────────┘
```

### OTP Verification Flow

```
Delivery Boy                    System                      Buyer
     │                            │                           │
     │ Click "Out for Delivery"   │                           │
     ├───────────────────────────►│                           │
     │                            │ Generate 6-digit OTP      │
     │                            │ Store in DB               │
     │                            │ Set 10-min expiry         │
     │                            ├──────────────────────────►│
     │                            │   Send SMS with OTP       │
     │                            │   Send push notification  │
     │                            │                           │
     │ Arrive at location         │                           │
     │ Click "Complete Delivery"  │                           │
     ├───────────────────────────►│                           │
     │                            │ Show OTP entry modal      │
     │◄───────────────────────────┤                           │
     │                            │                           │
     │ Ask buyer for OTP          │                           │
     ├────────────────────────────┼──────────────────────────►│
     │                            │                           │
     │◄───────────────────────────┼───────────────────────────┤
     │ Buyer provides OTP         │                           │
     │                            │                           │
     │ Enter OTP in modal         │                           │
     ├───────────────────────────►│                           │
     │                            │ Verify OTP                │
     │                            │ Check expiry              │
     │                            │ Update status             │
     │                            │                           │
     │◄───────────────────────────┤                           │
     │ Success message            │                           │
     │                            ├──────────────────────────►│
     │                            │ Notify completion         │
     │                            │ Enable rating             │
```

## Components and Interfaces

### 1. OTP Service

**Purpose**: Generate, validate, and manage OTP lifecycle

**Interface**:
```javascript
class OTPService {
  /**
   * Generate a new OTP for an order
   * @param {ObjectId} orderId - The order ID
   * @returns {Promise<{otp: string, expiresAt: Date}>}
   */
  async generateOTP(orderId)
  
  /**
   * Verify an OTP for an order
   * @param {ObjectId} orderId - The order ID
   * @param {string} otp - The OTP to verify
   * @returns {Promise<{valid: boolean, message: string}>}
   */
  async verifyOTP(orderId, otp)
  
  /**
   * Invalidate existing OTP and generate new one
   * @param {ObjectId} orderId - The order ID
   * @returns {Promise<{otp: string, expiresAt: Date}>}
   */
  async resendOTP(orderId)
  
  /**
   * Check if OTP has expired
   * @param {Date} expiresAt - Expiration timestamp
   * @returns {boolean}
   */
  isExpired(expiresAt)
  
  /**
   * Generate random 6-digit OTP
   * @returns {string}
   */
  generateRandomOTP()
}
```

**Implementation Details**:
- Use `crypto.randomInt(100000, 999999)` for secure random OTP generation
- Store OTP with bcrypt hash for security
- Implement rate limiting: max 3 resends per order
- Implement attempt limiting: max 5 verification attempts per OTP
- Auto-invalidate previous OTP when generating new one

### 2. SMS Service

**Purpose**: Send OTP and status updates via Twilio

**Interface**:
```javascript
class SMSService {
  /**
   * Send OTP to buyer's mobile
   * @param {string} mobile - Buyer's mobile number
   * @param {string} otp - The OTP to send
   * @param {string} orderId - Order reference
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendOTP(mobile, otp, orderId)
  
  /**
   * Send delivery status update
   * @param {string} mobile - Buyer's mobile number
   * @param {string} status - New status
   * @param {string} orderId - Order reference
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendStatusUpdate(mobile, status, orderId)
  
  /**
   * Format mobile number for Twilio (E.164 format)
   * @param {string} mobile - Raw mobile number
   * @returns {string}
   */
  formatMobileNumber(mobile)
}
```

**Implementation Details**:
- Use Twilio SDK for SMS delivery
- Store Twilio credentials in environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Format mobile numbers to E.164 format (+91XXXXXXXXXX for India)
- Implement retry logic: 3 attempts with exponential backoff
- Log all SMS operations to OTPLog table
- Handle Twilio errors gracefully with fallback messaging

**SMS Templates**:
```
OTP Message:
"Your OTP for milk delivery order #{orderId} is {otp}. Valid for 10 minutes. Do not share this OTP."

Status Update:
"Your milk order #{orderId} is now {status}. Track your order in the app."
```

### 3. OTP Controller

**Purpose**: Handle HTTP requests for OTP operations

**Endpoints**:

```javascript
// POST /api/otp/generate
// Generate OTP when order goes "Out for Delivery"
async generateOTP(req, res) {
  // Input: { orderId }
  // Output: { success, data: { otpGenerated, expiresAt, smsSent }, message }
}

// POST /api/otp/verify
// Verify OTP entered by delivery boy
async verifyOTP(req, res) {
  // Input: { orderId, otp }
  // Output: { success, data: { verified, orderStatus }, message }
}

// POST /api/otp/resend
// Resend OTP to buyer
async resendOTP(req, res) {
  // Input: { orderId }
  // Output: { success, data: { otpGenerated, expiresAt, smsSent, resendCount }, message }
}

// GET /api/otp/status/:orderId
// Get OTP status for an order
async getOTPStatus(req, res) {
  // Output: { success, data: { hasOTP, expired, verified, expiresAt, attemptsRemaining }, message }
}
```

**Validation Rules**:
- All endpoints require authentication
- `generateOTP`: Only callable when order status is "Accepted" (transitioning to "Out for Delivery")
- `verifyOTP`: Only callable when order status is "Out for Delivery"
- `resendOTP`: Max 3 resends per order, 30-second cooldown between resends
- OTP must be exactly 6 digits numeric

### 4. Rating Controller

**Purpose**: Handle delivery rating submissions and retrieval

**Endpoints**:

```javascript
// POST /api/ratings/submit
// Submit rating for completed delivery
async submitRating(req, res) {
  // Input: { orderId, rating, comment }
  // Output: { success, data: { ratingId, averageRating }, message }
}

// GET /api/ratings/delivery-boy/:deliveryBoyId
// Get ratings for a delivery boy
async getDeliveryBoyRatings(req, res) {
  // Output: { success, data: { averageRating, totalRatings, ratings }, message }
}

// GET /api/ratings/order/:orderId
// Get rating for a specific order
async getOrderRating(req, res) {
  // Output: { success, data: { rating, comment, createdAt }, message }
}
```

**Validation Rules**:
- Rating must be between 1-5 stars
- Comment max length: 500 characters
- Only buyer who placed the order can rate
- Only one rating per order
- Order must be in "Completed" status

### 5. Enhanced Delivery Controller

**Purpose**: Extend existing delivery controller with OTP integration

**Modified Endpoints**:

```javascript
// POST /api/delivery/update-status
// Enhanced to trigger OTP generation on "Out for Delivery"
async updateDeliveryStatus(req, res) {
  // When status changes to "Out for Delivery":
  //   1. Generate OTP
  //   2. Send SMS to buyer
  //   3. Log operation
  //   4. Send real-time notification
  
  // When status changes to "Completed":
  //   1. Verify OTP was validated
  //   2. Update completion timestamp
  //   3. Enable rating
  //   4. Send completion notification
}
```

### 6. Audit Service

**Purpose**: Log all OTP operations for security and debugging

**Interface**:
```javascript
class AuditService {
  /**
   * Log OTP operation
   * @param {ObjectId} orderId
   * @param {string} action - 'generate', 'verify', 'resend', 'expire'
   * @param {string} status - 'success', 'failure'
   * @param {Object} details - Additional context
   */
  async logOTPOperation(orderId, action, status, details)
  
  /**
   * Get audit logs for an order
   * @param {ObjectId} orderId
   * @returns {Promise<Array>}
   */
  async getOrderLogs(orderId)
  
  /**
   * Detect suspicious patterns
   * @param {ObjectId} orderId
   * @returns {Promise<{suspicious: boolean, reason: string}>}
   */
  async detectSuspiciousActivity(orderId)
}
```

**Suspicious Activity Patterns**:
- More than 5 failed verification attempts
- More than 3 resend requests
- Multiple rapid verification attempts (< 5 seconds apart)
- OTP verification from different IP addresses

## Data Models

### OTP Model

```javascript
const otpSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    unique: true,
    index: true
  },
  
  otpHash: {
    type: String,
    required: true
    // Stored as bcrypt hash for security
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
    // 10 minutes from generation
  },
  
  verified: {
    type: Boolean,
    default: false
  },
  
  verifiedAt: {
    type: Date,
    default: null
  },
  
  verificationAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  
  resendCount: {
    type: Number,
    default: 0,
    max: 3
  },
  
  lastResendAt: {
    type: Date,
    default: null
  },
  
  smsStatus: {
    sent: { type: Boolean, default: false },
    messageId: { type: String },
    sentAt: { type: Date },
    error: { type: String }
  },
  
  locked: {
    type: Boolean,
    default: false
    // Locked after max attempts exceeded
  }
}, {
  timestamps: true
});

// TTL index to auto-delete expired OTPs after 30 days
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
```

### OTPLog Model

```javascript
const otpLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    index: true
  },
  
  action: {
    type: String,
    enum: ['generate', 'verify_success', 'verify_failure', 'resend', 'expire', 'lock'],
    required: true
  },
  
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  },
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    // Flexible field for additional context:
    // - enteredOTP (for verification attempts)
    // - errorMessage
    // - ipAddress
    // - userAgent
    // - resendReason
  },
  
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Delivery boy who performed the action
  },
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// TTL index to auto-delete logs after 90 days
otpLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
```

### Rating Model

```javascript
const ratingSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: true,
    unique: true,
    index: true
  },
  
  deliveryBoyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  comment: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient delivery boy rating queries
ratingSchema.index({ deliveryBoyId: 1, createdAt: -1 });
```

### Enhanced Delivery Model

```javascript
// Add these fields to existing Delivery model:

{
  // ... existing fields ...
  
  // OTP-related fields
  otpRequired: {
    type: Boolean,
    default: true
    // Can be disabled for testing or special cases
  },
  
  otpVerified: {
    type: Boolean,
    default: false
  },
  
  otpVerifiedAt: {
    type: Date,
    default: null
  },
  
  // Rating fields
  rated: {
    type: Boolean,
    default: false
  },
  
  ratingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rating',
    default: null
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Workflow and State Management Properties

**Property 1: Status progression enforcement**
*For any* order, the system should only allow status transitions that follow the valid progression: Approved → Accepted → Out for Delivery → Completed, and reject any transitions that skip intermediate steps.
**Validates: Requirements 1.6, 1.7**

**Property 2: Accept order status transition**
*For any* order with status "Approved", when a delivery boy accepts the order, the status should change to "Accepted".
**Validates: Requirements 1.3**

**Property 3: Out for delivery status transition**
*For any* order with status "Accepted", when a delivery boy marks it as out for delivery, the status should change to "Out for Delivery".
**Validates: Requirements 1.4**

**Property 4: Assigned orders filtering**
*For any* delivery boy, when they view their assigned orders, the system should return only orders with status "Approved" that are assigned to them.
**Validates: Requirements 1.2**

### OTP Generation Properties

**Property 5: OTP generation on status change**
*For any* order transitioning to "Out for Delivery" status, the system should generate a unique 6-digit numeric OTP.
**Validates: Requirements 2.1**

**Property 6: OTP expiration time**
*For any* generated OTP, the expiration time should be exactly 10 minutes from the creation timestamp.
**Validates: Requirements 2.2**

**Property 7: OTP data persistence**
*For any* generated OTP, the database record should contain orderId, otpHash, expiresAt, verified status, and all required fields.
**Validates: Requirements 2.3**

**Property 8: OTP uniqueness**
*For any* set of generated OTPs, no two OTPs should have the same value for different orders within the same time window.
**Validates: Requirements 2.5**

**Property 9: SMS delivery on OTP generation**
*For any* generated OTP, the SMS service should be called with the buyer's mobile number and the OTP value.
**Validates: Requirements 2.4, 4.3**

### OTP Verification Properties

**Property 10: Valid OTP verification**
*For any* order with a valid, non-expired OTP, when the correct OTP is entered, the system should mark it as verified and change the order status to "Completed".
**Validates: Requirements 3.2**

**Property 11: Invalid OTP rejection**
*For any* order, when an incorrect OTP is entered, the system should reject it, display an error message, and increment the verification attempt counter.
**Validates: Requirements 3.3**

**Property 12: Expired OTP rejection**
*For any* order with an expired OTP, when the OTP is entered, the system should reject it with an expiration error message regardless of whether the OTP value is correct.
**Validates: Requirements 3.4 (edge case)**

**Property 13: Verification attempt limiting**
*For any* order, the system should allow a maximum of 5 verification attempts, and lock the OTP after the 5th failed attempt.
**Validates: Requirements 3.6, 3.7**

### OTP Resend Properties

**Property 14: Previous OTP invalidation on resend**
*For any* order, when a new OTP is requested via resend, the previous OTP should be invalidated and no longer verify successfully.
**Validates: Requirements 4.1**

**Property 15: New OTP generation on resend**
*For any* order, when resend is requested, a new 6-digit OTP should be generated with a new 10-minute expiration time.
**Validates: Requirements 4.2**

**Property 16: Resend attempt limiting**
*For any* order, the system should allow a maximum of 3 resend requests, and reject further resend attempts with an error.
**Validates: Requirements 4.4, 4.5**

**Property 17: Resend cooldown enforcement**
*For any* order, when a resend is requested within 30 seconds of the previous resend, the system should reject the request.
**Validates: Requirements 4.6**

### Notification Properties

**Property 18: Status change notifications**
*For any* order status change to "Accepted", "Out for Delivery", or "Completed", the notification service should send a real-time notification to the buyer.
**Validates: Requirements 5.1, 5.2, 5.3**

**Property 19: Real-time UI updates**
*For any* order status change, the buyer's UI should receive a real-time update without requiring a page refresh.
**Validates: Requirements 5.5**

**Property 20: Order status display**
*For any* order, when a buyer views order details, the response should include the current status and timestamp.
**Validates: Requirements 5.4**

### UI Interaction Properties

**Property 21: OTP entry button enablement**
*For any* OTP entry modal, the "Verify OTP" button should be enabled only when exactly 6 digits have been entered.
**Validates: Requirements 6.4**

**Property 22: Successful verification UI flow**
*For any* successful OTP verification, the system should display a success message and close the OTP entry modal.
**Validates: Requirements 6.6**

**Property 23: Failed verification UI flow**
*For any* failed OTP verification, the system should display an error message and keep the OTP entry modal open for retry.
**Validates: Requirements 6.7**

**Property 24: OTP expiration UI update**
*For any* expired OTP, the buyer's UI should update to indicate expiration and show a message about requesting a new OTP.
**Validates: Requirements 7.5**

### Rating System Properties

**Property 25: Rating enablement on completion**
*For any* order with status "Completed", the rating option should be enabled for the buyer.
**Validates: Requirements 8.1**

**Property 26: Rating data persistence**
*For any* submitted rating, the database should store orderId, deliveryBoyId, buyerId, rating value, comment, and timestamp.
**Validates: Requirements 8.4**

**Property 27: One rating per order**
*For any* order, the system should allow only one rating submission, and reject subsequent rating attempts for the same order.
**Validates: Requirements 8.5**

**Property 28: Average rating calculation**
*For any* delivery boy, the calculated average rating should equal the sum of all their ratings divided by the total number of ratings.
**Validates: Requirements 8.7**

### Audit Logging Properties

**Property 29: OTP operation logging**
*For any* OTP operation (generate, verify, resend), the system should create an audit log entry with orderId, action, status, and timestamp.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

**Property 30: Log retention**
*For any* OTP log entry, it should remain in the database for at least 90 days from creation.
**Validates: Requirements 9.5**

**Property 31: Audit log filtering**
*For any* audit log query with filters (date, order, delivery boy), the results should include only logs matching all specified filters.
**Validates: Requirements 9.6**

**Property 32: Suspicious activity detection**
*For any* order with more than 5 failed verification attempts or more than 3 resend requests, the system should flag it as suspicious and alert admins.
**Validates: Requirements 9.7**

### Error Handling Properties

**Property 33: SMS failure fallback**
*For any* OTP generation where SMS service fails, the system should log the error and provide a fallback option to display OTP in the delivery boy's app.
**Validates: Requirements 10.1, 10.2**

**Property 34: Database operation retry**
*For any* database operation failure during OTP generation, the system should retry up to 3 times before returning an error.
**Validates: Requirements 10.3**

**Property 35: Network failure queuing**
*For any* OTP verification request that fails due to network connectivity, the system should queue the request and retry when connection is restored.
**Validates: Requirements 10.4**

**Property 36: User-friendly error messages**
*For any* error, the displayed error message should not contain technical details like stack traces or database errors.
**Validates: Requirements 10.6**

**Property 37: Critical error admin notifications**
*For any* critical failure (SMS service down, database unavailable, max attempts exceeded), the system should send a notification to admins.
**Validates: Requirements 10.7**

### API Contract Properties

**Property 38: OTP generation API contract**
*For any* valid POST request to `/api/otp/generate` with orderId, the response should include success status, OTP generation confirmation, expiration time, and SMS status.
**Validates: Requirements 11.1**

**Property 39: OTP verification API contract**
*For any* valid POST request to `/api/otp/verify` with orderId and otp, the response should include verification result and updated order status.
**Validates: Requirements 11.2**

**Property 40: OTP resend API contract**
*For any* valid POST request to `/api/otp/resend` with orderId, the response should include new OTP generation confirmation, expiration time, and resend count.
**Validates: Requirements 11.3**

**Property 41: Rating submission API contract**
*For any* valid POST request to `/api/ratings/submit` with orderId, rating, and optional comment, the response should include the created rating ID and updated average rating.
**Validates: Requirements 11.6**

**Property 42: API authentication enforcement**
*For any* API endpoint request without valid authentication, the system should return a 401 Unauthorized response.
**Validates: Requirements 11.8**

### Database Schema Properties

**Property 43: OTP schema validation**
*For any* OTP record in the database, it should have all required fields: orderId, otpHash, expiresAt, verified, verificationAttempts, resendCount, and timestamps.
**Validates: Requirements 12.1**

**Property 44: Rating schema validation**
*For any* Rating record in the database, it should have all required fields: orderId, deliveryBoyId, buyerId, rating (1-5), comment (max 500 chars), and createdAt.
**Validates: Requirements 12.3**

**Property 45: OTP uniqueness constraint**
*For any* order, there should be at most one active OTP record in the database at any given time.
**Validates: Requirements 12.4**

**Property 46: Expired OTP cleanup**
*For any* OTP record older than 30 days, it should be automatically deleted from the database.
**Validates: Requirements 12.6**

## Error Handling

### OTP Generation Errors

**SMS Service Unavailable**:
- Log error with full context (orderId, timestamp, error message)
- Display fallback message to delivery boy: "SMS service temporarily unavailable. OTP: {otp}. Please communicate this to the buyer."
- Store OTP in database as usual
- Set `smsStatus.sent = false` and `smsStatus.error = error message`
- Send admin notification for SMS service monitoring

**Database Write Failure**:
- Retry up to 3 times with exponential backoff (1s, 2s, 4s)
- If all retries fail, return error to user: "Unable to generate OTP. Please try again."
- Log error for admin review
- Do not change order status

**OTP Generation Collision** (extremely rare):
- Regenerate OTP automatically
- Log collision event for monitoring
- Continue normal flow

### OTP Verification Errors

**Expired OTP**:
- Return error: "OTP has expired. Please request a new one."
- Do not increment verification attempts
- Log expiration event

**Invalid OTP**:
- Return error: "Invalid OTP. Please try again."
- Increment verification attempts
- Log failed attempt with entered OTP (hashed)
- If attempts >= 5, lock OTP and notify admin

**Network Timeout**:
- Queue verification request locally
- Display message: "Verifying OTP... Please wait."
- Retry when connection restored
- If offline for > 5 minutes, display: "Unable to verify OTP. Please check your connection."

**Database Read Failure**:
- Retry up to 3 times
- If all retries fail, return error: "Unable to verify OTP. Please try again."
- Log error for admin review

### Resend Errors

**Cooldown Period Active**:
- Return error: "Please wait {seconds} seconds before requesting a new OTP."
- Display countdown timer in UI

**Max Resends Exceeded**:
- Return error: "Maximum resend attempts exceeded. Please contact support."
- Lock resend functionality
- Notify admin for manual intervention

**SMS Service Failure on Resend**:
- Same fallback as OTP generation
- Display OTP directly to delivery boy
- Log failure

### Rating Submission Errors

**Duplicate Rating**:
- Return error: "You have already rated this delivery."
- Display existing rating to user

**Invalid Rating Value**:
- Return error: "Rating must be between 1 and 5 stars."
- Validate on frontend and backend

**Order Not Completed**:
- Return error: "You can only rate completed deliveries."
- Hide rating option until order is completed

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific OTP values and verification scenarios
- Error handling for specific failure modes
- API endpoint response formats
- Database schema validation

**Property-Based Tests**: Verify universal properties across all inputs
- OTP generation randomness and uniqueness
- State transition enforcement across all possible transitions
- Rate limiting across various attempt patterns
- Audit logging completeness across all operations

### Property-Based Testing Configuration

**Testing Library**: Use `fast-check` for JavaScript/Node.js property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: otp-delivery-verification, Property {number}: {property_text}`
- Use custom generators for:
  - Random orders with various statuses
  - Random OTPs (6-digit numeric)
  - Random mobile numbers (E.164 format)
  - Random timestamps within valid ranges

**Example Property Test Structure**:
```javascript
// Feature: otp-delivery-verification, Property 5: OTP generation on status change
describe('Property 5: OTP generation on status change', () => {
  it('should generate unique 6-digit OTP for any order transitioning to Out for Delivery', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          orderId: fc.hexaString({ minLength: 24, maxLength: 24 }),
          buyerMobile: fc.string({ minLength: 10, maxLength: 10 }).map(s => '+91' + s)
        }),
        async ({ orderId, buyerMobile }) => {
          const result = await otpService.generateOTP(orderId);
          
          expect(result.otp).toMatch(/^\d{6}$/);
          expect(result.expiresAt).toBeInstanceOf(Date);
          
          const otpRecord = await OTP.findOne({ orderId });
          expect(otpRecord).toBeDefined();
          expect(otpRecord.otpHash).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**OTP Service Tests**:
- Generate OTP with valid order ID
- Generate OTP with invalid order ID (error case)
- Verify correct OTP (success case)
- Verify incorrect OTP (failure case)
- Verify expired OTP (edge case)
- Resend OTP invalidates previous OTP
- Max verification attempts locks OTP
- Max resend attempts blocks further resends
- Cooldown period enforcement

**SMS Service Tests**:
- Send OTP with valid mobile number
- Send OTP with invalid mobile number (error case)
- Handle Twilio API errors gracefully
- Retry logic on transient failures
- Format mobile numbers correctly (E.164)

**API Endpoint Tests**:
- POST /api/otp/generate returns 200 with valid input
- POST /api/otp/generate returns 400 with invalid input
- POST /api/otp/verify returns 200 with correct OTP
- POST /api/otp/verify returns 400 with incorrect OTP
- POST /api/otp/resend enforces cooldown
- POST /api/ratings/submit validates rating range
- All endpoints require authentication

**Database Tests**:
- OTP schema has all required fields
- Rating schema has all required fields
- OTP uniqueness constraint enforced
- TTL indexes work correctly
- Foreign key constraints enforced

### Integration Tests

**End-to-End Delivery Flow**:
1. Admin assigns order to delivery boy (status: Approved)
2. Delivery boy accepts order (status: Accepted)
3. Delivery boy marks out for delivery (status: Out for Delivery, OTP generated)
4. Verify SMS sent to buyer
5. Delivery boy enters correct OTP (status: Completed)
6. Buyer rates delivery
7. Verify rating stored and average calculated

**Error Recovery Flow**:
1. SMS service fails during OTP generation
2. Verify fallback OTP display to delivery boy
3. Verify order can still be completed
4. Verify admin notification sent

**Rate Limiting Flow**:
1. Make 5 failed verification attempts
2. Verify 6th attempt is blocked
3. Verify admin notification sent
4. Verify OTP is locked

### Mock Services

**SMS Service Mock**:
```javascript
class MockSMSService {
  constructor() {
    this.sentMessages = [];
    this.shouldFail = false;
  }
  
  async sendOTP(mobile, otp, orderId) {
    if (this.shouldFail) {
      throw new Error('SMS service unavailable');
    }
    
    this.sentMessages.push({ mobile, otp, orderId, timestamp: new Date() });
    return { success: true, messageId: 'mock-' + Date.now() };
  }
  
  reset() {
    this.sentMessages = [];
    this.shouldFail = false;
  }
}
```

**Notification Service Mock**:
```javascript
class MockNotificationService {
  constructor() {
    this.notifications = [];
  }
  
  async notifyStatusChange(buyerId, orderId, status) {
    this.notifications.push({ buyerId, orderId, status, timestamp: new Date() });
  }
  
  reset() {
    this.notifications = [];
  }
}
```

### Test Data Generators

**Random Order Generator**:
```javascript
const orderGenerator = fc.record({
  _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
  buyer: fc.hexaString({ minLength: 24, maxLength: 24 }),
  status: fc.constantFrom('Pending', 'Approved', 'Accepted', 'Out for Delivery', 'Completed'),
  quantity: fc.integer({ min: 1, max: 10 }),
  totalAmount: fc.integer({ min: 50, max: 500 })
});
```

**Random OTP Generator**:
```javascript
const otpGenerator = fc.integer({ min: 100000, max: 999999 }).map(n => n.toString());
```

**Random Mobile Generator**:
```javascript
const mobileGenerator = fc.integer({ min: 6000000000, max: 9999999999 })
  .map(n => '+91' + n.toString());
```

### Performance Testing

**OTP Generation Performance**:
- Target: < 100ms for OTP generation
- Target: < 500ms for SMS delivery
- Load test: 100 concurrent OTP generations

**OTP Verification Performance**:
- Target: < 50ms for verification
- Load test: 1000 concurrent verifications

**Database Query Performance**:
- Index on orderId: < 10ms lookup
- Index on expiresAt: < 50ms for cleanup queries
- Compound index on deliveryBoyId + createdAt: < 20ms for rating queries

### Security Testing

**OTP Security**:
- Verify OTPs are stored as bcrypt hashes
- Verify OTPs are not logged in plain text
- Verify OTPs are not exposed in API responses (except during generation)
- Verify rate limiting prevents brute force attacks

**API Security**:
- Verify all endpoints require authentication
- Verify role-based access control (delivery boy can't rate, buyer can't verify)
- Verify SQL injection prevention
- Verify XSS prevention in comment fields

### Monitoring and Alerting

**Metrics to Track**:
- OTP generation success rate
- SMS delivery success rate
- OTP verification success rate
- Average time to delivery completion
- Failed verification attempts per order
- Resend requests per order
- Rating submission rate

**Alerts to Configure**:
- SMS service failure rate > 5%
- OTP verification failure rate > 20%
- Locked OTPs (max attempts exceeded)
- Suspicious activity detected
- Database operation failures
