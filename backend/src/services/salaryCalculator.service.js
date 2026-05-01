class SalaryCalculatorService {
  /**
   * Calculate base amount based on payment type
   * @param {String} paymentType - monthly, daily, or hourly
   * @param {Number} baseSalary - base salary for monthly
   * @param {Number} dailyRate - daily rate for daily payment type
   * @param {Number} hourlyRate - hourly rate for hourly payment type
   * @param {Object} attendance - attendance data { daysWorked, hoursWorked, overtimeHours, unpaidLeaveDays }
   * @param {Number} overtimeRate - overtime rate for hourly workers
   * @returns {Number} calculated base amount
   */
  calculateBaseAmount(paymentType, baseSalary, dailyRate, hourlyRate, attendance = {}, overtimeRate = 0) {
    let baseAmount = 0;
    
    switch (paymentType) {
      case 'monthly':
        baseAmount = baseSalary;
        
        // Deduct for unpaid leave days
        if (attendance.unpaidLeaveDays && attendance.unpaidLeaveDays > 0) {
          const daysInMonth = 30; // Standard month days
          const perDayAmount = baseSalary / daysInMonth;
          const unpaidDeduction = perDayAmount * attendance.unpaidLeaveDays;
          baseAmount -= unpaidDeduction;
        }
        break;
        
      case 'daily':
        if (!dailyRate || !attendance.daysWorked) {
          throw new Error('Daily rate and days worked are required for daily payment type');
        }
        baseAmount = dailyRate * attendance.daysWorked;
        break;
        
      case 'hourly':
        if (!hourlyRate || !attendance.hoursWorked) {
          throw new Error('Hourly rate and hours worked are required for hourly payment type');
        }
        baseAmount = hourlyRate * attendance.hoursWorked;
        
        // Add overtime pay
        if (attendance.overtimeHours && overtimeRate) {
          baseAmount += overtimeRate * attendance.overtimeHours;
        }
        break;
        
      default:
        throw new Error(`Invalid payment type: ${paymentType}`);
    }
    
    return Math.max(0, baseAmount);
  }
  
  /**
   * Calculate allowances
   * @param {Number} baseAmount - base salary amount
   * @param {Array} allowances - array of allowance objects
   * @returns {Object} { allowanceItems: [], totalAllowances: Number }
   */
  calculateAllowances(baseAmount, allowances = []) {
    const allowanceItems = [];
    let totalAllowances = 0;
    
    for (const allowance of allowances) {
      if (!allowance.isActive) continue;
      
      let amount = 0;
      
      if (allowance.calculationMethod === 'fixed') {
        amount = allowance.amount;
      } else if (allowance.calculationMethod === 'percentage') {
        amount = (baseAmount * allowance.percentage) / 100;
      }
      
      allowanceItems.push({
        type: allowance.type,
        name: allowance.name,
        amount: Math.round(amount * 100) / 100
      });
      
      totalAllowances += amount;
    }
    
    return {
      allowanceItems,
      totalAllowances: Math.round(totalAllowances * 100) / 100
    };
  }
  
  /**
   * Calculate deductions
   * @param {Number} grossSalary - gross salary amount
   * @param {Array} deductions - array of deduction objects
   * @returns {Object} { deductionItems: [], totalDeductions: Number }
   */
  calculateDeductions(grossSalary, deductions = []) {
    const deductionItems = [];
    let totalDeductions = 0;
    
    for (const deduction of deductions) {
      if (!deduction.isActive) continue;
      
      let amount = 0;
      
      if (deduction.calculationMethod === 'fixed') {
        amount = deduction.amount;
      } else if (deduction.calculationMethod === 'percentage') {
        amount = (grossSalary * deduction.percentage) / 100;
      }
      
      deductionItems.push({
        type: deduction.type,
        name: deduction.name,
        amount: Math.round(amount * 100) / 100
      });
      
      totalDeductions += amount;
    }
    
    return {
      deductionItems,
      totalDeductions: Math.round(totalDeductions * 100) / 100
    };
  }
  
  /**
   * Calculate gross salary
   * @param {Number} baseAmount - base salary amount
   * @param {Number} totalAllowances - total allowances
   * @param {Number} totalBonuses - total bonuses
   * @returns {Number} gross salary
   */
  calculateGrossSalary(baseAmount, totalAllowances = 0, totalBonuses = 0) {
    const gross = baseAmount + totalAllowances + totalBonuses;
    return Math.round(gross * 100) / 100;
  }
  
  /**
   * Calculate net pay
   * @param {Number} grossSalary - gross salary
   * @param {Number} totalDeductions - total deductions
   * @returns {Number} net pay
   */
  calculateNetPay(grossSalary, totalDeductions = 0) {
    const netPay = grossSalary - totalDeductions;
    return Math.max(0, Math.round(netPay * 100) / 100);
  }
  
  /**
   * Calculate complete salary
   * @param {Object} salaryStructure - salary structure object
   * @param {Object} attendanceData - attendance data
   * @param {Object} bonuses - bonuses array
   * @param {Object} additionalDeductions - additional deductions (advances, loans)
   * @returns {Object} complete salary calculation
   */
  calculateSalary(salaryStructure, attendanceData = {}, bonuses = [], additionalDeductions = {}) {
    // Calculate base amount
    const baseAmount = this.calculateBaseAmount(
      salaryStructure.paymentType,
      salaryStructure.baseSalary,
      salaryStructure.dailyRate,
      salaryStructure.hourlyRate,
      attendanceData,
      salaryStructure.overtimeRate
    );
    
    // Calculate allowances
    const { allowanceItems, totalAllowances } = this.calculateAllowances(
      baseAmount,
      salaryStructure.allowances
    );
    
    // Calculate total bonuses
    const totalBonuses = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
    
    // Calculate gross salary
    const grossSalary = this.calculateGrossSalary(baseAmount, totalAllowances, totalBonuses);
    
    // Calculate deductions
    const { deductionItems, totalDeductions } = this.calculateDeductions(
      grossSalary,
      salaryStructure.deductions
    );
    
    // Add additional deductions
    const advanceDeduction = additionalDeductions.advanceDeduction || 0;
    const loanDeduction = additionalDeductions.loanDeduction || 0;
    const finalTotalDeductions = totalDeductions + advanceDeduction + loanDeduction;
    
    // Calculate net pay
    const netPay = this.calculateNetPay(grossSalary, finalTotalDeductions);
    
    return {
      baseSalary: baseAmount,
      allowances: allowanceItems,
      totalAllowances,
      bonuses,
      totalBonuses,
      grossSalary,
      deductions: deductionItems,
      totalDeductions,
      advanceDeduction,
      loanDeduction,
      finalTotalDeductions,
      netPay,
      attendanceData
    };
  }
}

export default new SalaryCalculatorService();
