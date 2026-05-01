import { asyncHandler } from "../middlewares/error.middleware.js";
import otpService from "../services/otp.service.js";
import smsService from "../services/sms.service.js";
import Delivery from "../models/Delivery.model.js";
import User from "../models/User.model.js";

// Generate OTP for an order
export const generateOTP = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const employeeId = req.user.id;

  // Validate orderId
  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_ORDER_ID",
        message: "Order ID is required"
      }
    });
  }

  // Check if order exists
  const delivery = await Delivery.findById(orderId).populate('buyer', 'mobile');
  if (!delivery) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found"
      }
    });
  }

  // Check if order is in correct status (should be transitioning to "Out for Delivery")
  if (delivery.status !== "Out for Delivery") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ORDER_STATUS",
        message: "OTP can only be generated for orders that are Out for Delivery"
      }
    });
  }

  try {
    // Generate OTP
    const { otp, expiresAt } = await otpService.generateOTP(orderId, employeeId);

    // Send OTP via SMS
    const smsResult = await smsService.sendOTP(delivery.buyer.mobile, otp, orderId);

    // Console log after OTP generation and SMS sending
    console.log('\n📤 ═══════════════════════════════════════════════════════');
    console.log('🔐 OTP GENERATION & SMS SENDING');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`📱 Buyer Mobile: ${delivery.buyer.mobile}`);
    console.log(`✉️  SMS Sent: ${smsResult.success ? 'Yes' : 'No'}`);
    if (!smsResult.success && smsResult.fallbackOTP) {
      console.log(`🔢 Fallback OTP: ${smsResult.fallbackOTP}`);
    }
    console.log(`⏰ Expires At: ${expiresAt.toLocaleString()}`);
    console.log(`👤 Employee ID: ${employeeId}`);
    console.log('═══════════════════════════════════════════════════════\n');

    res.json({
      success: true,
      data: {
        otpGenerated: true,
        expiresAt,
        smsSent: smsResult.success,
        fallbackOTP: smsResult.fallbackOTP || null,
        smsError: smsResult.error || null
      },
      message: smsResult.success 
        ? "OTP generated and sent successfully" 
        : "OTP generated but SMS failed. Use fallback display."
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "OTP_GENERATION_FAILED",
        message: "Failed to generate OTP. Please try again."
      }
    });
  }
});

// Verify OTP
export const verifyOTP = asyncHandler(async (req, res) => {
  const { orderId, otp } = req.body;
  const employeeId = req.user.id;

  // Validate inputs
  if (!orderId || !otp) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PARAMETERS",
        message: "Order ID and OTP are required"
      }
    });
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_OTP_FORMAT",
        message: "OTP must be exactly 6 digits"
      }
    });
  }

  // Check if order exists
  const delivery = await Delivery.findById(orderId);
  if (!delivery) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found"
      }
    });
  }

  // Check if order is in correct status
  if (delivery.status !== "Out for Delivery") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ORDER_STATUS",
        message: "OTP verification is only available for orders that are Out for Delivery"
      }
    });
  }

  try {
    // Verify OTP
    const result = await otpService.verifyOTP(orderId, otp, employeeId);

    if (result.valid) {
      // Update delivery status to Completed
      delivery.status = "Completed";
      delivery.completedAt = new Date();
      delivery.otpVerified = true;
      delivery.otpVerifiedAt = new Date();
      
      // For COD orders, mark payment as completed
      if (delivery.paymentMethod === "cod" && !delivery.paymentCompleted) {
        delivery.paymentCompleted = true;
        delivery.paymentDate = new Date();
      }
      
      await delivery.save();

      // Console log after successful verification
      console.log('\n🎉 ═══════════════════════════════════════════════════════');
      console.log('✅ OTP VERIFICATION SUCCESSFUL');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📦 Order ID: ${orderId}`);
      console.log(`🔢 OTP: ${otp}`);
      console.log(`📊 Order Status: Completed`);
      console.log(`👤 Employee ID: ${employeeId}`);
      console.log('═══════════════════════════════════════════════════════\n');

      res.json({
        success: true,
        data: {
          verified: true,
          orderStatus: "Completed"
        },
        message: "OTP verified successfully. Delivery completed."
      });
    } else {
      // Console log after failed verification
      console.log('\n⚠️  ═══════════════════════════════════════════════════════');
      console.log('❌ OTP VERIFICATION FAILED');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📦 Order ID: ${orderId}`);
      console.log(`🔢 Entered OTP: ${otp}`);
      console.log(`📝 Error: ${result.message}`);
      console.log(`👤 Employee ID: ${employeeId}`);
      console.log('═══════════════════════════════════════════════════════\n');

      res.status(400).json({
        success: false,
        error: {
          code: "OTP_VERIFICATION_FAILED",
          message: result.message
        }
      });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "VERIFICATION_ERROR",
        message: "Failed to verify OTP. Please try again."
      }
    });
  }
});

// Resend OTP
export const resendOTP = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const employeeId = req.user.id;

  // Validate orderId
  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_ORDER_ID",
        message: "Order ID is required"
      }
    });
  }

  // Check if order exists
  const delivery = await Delivery.findById(orderId).populate('buyer', 'mobile');
  if (!delivery) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found"
      }
    });
  }

  // Check if order is in correct status
  if (delivery.status !== "Out for Delivery") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ORDER_STATUS",
        message: "OTP resend is only available for orders that are Out for Delivery"
      }
    });
  }

  try {
    // Resend OTP
    const { otp, expiresAt, resendCount } = await otpService.resendOTP(orderId, employeeId);

    // Send OTP via SMS
    const smsResult = await smsService.sendOTP(delivery.buyer.mobile, otp, orderId);

    // Console log after OTP resend
    console.log('\n🔄 ═══════════════════════════════════════════════════════');
    console.log('📱 OTP RESENT');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📦 Order ID: ${orderId}`);
    console.log(`📱 Buyer Mobile: ${delivery.buyer.mobile}`);
    console.log(`✉️  SMS Sent: ${smsResult.success ? 'Yes' : 'No'}`);
    console.log(`🔢 Resend Count: ${resendCount}/3`);
    console.log(`⏰ Expires At: ${expiresAt.toLocaleString()}`);
    console.log(`👤 Employee ID: ${employeeId}`);
    console.log('═══════════════════════════════════════════════════════\n');

    res.json({
      success: true,
      data: {
        otpGenerated: true,
        expiresAt,
        smsSent: smsResult.success,
        resendCount,
        resendsRemaining: 3 - resendCount,
        fallbackOTP: smsResult.fallbackOTP || null,
        smsError: smsResult.error || null
      },
      message: smsResult.success 
        ? "OTP resent successfully" 
        : "OTP generated but SMS failed. Use fallback display."
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    
    // Check if it's a known error (cooldown or max resends)
    if (error.message.includes('wait') || error.message.includes('Maximum')) {
      return res.status(400).json({
        success: false,
        error: {
          code: "RESEND_LIMIT_EXCEEDED",
          message: error.message
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: "RESEND_FAILED",
        message: "Failed to resend OTP. Please try again."
      }
    });
  }
});

// Get OTP status for an order
export const getOTPStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Validate orderId
  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_ORDER_ID",
        message: "Order ID is required"
      }
    });
  }

  // Check if order exists
  const delivery = await Delivery.findById(orderId);
  if (!delivery) {
    return res.status(404).json({
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "Order not found"
      }
    });
  }

  try {
    const status = await otpService.getOTPStatus(orderId);

    res.json({
      success: true,
      data: status,
      message: "OTP status retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting OTP status:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STATUS_RETRIEVAL_FAILED",
        message: "Failed to retrieve OTP status"
      }
    });
  }
});
