const TaxConfig = require('../models/TaxConfig.model');
const EmployeePayment = require('../models/EmployeePayment.model');

class TaxCalculatorService {
  /**
   * Get active tax configuration
   * @returns {Promise<Object>} active tax config
   */
  async getActiveTaxConfig() {
    const config = await TaxConfig.findOne({
      isActive: true,
      effectiveFrom: { $lte: new Date() },
      $or: [
        { effectiveTo: { $gte: new Date() } },
        { effectiveTo: null }
      ]
    }).sort({ effectiveFrom: -1 });
    
    if (!config) {
      // Return default config if none found
      return {
        pfRate: 12,
        esiRate: 0.75,
        esiThreshold: 21000,
        tdsSlabs: [],
        professionalTaxSlabs: []
      };
    }
    
    return config;
  }
  
  /**
   * Calculate TDS based on annual income and tax slabs
   * @param {Number} annualIncome - projected annual income
   * @param {Array} tdsSlabs - TDS slab configuration
   * @returns {Number} monthly TDS amount
   */
  calculateTDS(annualIncome, tdsSlabs = []) {
    if (!tdsSlabs || tdsSlabs.length === 0) {
      return 0;
    }
    
    let totalTax = 0;
    
    for (const slab of tdsSlabs) {
      if (annualIncome > slab.minIncome) {
        const taxableIncome = Math.min(annualIncome, slab.maxIncome) - slab.minIncome;
        const slabTax = (taxableIncome * slab.taxRate) / 100;
        totalTax += slabTax + (slab.fixedAmount || 0);
      }
    }
    
    // Return monthly TDS
    const monthlyTDS = totalTax / 12;
    return Math.round(monthlyTDS * 100) / 100;
  }
  
  /**
   * Calculate Provident Fund
   * @param {Number} basicSalary - basic salary amount
   * @param {Number} pfRate - PF rate percentage
   * @returns {Number} PF amount
   */
  calculatePF(basicSalary, pfRate = 12) {
    const pfAmount = (basicSalary * pfRate) / 100;
    return Math.round(pfAmount * 100) / 100;
  }
  
  /**
   * Calculate Employee State Insurance
   * @param {Number} grossSalary - gross salary amount
   * @param {Number} esiRate - ESI rate percentage
   * @param {Number} threshold - ESI threshold
   * @returns {Number} ESI amount
   */
  calculateESI(grossSalary, esiRate = 0.75, threshold = 21000) {
    if (grossSalary > threshold) {
      return 0;
    }
    
    const esiAmount = (grossSalary * esiRate) / 100;
    return Math.round(esiAmount * 100) / 100;
  }
  
  /**
   * Calculate Professional Tax based on salary slabs
   * @param {Number} monthlySalary - monthly salary amount
   * @param {Array} ptSlabs - professional tax slabs
   * @returns {Number} professional tax amount
   */
  calculateProfessionalTax(monthlySalary, ptSlabs = []) {
    if (!ptSlabs || ptSlabs.length === 0) {
      return 0;
    }
    
    for (const slab of ptSlabs) {
      if (monthlySalary >= slab.minSalary && monthlySalary <= slab.maxSalary) {
        return slab.taxAmount;
      }
    }
    
    return 0;
  }
  
  /**
   * Get year-to-date income for an employee
   * @param {String} employeeId - employee ID
   * @param {Number} currentMonth - current month (1-12)
   * @param {Number} currentYear - current year
   * @returns {Promise<Number>} YTD income
   */
  async getYTDIncome(employeeId, currentMonth, currentYear) {
    const payments = await EmployeePayment.find({
      employee: employeeId,
      status: 'completed',
      'billingPeriod.year': currentYear,
      'billingPeriod.month': { $lte: currentMonth }
    });
    
    const ytdIncome = payments.reduce((sum, payment) => sum + payment.grossSalary, 0);
    return Math.round(ytdIncome * 100) / 100;
  }
  
  /**
   * Project annual income based on current monthly gross
   * @param {Number} monthlyGross - monthly gross salary
   * @param {Number} currentMonth - current month (1-12)
   * @param {Number} ytdIncome - year-to-date income
   * @returns {Number} projected annual income
   */
  projectAnnualIncome(monthlyGross, currentMonth, ytdIncome = 0) {
    const remainingMonths = 12 - currentMonth;
    const projectedRemaining = monthlyGross * remainingMonths;
    const projectedAnnual = ytdIncome + projectedRemaining;
    return Math.round(projectedAnnual * 100) / 100;
  }
  
  /**
   * Calculate all statutory deductions for a payment
   * @param {Object} salaryData - salary calculation data
   * @param {String} employeeId - employee ID
   * @returns {Promise<Object>} statutory deductions
   */
  async calculateStatutoryDeductions(salaryData, employeeId) {
    const taxConfig = await this.getActiveTaxConfig();
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Get YTD income
    const ytdIncome = await this.getYTDIncome(employeeId, currentMonth, currentYear);
    
    // Project annual income
    const projectedAnnual = this.projectAnnualIncome(
      salaryData.grossSalary,
      currentMonth,
      ytdIncome
    );
    
    // Calculate deductions
    const pf = this.calculatePF(salaryData.baseSalary, taxConfig.pfRate);
    const esi = this.calculateESI(salaryData.grossSalary, taxConfig.esiRate, taxConfig.esiThreshold);
    const tds = this.calculateTDS(projectedAnnual, taxConfig.tdsSlabs);
    const professionalTax = this.calculateProfessionalTax(salaryData.grossSalary, taxConfig.professionalTaxSlabs);
    
    return {
      pf,
      esi,
      tds,
      professionalTax,
      total: pf + esi + tds + professionalTax,
      ytdIncome,
      projectedAnnual
    };
  }
}

export default new TaxCalculatorService();
