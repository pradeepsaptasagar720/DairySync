import AdvanceRecord from '../models/AdvanceRecord.model.js';
import User from '../models/User.model.js';

class AdvanceManagerService {
  /**
   * Create a new advance record
   * @param {Object} advanceData - advance data
   * @param {String} adminId - admin user ID
   * @returns {Promise<Object>} created advance record
   */
  async createAdvance(advanceData, adminId) {
    // Get employee details
    const employee = await User.findById(advanceData.employee);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // Calculate repayment schedule
    const schedule = this.calculateRepaymentSchedule(
      advanceData.advanceAmount,
      advanceData.repaymentType,
      advanceData.installmentAmount,
      advanceData.numberOfInstallments
    );
    
    const advance = new AdvanceRecord({
      employee: advanceData.employee,
      employeeName: employee.username,
      employeeUniqueId: employee.uniqueId,
      advanceAmount: advanceData.advanceAmount,
      advanceDate: advanceData.advanceDate || new Date(),
      reason: advanceData.reason,
      repaymentType: advanceData.repaymentType,
      installmentAmount: schedule.installmentAmount,
      numberOfInstallments: schedule.numberOfInstallments,
      installmentsRemaining: schedule.numberOfInstallments,
      outstandingBalance: advanceData.advanceAmount,
      approvedBy: adminId,
      processedBy: adminId
    });
    
    await advance.save();
    return advance;
  }
  
  /**
   * Calculate repayment schedule
   * @param {Number} advanceAmount - total advance amount
   * @param {String} repaymentType - lump_sum or installments
   * @param {Number} installmentAmount - installment amount (optional)
   * @param {Number} numberOfInstallments - number of installments (optional)
   * @returns {Object} repayment schedule
   */
  calculateRepaymentSchedule(advanceAmount, repaymentType, installmentAmount, numberOfInstallments) {
    if (repaymentType === 'lump_sum') {
      return {
        installmentAmount: advanceAmount,
        numberOfInstallments: 1
      };
    }
    
    // For installments
    if (installmentAmount && !numberOfInstallments) {
      // Calculate number of installments based on amount
      numberOfInstallments = Math.ceil(advanceAmount / installmentAmount);
    } else if (numberOfInstallments && !installmentAmount) {
      // Calculate installment amount based on number
      installmentAmount = Math.ceil(advanceAmount / numberOfInstallments);
    } else if (!installmentAmount && !numberOfInstallments) {
      throw new Error('Either installment amount or number of installments must be provided');
    }
    
    return {
      installmentAmount,
      numberOfInstallments
    };
  }
  
  /**
   * Get outstanding advances for an employee
   * @param {String} employeeId - employee ID
   * @returns {Promise<Array>} active advances
   */
  async getOutstandingAdvances(employeeId) {
    const advances = await AdvanceRecord.find({
      employee: employeeId,
      status: 'active',
      outstandingBalance: { $gt: 0 }
    }).sort({ advanceDate: 1 });
    
    return advances;
  }
  
  /**
   * Get advance deduction amount for a payment
   * Ensures deduction doesn't result in negative net pay
   * @param {String} employeeId - employee ID
   * @param {Number} netPay - calculated net pay before advance deduction
   * @returns {Promise<Object>} { deductionAmount, advanceIds }
   */
  async getAdvanceDeduction(employeeId, netPay) {
    const advances = await this.getOutstandingAdvances(employeeId);
    
    if (advances.length === 0) {
      return { deductionAmount: 0, advanceIds: [] };
    }
    
    let totalDeduction = 0;
    const advanceIds = [];
    
    for (const advance of advances) {
      const deduction = Math.min(advance.installmentAmount, advance.outstandingBalance);
      
      // Check if deduction would result in negative net pay
      if (totalDeduction + deduction > netPay) {
        // Only deduct what's possible without going negative
        const remainingNetPay = netPay - totalDeduction;
        if (remainingNetPay > 0) {
          totalDeduction += remainingNetPay;
          advanceIds.push({ advanceId: advance._id, amount: remainingNetPay });
        }
        break;
      }
      
      totalDeduction += deduction;
      advanceIds.push({ advanceId: advance._id, amount: deduction });
    }
    
    return {
      deductionAmount: Math.round(totalDeduction * 100) / 100,
      advanceIds
    };
  }
  
  /**
   * Process advance repayment
   * @param {String} advanceId - advance record ID
   * @param {String} paymentId - payment ID
   * @param {Number} amount - repayment amount
   * @returns {Promise<Object>} updated advance record
   */
  async processRepayment(advanceId, paymentId, amount) {
    const advance = await AdvanceRecord.findById(advanceId);
    if (!advance) {
      throw new Error('Advance record not found');
    }
    
    if (advance.status !== 'active') {
      throw new Error('Advance is not active');
    }
    
    // Update advance balance
    await this.updateAdvanceBalance(advanceId, amount, paymentId);
    
    return advance;
  }
  
  /**
   * Update advance balance after repayment
   * @param {String} advanceId - advance record ID
   * @param {Number} repaidAmount - amount repaid
   * @param {String} paymentId - payment ID (optional)
   * @returns {Promise<Object>} updated advance record
   */
  async updateAdvanceBalance(advanceId, repaidAmount, paymentId = null) {
    const advance = await AdvanceRecord.findById(advanceId);
    if (!advance) {
      throw new Error('Advance record not found');
    }
    
    // Update amounts
    advance.amountRepaid += repaidAmount;
    advance.outstandingBalance = Math.max(0, advance.advanceAmount - advance.amountRepaid);
    
    // Update installments remaining
    if (advance.repaymentType === 'installments' && advance.installmentsRemaining > 0) {
      advance.installmentsRemaining -= 1;
    }
    
    // Add to repayment history
    if (paymentId) {
      advance.repaymentHistory.push({
        payment: paymentId,
        amount: repaidAmount,
        date: new Date()
      });
    }
    
    // Update status if fully repaid
    if (advance.outstandingBalance === 0) {
      advance.status = 'fully_repaid';
    }
    
    await advance.save();
    return advance;
  }
  
  /**
   * Get total outstanding balance for an employee
   * @param {String} employeeId - employee ID
   * @returns {Promise<Number>} total outstanding balance
   */
  async getTotalOutstandingBalance(employeeId) {
    const advances = await this.getOutstandingAdvances(employeeId);
    const total = advances.reduce((sum, advance) => sum + advance.outstandingBalance, 0);
    return Math.round(total * 100) / 100;
  }
}

export default new AdvanceManagerService();
