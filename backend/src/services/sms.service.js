import OTP from "../models/OTP.model.js";

class SMSService {
  constructor() {
    // Twilio configuration from environment variables
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.enabled = !!(this.accountSid && this.authToken && this.phoneNumber);
    
    // Initialize Twilio client only if credentials are available
    if (this.enabled) {
      try {
        // Dynamic import to avoid errors if twilio is not installed
        import('twilio').then(twilioModule => {
          this.client = twilioModule.default(this.accountSid, this.authToken);
        }).catch(err => {
          console.warn('Twilio SDK not available:', err.message);
          this.enabled = false;
        });
      } catch (error) {
        console.warn('Failed to initialize Twilio:', error.message);
        this.enabled = false;
      }
    } else {
      console.warn('SMS service disabled: Twilio credentials not configured');
    }
  }

  /**
   * Format mobile number to E.164 format
   * @param {string} mobile - Raw mobile number
   * @returns {string}
   */
  formatMobileNumber(mobile) {
    // Remove all non-digit characters
    const digits = mobile.replace(/\D/g, '');
    
    // If already has country code, return as is
    if (digits.startsWith('91') && digits.length === 12) {
      return '+' + digits;
    }
    
    // If 10 digits, add India country code
    if (digits.length === 10) {
      return '+91' + digits;
    }
    
    // Return as is with + prefix
    return '+' + digits;
  }

  /**
   * Send OTP to buyer's mobile with retry logic
   * @param {string} mobile - Buyer's mobile number
   * @param {string} otp - The OTP to send
   * @param {string} orderId - Order reference
   * @returns {Promise<{success: boolean, messageId: string, fallbackOTP: string}>}
   */
  async sendOTP(mobile, otp, orderId) {
    const formattedMobile = this.formatMobileNumber(mobile);
    const message = `Your OTP for milk delivery order #${orderId.toString().slice(-6)} is ${otp}. Valid for 10 minutes. Do not share this OTP.`;
    
    // If SMS service is not enabled, return fallback
    if (!this.enabled || !this.client) {
      console.log(`SMS service disabled. OTP for order ${orderId}: ${otp}`);
      
      // Update OTP record with fallback status
      await OTP.findOneAndUpdate(
        { orderId },
        {
          'smsStatus.sent': false,
          'smsStatus.error': 'SMS service not configured',
          'smsStatus.sentAt': new Date()
        }
      );
      
      return {
        success: false,
        messageId: null,
        fallbackOTP: otp,
        error: 'SMS service not configured. Use fallback OTP display.'
      };
    }
    
    // Retry logic: 3 attempts with exponential backoff
    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await this.client.messages.create({
          body: message,
          from: this.phoneNumber,
          to: formattedMobile
        });
        
        // Update OTP record with SMS status
        await OTP.findOneAndUpdate(
          { orderId },
          {
            'smsStatus.sent': true,
            'smsStatus.messageId': result.sid,
            'smsStatus.sentAt': new Date(),
            'smsStatus.error': null
          }
        );
        
        return {
          success: true,
          messageId: result.sid,
          fallbackOTP: null
        };
      } catch (error) {
        lastError = error;
        console.error(`SMS send attempt ${attempt} failed:`, error.message);
        
        // Wait before retry (exponential backoff: 1s, 2s, 4s)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }
    
    // All retries failed, update OTP record and return fallback
    await OTP.findOneAndUpdate(
      { orderId },
      {
        'smsStatus.sent': false,
        'smsStatus.error': lastError.message,
        'smsStatus.sentAt': new Date()
      }
    );
    
    console.error(`Failed to send SMS after 3 attempts for order ${orderId}`);
    
    return {
      success: false,
      messageId: null,
      fallbackOTP: otp,
      error: lastError.message
    };
  }

  /**
   * Send delivery status update
   * @param {string} mobile - Buyer's mobile number
   * @param {string} status - New status
   * @param {string} orderId - Order reference
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendStatusUpdate(mobile, status, orderId) {
    const formattedMobile = this.formatMobileNumber(mobile);
    const message = `Your milk order #${orderId.toString().slice(-6)} is now ${status}. Track your order in the app.`;
    
    // If SMS service is not enabled, skip
    if (!this.enabled || !this.client) {
      console.log(`SMS service disabled. Status update for order ${orderId}: ${status}`);
      return {
        success: false,
        messageId: null,
        error: 'SMS service not configured'
      };
    }
    
    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: formattedMobile
      });
      
      return {
        success: true,
        messageId: result.sid
      };
    } catch (error) {
      console.error('Failed to send status update SMS:', error.message);
      return {
        success: false,
        messageId: null,
        error: error.message
      };
    }
  }
}

export default new SMSService();
