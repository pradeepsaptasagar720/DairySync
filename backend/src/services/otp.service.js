import crypto from "crypto";
import bcrypt from "bcryptjs";
import OTP from "../models/OTP.model.js";
import OTPLog from "../models/OTPLog.model.js";

class OTPService {
  /**
   * Generate random 6-digit OTP
   * @returns {string}
   */
  generateRandomOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Check if OTP has expired
   * @param {Date} expiresAt - Expiration timestamp
   * @returns {boolean}
   */
  isExpired(expiresAt) {
    return new Date() > new Date(expiresAt);
  }

  /**
   * Generate a new OTP for an order
   * @param {ObjectId} orderId - The order ID
   * @param {ObjectId} performedBy - User who triggered generation
   * @returns {Promise<{otp: string, expiresAt: Date}>}
   */
  async generateOTP(orderId, performedBy = null) {
    try {
      // Generate random OTP
      const otp = this.generateRandomOTP();
      
      // Hash OTP for secure storage
      const otpHash = await bcrypt.hash(otp, 10);
      
      // Set expiration to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Check if OTP already exists for this order
      const existingOTP = await OTP.findOne({ orderId });
      
      if (existingOTP) {
        // Update existing OTP
        existingOTP.otpHash = otpHash;
        existingOTP.expiresAt = expiresAt;
        existingOTP.verified = false;
        existingOTP.verifiedAt = null;
        existingOTP.verificationAttempts = 0;
        existingOTP.locked = false;
        existingOTP.smsStatus = {
          sent: false,
          messageId: null,
          sentAt: null,
          error: null
        };
        await existingOTP.save();
      } else {
        // Create new OTP record
        await OTP.create({
          orderId,
          otpHash,
          expiresAt,
          verified: false,
          verificationAttempts: 0,
          resendCount: 0,
          locked: false
        });
      }
      
      // Log OTP generation
      await OTPLog.create({
        orderId,
        action: 'generate',
        status: 'success',
        details: { expiresAt },
        performedBy,
        timestamp: new Date()
      });
      
      // Console log for OTP generation
      console.log('\n🔐 ═══════════════════════════════════════════════════════');
      console.log('📱 OTP GENERATED');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`📦 Order ID: ${orderId}`);
      console.log(`🔢 OTP: ${otp}`);
      console.log(`⏰ Expires At: ${expiresAt.toLocaleString()}`);
      console.log(`👤 Performed By: ${performedBy || 'System'}`);
      console.log('═══════════════════════════════════════════════════════\n');
      
      return { otp, expiresAt };
    } catch (error) {
      // Log failure
      await OTPLog.create({
        orderId,
        action: 'generate',
        status: 'failure',
        details: { errorMessage: error.message },
        performedBy,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Verify an OTP for an order
   * @param {ObjectId} orderId - The order ID
   * @param {string} otp - The OTP to verify
   * @param {ObjectId} performedBy - User who is verifying
   * @returns {Promise<{valid: boolean, message: string}>}
   */
  async verifyOTP(orderId, otp, performedBy = null) {
    try {
      const otpRecord = await OTP.findOne({ orderId });
      
      if (!otpRecord) {
        await OTPLog.create({
          orderId,
          action: 'verify_failure',
          status: 'failure',
          details: { errorMessage: 'No OTP found for this order' },
          performedBy,
          timestamp: new Date()
        });
        
        return { valid: false, message: 'No OTP found for this order' };
      }
      
      // Check if OTP is locked
      if (otpRecord.locked) {
        await OTPLog.create({
          orderId,
          action: 'verify_failure',
          status: 'failure',
          details: { errorMessage: 'OTP is locked due to too many failed attempts' },
          performedBy,
          timestamp: new Date()
        });
        
        return { valid: false, message: 'OTP is locked due to too many failed attempts. Please contact support.' };
      }
      
      // Check if OTP has expired
      if (this.isExpired(otpRecord.expiresAt)) {
        await OTPLog.create({
          orderId,
          action: 'verify_failure',
          status: 'failure',
          details: { errorMessage: 'OTP has expired' },
          performedBy,
          timestamp: new Date()
        });
        
        return { valid: false, message: 'OTP has expired. Please request a new one.' };
      }
      
      // Check if OTP is already verified
      if (otpRecord.verified) {
        return { valid: true, message: 'OTP already verified' };
      }
      
      // Verify OTP
      const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
      
      if (isValid) {
        // Mark as verified
        otpRecord.verified = true;
        otpRecord.verifiedAt = new Date();
        await otpRecord.save();
        
        // Log success
        await OTPLog.create({
          orderId,
          action: 'verify_success',
          status: 'success',
          details: { verifiedAt: otpRecord.verifiedAt },
          performedBy,
          timestamp: new Date()
        });
        
        // Console log for successful verification
        console.log('\n✅ ═══════════════════════════════════════════════════════');
        console.log('🎯 OTP VERIFIED SUCCESSFULLY');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`📦 Order ID: ${orderId}`);
        console.log(`🔢 OTP: ${otp}`);
        console.log(`⏰ Verified At: ${new Date().toLocaleString()}`);
        console.log(`👤 Performed By: ${performedBy || 'System'}`);
        console.log('═══════════════════════════════════════════════════════\n');
        
        return { valid: true, message: 'OTP verified successfully' };
      } else {
        // Increment verification attempts
        otpRecord.verificationAttempts += 1;
        
        // Lock if max attempts exceeded
        if (otpRecord.verificationAttempts >= 5) {
          otpRecord.locked = true;
          
          await OTPLog.create({
            orderId,
            action: 'lock',
            status: 'success',
            details: { reason: 'Maximum verification attempts exceeded', attempts: otpRecord.verificationAttempts },
            performedBy,
            timestamp: new Date()
          });
        }
        
        await otpRecord.save();
        
        // Log failure
        await OTPLog.create({
          orderId,
          action: 'verify_failure',
          status: 'failure',
          details: { 
            errorMessage: 'Invalid OTP',
            attempts: otpRecord.verificationAttempts,
            locked: otpRecord.locked
          },
          performedBy,
          timestamp: new Date()
        });
        
        // Console log for failed verification
        console.log('\n❌ ═══════════════════════════════════════════════════════');
        console.log('⚠️  OTP VERIFICATION FAILED');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`📦 Order ID: ${orderId}`);
        console.log(`🔢 Entered OTP: ${otp}`);
        console.log(`📊 Attempts: ${otpRecord.verificationAttempts}/5`);
        console.log(`🔒 Locked: ${otpRecord.locked}`);
        console.log('═══════════════════════════════════════════════════════\n');
        
        const remainingAttempts = 5 - otpRecord.verificationAttempts;
        return { 
          valid: false, 
          message: otpRecord.locked 
            ? 'Maximum attempts exceeded. OTP is now locked. Please contact support.'
            : `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
        };
      }
    } catch (error) {
      await OTPLog.create({
        orderId,
        action: 'verify_failure',
        status: 'failure',
        details: { errorMessage: error.message },
        performedBy,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Invalidate existing OTP and generate new one
   * @param {ObjectId} orderId - The order ID
   * @param {ObjectId} performedBy - User who requested resend
   * @returns {Promise<{otp: string, expiresAt: Date, resendCount: number}>}
   */
  async resendOTP(orderId, performedBy = null) {
    try {
      const otpRecord = await OTP.findOne({ orderId });
      
      if (!otpRecord) {
        throw new Error('No OTP found for this order');
      }
      
      // Check if max resends exceeded
      if (otpRecord.resendCount >= 3) {
        await OTPLog.create({
          orderId,
          action: 'resend',
          status: 'failure',
          details: { errorMessage: 'Maximum resend attempts exceeded', resendCount: otpRecord.resendCount },
          performedBy,
          timestamp: new Date()
        });
        
        throw new Error('Maximum resend attempts exceeded. Please contact support.');
      }
      
      // Check cooldown period (30 seconds)
      if (otpRecord.lastResendAt) {
        const timeSinceLastResend = Date.now() - new Date(otpRecord.lastResendAt).getTime();
        const cooldownMs = 30 * 1000; // 30 seconds
        
        if (timeSinceLastResend < cooldownMs) {
          const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastResend) / 1000);
          
          await OTPLog.create({
            orderId,
            action: 'resend',
            status: 'failure',
            details: { errorMessage: 'Cooldown period active', remainingSeconds },
            performedBy,
            timestamp: new Date()
          });
          
          throw new Error(`Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
        }
      }
      
      // Generate new OTP
      const otp = this.generateRandomOTP();
      const otpHash = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      
      // Update OTP record
      otpRecord.otpHash = otpHash;
      otpRecord.expiresAt = expiresAt;
      otpRecord.verified = false;
      otpRecord.verifiedAt = null;
      otpRecord.verificationAttempts = 0;
      otpRecord.locked = false;
      otpRecord.resendCount += 1;
      otpRecord.lastResendAt = new Date();
      otpRecord.smsStatus = {
        sent: false,
        messageId: null,
        sentAt: null,
        error: null
      };
      
      await otpRecord.save();
      
      // Log resend
      await OTPLog.create({
        orderId,
        action: 'resend',
        status: 'success',
        details: { 
          expiresAt,
          resendCount: otpRecord.resendCount
        },
        performedBy,
        timestamp: new Date()
      });
      
      return { otp, expiresAt, resendCount: otpRecord.resendCount };
    } catch (error) {
      await OTPLog.create({
        orderId,
        action: 'resend',
        status: 'failure',
        details: { errorMessage: error.message },
        performedBy,
        timestamp: new Date()
      });
      
      throw error;
    }
  }

  /**
   * Get OTP status for an order
   * @param {ObjectId} orderId - The order ID
   * @returns {Promise<Object>}
   */
  async getOTPStatus(orderId) {
    const otpRecord = await OTP.findOne({ orderId });
    
    if (!otpRecord) {
      return {
        hasOTP: false,
        expired: false,
        verified: false,
        locked: false,
        expiresAt: null,
        attemptsRemaining: 5,
        resendsRemaining: 3
      };
    }
    
    return {
      hasOTP: true,
      expired: this.isExpired(otpRecord.expiresAt),
      verified: otpRecord.verified,
      locked: otpRecord.locked,
      expiresAt: otpRecord.expiresAt,
      attemptsRemaining: Math.max(0, 5 - otpRecord.verificationAttempts),
      resendsRemaining: Math.max(0, 3 - otpRecord.resendCount)
    };
  }
}

export default new OTPService();
