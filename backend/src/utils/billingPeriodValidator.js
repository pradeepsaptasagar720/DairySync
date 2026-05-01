import FarmerPayment from "../models/FarmerPayment.model.js";

/**
 * Utility class for validating billing period protection
 * Prevents modifications to milk entries for dates within billed periods
 */
class BillingPeriodValidator {
  /**
   * Check if a date is within any billed period for a farmer
   * @param {string} farmerId - The farmer's ID
   * @param {string} entryDate - The entry date in YYYY-MM-DD format
   * @returns {Promise<boolean>} - True if date is protected, false otherwise
   */
  async isDateProtected(farmerId, entryDate) {
    try {
      const protectingPeriods = await this.getProtectingPeriods(farmerId, entryDate);
      return protectingPeriods.length > 0;
    } catch (error) {
      console.error('Error checking date protection:', error);
      // In case of error, default to allowing the operation with a warning
      console.warn(`Failed to validate billing period protection for farmer ${farmerId}, date ${entryDate}. Allowing operation.`);
      return false;
    }
  }

  /**
   * Get all bill periods that protect a specific date
   * @param {string} farmerId - The farmer's ID
   * @param {string} entryDate - The entry date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of bill periods that protect this date
   */
  async getProtectingPeriods(farmerId, entryDate) {
    try {
      const billPeriods = await this.getBillPeriodsForFarmer(farmerId);
      
      return billPeriods.filter(period => {
        if (!period.billPeriod || !period.billPeriod.dateFrom || !period.billPeriod.dateTo) {
          return false;
        }
        
        const dateFrom = period.billPeriod.dateFrom;
        const dateTo = period.billPeriod.dateTo;
        
        // Check if entry date falls within the bill period (inclusive)
        return entryDate >= dateFrom && entryDate <= dateTo;
      }).map(period => ({
        dateFrom: period.billPeriod.dateFrom,
        dateTo: period.billPeriod.dateTo,
        billId: period._id,
        generatedAt: period.paymentDate || period.createdAt,
        amount: period.amount,
        status: period.status
      }));
    } catch (error) {
      console.error('Error getting protecting periods:', error);
      throw error;
    }
  }

  /**
   * Get all bill periods for a farmer
   * @param {string} farmerId - The farmer's ID
   * @returns {Promise<Array>} - Array of bill periods for the farmer
   */
  async getBillPeriodsForFarmer(farmerId) {
    try {
      return await FarmerPayment.find({
        farmer: farmerId,
        billPeriod: { $exists: true, $ne: null }
      }).select('billPeriod paymentDate createdAt amount status').lean();
    } catch (error) {
      console.error('Error getting bill periods for farmer:', error);
      throw error;
    }
  }

  /**
   * Validate milk entry operation against billing period protection
   * @param {string} farmerId - The farmer's ID
   * @param {string} entryDate - The entry date in YYYY-MM-DD format
   * @param {string} operation - The operation type (create, update, delete)
   * @returns {Promise<Object>} - Validation result with isAllowed and error details
   */
  async validateMilkEntryOperation(farmerId, entryDate, operation = 'create') {
    try {
      const isProtected = await this.isDateProtected(farmerId, entryDate);
      
      if (!isProtected) {
        return {
          isAllowed: true,
          isProtected: false,
          protectedPeriods: []
        };
      }

      const protectedPeriods = await this.getProtectingPeriods(farmerId, entryDate);
      
      return {
        isAllowed: false,
        isProtected: true,
        protectedPeriods,
        error: {
          code: "BILLING_PERIOD_PROTECTED",
          message: `Cannot ${operation} milk entry for ${entryDate}. Date falls within billed period.`,
          details: {
            entryDate,
            farmerId,
            operation,
            protectedPeriods: protectedPeriods.map(p => ({
              dateFrom: p.dateFrom,
              dateTo: p.dateTo,
              reason: `Bill already generated for period ${p.dateFrom} to ${p.dateTo}`
            }))
          }
        }
      };
    } catch (error) {
      console.error('Error validating milk entry operation:', error);
      
      // In case of validation error, log it but allow the operation
      return {
        isAllowed: true,
        isProtected: false,
        protectedPeriods: [],
        validationError: error.message
      };
    }
  }

  /**
   * Generate user-friendly error message for billing period protection
   * @param {string} entryDate - The entry date
   * @param {Array} protectedPeriods - Array of protecting periods
   * @param {string} operation - The operation type
   * @returns {string} - User-friendly error message
   */
  generateErrorMessage(entryDate, protectedPeriods, operation = 'modify') {
    if (protectedPeriods.length === 0) {
      return `Cannot ${operation} milk entry for ${entryDate}.`;
    }

    if (protectedPeriods.length === 1) {
      const period = protectedPeriods[0];
      return `Cannot ${operation} milk entry for ${entryDate}. This date is part of a billing period (${period.dateFrom} to ${period.dateTo}) for which bills have already been generated.`;
    }

    const periodList = protectedPeriods.map(p => `${p.dateFrom} to ${p.dateTo}`).join(', ');
    return `Cannot ${operation} milk entry for ${entryDate}. Multiple billing periods protect this date: ${periodList}.`;
  }

  /**
   * Check multiple dates for billing period protection
   * @param {string} farmerId - The farmer's ID
   * @param {Array<string>} entryDates - Array of entry dates to check
   * @returns {Promise<Object>} - Batch validation results
   */
  async validateMultipleDates(farmerId, entryDates) {
    try {
      const results = {};
      const allProtectedPeriods = [];

      for (const entryDate of entryDates) {
        const validation = await this.validateMilkEntryOperation(farmerId, entryDate);
        results[entryDate] = validation;
        
        if (validation.isProtected) {
          allProtectedPeriods.push(...validation.protectedPeriods);
        }
      }

      const hasAnyProtected = Object.values(results).some(r => r.isProtected);
      
      return {
        results,
        hasAnyProtected,
        allProtectedPeriods: [...new Set(allProtectedPeriods.map(p => JSON.stringify(p)))].map(p => JSON.parse(p))
      };
    } catch (error) {
      console.error('Error validating multiple dates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new BillingPeriodValidator();