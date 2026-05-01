# Design Document

## Overview

The Enhanced Order Placement System redesigns the milk ordering experience to match modern e-commerce standards. The system integrates live location services, structured address management, real payment processing, and comprehensive order management with realistic user flows and security considerations.

## Architecture

### Component Structure
```
OrderModal
├── OrderSteps
│   ├── ProductSelection (existing)
│   ├── EnhancedAddressStep (new)
│   ├── AdvancedPaymentStep (enhanced)
│   └── OrderConfirmationStep (enhanced)
├── LocationServices
│   ├── LiveLocationCapture
│   ├── AddressGeocoding
│   └── LocationPermissionHandler
├── PaymentIntegration
│   ├── UPIGateway
│   ├── QRCodeGenerator
│   ├── PaymentAppRedirector
│   └── PaymentVerification
└── OrderManagement
    ├── CancellationTimer
    ├── OrderTracking
    └── DeliveryInformation
```

### Data Flow
1. **Address Collection**: Live location → Geocoding → Address validation → Storage
2. **Payment Processing**: Method selection → Gateway integration → Verification → Confirmation
3. **Order Management**: Placement → Timer start → Tracking → Delivery coordination

## Components and Interfaces

### EnhancedAddressStep Component
```typescript
interface AddressData {
  type: 'live' | 'manual' | 'saved';
  coordinates?: { lat: number; lng: number };
  buildingNo: string;
  area: string; // Required field
  colony: string;
  fullAddress: string;
  addressType?: 'home' | 'workplace';
  landmark?: string;
}

interface LocationServices {
  getCurrentLocation(): Promise<Coordinates>;
  geocodeAddress(coords: Coordinates): Promise<string>;
  validateServiceArea(coords: Coordinates): boolean;
}
```

### AdvancedPaymentStep Component
```typescript
interface PaymentMethod {
  type: 'cod' | 'upi_id' | 'qr_code' | 'upi_app';
  upiId?: string;
  selectedApp?: 'phonepe' | 'gpay' | 'paytm';
  qrCodeData?: string;
}

interface PaymentGateway {
  generateQRCode(amount: number, orderId: string): string;
  redirectToApp(app: string, transactionData: TransactionData): void;
  verifyPayment(transactionId: string): Promise<PaymentStatus>;
}
```

### OrderManagement Component
```typescript
interface OrderData {
  orderId: string;
  deliveryDate: string;
  address: AddressData;
  paymentMethod: PaymentMethod;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'delivered';
  cancellationDeadline: Date;
}

interface CancellationTimer {
  startTimer(orderId: string): void;
  getRemainingTime(orderId: string): number;
  canCancel(orderId: string): boolean;
}
```

## Data Models

### Enhanced Order Model
```javascript
const orderSchema = {
  orderId: String,
  userId: ObjectId,
  deliveryAddress: {
    type: String, // 'live', 'manual', 'saved'
    coordinates: {
      lat: Number,
      lng: Number
    },
    buildingNo: String,
    area: { type: String, required: true },
    colony: String,
    fullAddress: String,
    addressType: String, // 'home', 'workplace'
    landmark: String
  },
  paymentDetails: {
    method: String, // 'cod', 'upi_id', 'qr_code', 'upi_app'
    upiId: String,
    transactionId: String,
    paymentApp: String,
    status: String, // 'pending', 'completed', 'failed'
    amount: Number,
    paidAt: Date
  },
  cancellationWindow: {
    deadline: Date,
    canCancel: Boolean,
    cancelledAt: Date,
    refundStatus: String
  },
  deliveryInfo: {
    scheduledDate: Date,
    estimatedTime: String,
    deliveryInstructions: String,
    contactNumber: String
  }
};
```

### Location Services Model
```javascript
const locationSchema = {
  userId: ObjectId,
  savedAddresses: [{
    type: String, // 'home', 'workplace'
    buildingNo: String,
    area: String,
    colony: String,
    fullAddress: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isDefault: Boolean
  }],
  locationPreferences: {
    allowLocationSharing: Boolean,
    defaultAddressType: String
  }
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:
- Location permission handling and fallback behavior can be combined into comprehensive location service properties
- Payment method validation and error handling can be unified into payment processing properties  
- Address validation across different input methods can be consolidated into address management properties
- UI state management for payment flows can be combined into payment UI consistency properties

### Core Properties

**Property 1: Location Service Fallback**
*For any* location permission state (granted, denied, unavailable), the system should provide appropriate address input options and never leave users without a way to enter delivery information
**Validates: Requirements 1.2, 6.2, 6.3**

**Property 2: Address Validation Consistency**
*For any* address input method (live location, manual entry, saved addresses), incomplete address information should prevent order progression with clear validation messages
**Validates: Requirements 1.9**

**Property 3: Coordinate to Address Conversion**
*For any* valid GPS coordinates within the service area, the geocoding service should return a readable address format
**Validates: Requirements 1.3, 6.4**

**Property 4: Saved Address Population**
*For any* saved address (Home, Workplace), selecting the address type should auto-populate all available address fields with the stored information
**Validates: Requirements 1.6**

**Property 5: QR Code Payment Lifecycle**
*For any* QR code payment, successful payment completion should immediately hide the QR code and show success confirmation
**Validates: Requirements 2.4, 3.2**

**Property 6: Payment Method Validation**
*For any* selected payment method, the system should generate valid payment data (QR codes, app redirects, transaction details) appropriate for that method
**Validates: Requirements 2.3, 2.5**

**Property 7: Payment Verification Gate**
*For any* order placement attempt, the system should verify payment completion before proceeding to order confirmation
**Validates: Requirements 2.6**

**Property 8: Payment Error Handling**
*For any* payment failure or timeout scenario, the system should display appropriate error messages and provide retry or alternative payment options
**Validates: Requirements 2.7, 2.8, 3.6**

**Property 9: Demo Message Exclusion**
*For any* payment processing flow, the system should not display "demo" or "test" messages during real payment operations
**Validates: Requirements 3.3**

**Property 10: Payment Receipt Generation**
*For any* completed payment, the system should generate payment receipts with valid transaction IDs
**Validates: Requirements 3.5**

**Property 11: Cancellation Timer Management**
*For any* confirmed order, the system should start a 10-minute cancellation timer and prevent cancellations after the window expires
**Validates: Requirements 4.3, 4.6**

**Property 12: Refund Processing**
*For any* valid cancellation within the allowed timeframe, the system should handle refund processing appropriately
**Validates: Requirements 4.7**

**Property 13: Order Summary Completeness**
*For any* confirmed order, the system should display comprehensive delivery information including date, complete address, and payment method
**Validates: Requirements 5.2, 5.4**

**Property 14: Delivery Time Calculation**
*For any* order placement, the system should calculate estimated delivery time based on current dairy operating hours
**Validates: Requirements 5.5**

**Property 15: Information Consistency**
*For any* order, delivery information should remain consistent across all order-related screens and displays
**Validates: Requirements 5.8**

**Property 16: Location Adjustment Capability**
*For any* captured location, users should be able to adjust location markers for precise delivery points
**Validates: Requirements 6.6**

**Property 17: Location Preference Storage**
*For any* location sharing interaction, the system should store location preferences while respecting privacy settings
**Validates: Requirements 6.7**

**Property 18: Secure Data Handling**
*For any* payment processing, sensitive payment information should not be stored locally in the browser
**Validates: Requirements 7.3**

**Property 19: Secure Error Logging**
*For any* payment processing failure, error logs should not expose user payment data or sensitive information
**Validates: Requirements 7.4**

**Property 20: Transaction Record Maintenance**
*For any* payment transaction, the system should maintain necessary transaction records for dispute handling
**Validates: Requirements 7.7**

<function_calls>
<invoke name="prework">
<parameter name="featureName">enhanced-order-placement

## Error Handling

### Location Services Error Handling
- **Permission Denied**: Graceful fallback to manual address entry with clear messaging
- **GPS Unavailable**: Alternative location input methods with user guidance
- **Geocoding Failures**: Manual address correction options with validation
- **Service Area Validation**: Clear messaging for out-of-service locations

### Payment Processing Error Handling
- **Payment Gateway Failures**: Retry mechanisms with alternative payment methods
- **Network Timeouts**: Graceful degradation with offline payment options
- **Transaction Verification Failures**: Secure error handling without data exposure
- **UPI App Redirect Failures**: Fallback to QR code or manual UPI ID entry

### Order Management Error Handling
- **Cancellation Window Expiry**: Clear messaging about refund policies
- **Address Validation Failures**: Field-specific error messages with correction guidance
- **Inventory Unavailability**: Real-time stock checking with alternative suggestions
- **Delivery Scheduling Conflicts**: Alternative delivery time suggestions

## Testing Strategy

### Dual Testing Approach
The system requires both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Location permission request flows
- Payment method UI interactions  
- Address validation scenarios
- Order cancellation workflows

**Property Tests**: Verify universal properties across all inputs
- Location service fallback behavior across all permission states
- Payment processing consistency across all payment methods
- Address validation behavior across all input types
- Order management consistency across all order states

### Property-Based Testing Configuration
- **Testing Library**: fast-check for JavaScript property-based testing
- **Test Iterations**: Minimum 100 iterations per property test
- **Test Tagging**: Each property test tagged with format: **Feature: enhanced-order-placement, Property {number}: {property_text}**

### Integration Testing Requirements
- **Location Services**: Test with actual browser geolocation APIs
- **Payment Gateways**: Test with sandbox payment environments
- **Real-time Features**: Test cancellation timers and payment verification
- **Cross-browser Compatibility**: Test location and payment features across browsers

### Security Testing Requirements
- **Payment Data Handling**: Verify no sensitive data storage in browser
- **Error Logging**: Ensure no user data exposure in error messages
- **Session Management**: Test payment session security and timeout handling
- **Data Transmission**: Verify encryption of payment-related communications