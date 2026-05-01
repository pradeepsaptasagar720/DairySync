import api from './api';

/**
 * Service for handling billing period validation
 * Prevents modifications to milk entries when bills have been generated
 */
class BillingValidationService {
  constructor() {
    this.cache = new Map(); // Cache validation results
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if a specific date is protected for a farmer
   * @param {string} farmerId - The farmer's ID
   * @param {string} entryDate - The entry date in YYYY-MM-DD format
   * @returns {Promise<Object>} - Validation result
   */
  async checkDateProtection(farmerId, entryDate) {
    const cacheKey = `${farmerId}-${entryDate}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`[BillingValidation] Using cached result for ${cacheKey}`);
      return cached.result;
    }
    
    try {
      console.log(`[BillingValidation] Checking protection for farmer ${farmerId}, date ${entryDate}`);
      
      const response = await api.get('/api/employee/check-billing-protection', {
        params: { farmerId, entryDate }
      });
      
      const result = {
        isProtected: response.data.data.isProtected,
        isAllowed: response.data.data.isAllowed,
        protectedPeriods: response.data.data.protectedPeriods || [],
        errorMessage: response.data.data.message || null,
        farmerId,
        entryDate
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      console.log(`[BillingValidation] Protection check result:`, {
        farmerId,
        entryDate,
        isProtected: result.isProtected,
        protectedPeriodsCount: result.protectedPeriods.length
      });
      
      return result;
    } catch (error) {
      console.error('Billing validation check failed:', error);
      
      // Return safe default (allow operation) with warning for graceful degradation
      const fallbackResult = {
        isProtected: false,
        isAllowed: true,
        protectedPeriods: [],
        validationError: error.message,
        fallback: true,
        farmerId,
        entryDate
      };
      
      console.warn(`[BillingValidation] Using fallback result due to error:`, fallbackResult);
      return fallbackResult;
    }
  }

  /**
   * Batch check multiple dates for a farmer
   * @param {string} farmerId - The farmer's ID
   * @param {Array<string>} entryDates - Array of entry dates
   * @returns {Promise<Object>} - Batch validation results
   */
  async checkMultipleDates(farmerId, entryDates) {
    try {
      console.log(`[BillingValidation] Batch checking ${entryDates.length} dates for farmer ${farmerId}`);
      
      const response = await api.post('/api/employee/batch-check-billing-protection', {
        farmerId,
        entryDates
      });
      
      const result = {
        farmerId,
        entryDates,
        results: response.data.data.results,
        hasAnyProtected: response.data.data.hasAnyProtected,
        allProtectedPeriods: response.data.data.allProtectedPeriods,
        summary: response.data.data.summary
      };
      
      // Cache individual results
      Object.entries(result.results).forEach(([date, validation]) => {
        const cacheKey = `${farmerId}-${date}`;
        this.cache.set(cacheKey, {
          result: {
            isProtected: validation.isProtected,
            isAllowed: validation.isAllowed,
            protectedPeriods: validation.protectedPeriods || [],
            errorMessage: validation.errorMessage || null,
            farmerId,
            entryDate: date
          },
          timestamp: Date.now()
        });
      });
      
      console.log(`[BillingValidation] Batch validation completed:`, {
        totalDates: entryDates.length,
        hasAnyProtected: result.hasAnyProtected,
        protectedCount: result.summary?.protectedDates || 0
      });
      
      return result;
    } catch (error) {
      console.error('Batch validation check failed:', error);
      
      // Fallback to individual checks
      console.log(`[BillingValidation] Falling back to individual checks`);
      const results = {};
      for (const date of entryDates) {
        results[date] = await this.checkDateProtection(farmerId, date);
      }
      
      const hasAnyProtected = Object.values(results).some(r => r.isProtected);
      const allProtectedPeriods = [];
      
      Object.values(results).forEach(result => {
        if (result.protectedPeriods) {
          allProtectedPeriods.push(...result.protectedPeriods);
        }
      });
      
      // Remove duplicates
      const uniqueProtectedPeriods = allProtectedPeriods.filter((period, index, self) => 
        index === self.findIndex(p => p.dateFrom === period.dateFrom && p.dateTo === period.dateTo)
      );
      
      return {
        farmerId,
        entryDates,
        results,
        hasAnyProtected,
        allProtectedPeriods: uniqueProtectedPeriods,
        fallback: true
      };
    }
  }

  /**
   * Get all protected periods for a farmer
   * @param {string} farmerId - The farmer's ID
   * @returns {Promise<Array>} - Array of protected periods
   */
  async getFarmerProtectedPeriods(farmerId) {
    try {
      console.log(`[BillingValidation] Getting protected periods for farmer ${farmerId}`);
      
      const response = await api.get(`/api/employee/farmer-protected-periods/${farmerId}`);
      
      const protectedPeriods = response.data.data.protectedPeriods || [];
      
      console.log(`[BillingValidation] Found ${protectedPeriods.length} protected periods for farmer ${farmerId}`);
      
      return protectedPeriods;
    } catch (error) {
      console.error('Failed to get farmer protected periods:', error);
      return [];
    }
  }

  /**
   * Clear cache for a specific farmer
   * @param {string} farmerId - The farmer's ID
   */
  clearCache(farmerId) {
    let clearedCount = 0;
    for (const [key] of this.cache.entries()) {
      if (key.startsWith(`${farmerId}-`)) {
        this.cache.delete(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      console.log(`[BillingValidation] Cleared ${clearedCount} cache entries for farmer ${farmerId}`);
    }
  }

  /**
   * Clear all cache entries
   */
  clearAllCache() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[BillingValidation] Cleared all ${size} cache entries`);
  }

  /**
   * Generate user-friendly error message for protected dates
   * @param {Array} protectedPeriods - Array of protected periods
   * @param {string} entryDate - The entry date
   * @returns {string} - User-friendly error message
   */
  generateErrorMessage(protectedPeriods, entryDate = null) {
    if (protectedPeriods.length === 0) {
      return "Bill has already been generated for the selected date. Updating milk entries is not allowed.";
    }
    
    if (protectedPeriods.length === 1) {
      const period = protectedPeriods[0];
      return `Bill has already been generated for the period ${period.dateFrom} to ${period.dateTo}. Updating milk entries is not allowed.`;
    }
    
    const periods = protectedPeriods.map(p => `${p.dateFrom} to ${p.dateTo}`).join(', ');
    return `Bills have been generated for multiple periods (${periods}). Updating milk entries is not allowed.`;
  }

  /**
   * Generate date range for batch validation
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array<string>} - Array of date strings
   */
  generateDateRange(startDate, endDate) {
    const dates = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * Check if validation service is available
   * @returns {Promise<boolean>} - True if service is available
   */
  async isServiceAvailable() {
    try {
      // Try a simple validation check with dummy data
      await api.get('/api/employee/check-billing-protection', {
        params: { farmerId: 'test', entryDate: '2024-01-01' }
      });
      return true;
    } catch (error) {
      // If we get a 400 (missing params), service is available
      if (error.response?.status === 400) {
        return true;
      }
      console.warn('[BillingValidation] Service availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics for debugging
   * @returns {Object} - Cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp < this.cacheTimeout) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      cacheTimeout: this.cacheTimeout
    };
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[BillingValidation] Cleaned up ${cleanedCount} expired cache entries`);
    }
    
    return cleanedCount;
  }
}

// Export singleton instance
export default new BillingValidationService();