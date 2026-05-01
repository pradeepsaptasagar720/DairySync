import OTPLog from "../models/OTPLog.model.js";

class AuditService {
  /**
   * Log OTP operation
   * @param {ObjectId} orderId
   * @param {string} action - 'generate', 'verify', 'resend', 'expire'
   * @param {string} status - 'success', 'failure'
   * @param {Object} details - Additional context
   * @param {ObjectId} performedBy - User who performed the action
   */
  async logOTPOperation(orderId, action, status, details = {}, performedBy = null) {
    try {
      await OTPLog.create({
        orderId,
        action,
        status,
        details,
        performedBy,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log OTP operation:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Get audit logs for an order
   * @param {ObjectId} orderId
   * @returns {Promise<Array>}
   */
  async getOrderLogs(orderId) {
    try {
      const logs = await OTPLog.find({ orderId })
        .populate('performedBy', 'username uniqueId')
        .sort({ timestamp: -1 });
      
      return logs;
    } catch (error) {
      console.error('Failed to retrieve order logs:', error);
      throw error;
    }
  }

  /**
   * Get all audit logs with filtering
   * @param {Object} filters - { startDate, endDate, orderId, deliveryBoyId, action }
   * @param {Object} pagination - { page, limit }
   * @returns {Promise<Object>}
   */
  async getAllLogs(filters = {}, pagination = { page: 1, limit: 50 }) {
    try {
      const query = {};
      
      // Date range filter
      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) {
          query.timestamp.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.timestamp.$lte = new Date(filters.endDate);
        }
      }
      
      // Order ID filter
      if (filters.orderId) {
        query.orderId = filters.orderId;
      }
      
      // Delivery boy filter
      if (filters.deliveryBoyId) {
        query.performedBy = filters.deliveryBoyId;
      }
      
      // Action filter
      if (filters.action) {
        query.action = filters.action;
      }
      
      const skip = (pagination.page - 1) * pagination.limit;
      
      const logs = await OTPLog.find(query)
        .populate('performedBy', 'username uniqueId')
        .populate('orderId', 'buyer status')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(pagination.limit);
      
      const total = await OTPLog.countDocuments(query);
      
      return {
        logs,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      };
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious patterns
   * @param {ObjectId} orderId
   * @returns {Promise<{suspicious: boolean, reason: string}>}
   */
  async detectSuspiciousActivity(orderId) {
    try {
      const logs = await OTPLog.find({ orderId }).sort({ timestamp: 1 });
      
      // Count failed verification attempts
      const failedAttempts = logs.filter(
        log => log.action === 'verify_failure'
      ).length;
      
      // Count resend requests
      const resendRequests = logs.filter(
        log => log.action === 'resend' && log.status === 'success'
      ).length;
      
      // Check for rapid attempts (< 5 seconds apart)
      let rapidAttempts = 0;
      for (let i = 1; i < logs.length; i++) {
        const timeDiff = new Date(logs[i].timestamp) - new Date(logs[i - 1].timestamp);
        if (timeDiff < 5000 && logs[i].action === 'verify_failure') {
          rapidAttempts++;
        }
      }
      
      // Determine if suspicious
      const reasons = [];
      
      if (failedAttempts > 5) {
        reasons.push(`Excessive failed verification attempts (${failedAttempts})`);
      }
      
      if (resendRequests > 3) {
        reasons.push(`Excessive resend requests (${resendRequests})`);
      }
      
      if (rapidAttempts > 3) {
        reasons.push(`Multiple rapid verification attempts (${rapidAttempts})`);
      }
      
      return {
        suspicious: reasons.length > 0,
        reasons,
        details: {
          failedAttempts,
          resendRequests,
          rapidAttempts
        }
      };
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Get suspicious orders
   * @returns {Promise<Array>}
   */
  async getSuspiciousOrders() {
    try {
      // Get all orders with OTP logs
      const orderIds = await OTPLog.distinct('orderId');
      
      const suspiciousOrders = [];
      
      for (const orderId of orderIds) {
        const analysis = await this.detectSuspiciousActivity(orderId);
        if (analysis.suspicious) {
          suspiciousOrders.push({
            orderId,
            ...analysis
          });
        }
      }
      
      return suspiciousOrders;
    } catch (error) {
      console.error('Failed to get suspicious orders:', error);
      throw error;
    }
  }
}

export default new AuditService();
