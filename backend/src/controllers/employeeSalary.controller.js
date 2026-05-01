import EmployeePayment from '../models/EmployeePayment.model.js';
import SalaryStructure from '../models/SalaryStructure.model.js';
import User from '../models/User.model.js';
import salaryCalculatorService from '../services/salaryCalculator.service.js';
import advanceManagerService from '../services/advanceManager.service.js';

// Process employee salary payment
export const processPayment = async (req, res) => {
  try {
    const {
      employeeId,
      paymentDate,
      amount,
      paymentMethod,
      upiId,
      bankName,
      ifscCode,
      accountNumber,
      notes
    } = req.body;

    // Validate required fields
    if (!employeeId || !paymentDate || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Employee, payment date, amount, and payment method are required'
      });
    }

    // Validate payment method specific fields
    if (paymentMethod === 'upi' && !upiId) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required for UPI payments'
      });
    }

    if (paymentMethod === 'bank_transfer') {
      if (!bankName || !ifscCode || !accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Bank name, IFSC code, and account number are required for bank transfers'
        });
      }

      // Validate IFSC format (11 characters, alphanumeric)
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid IFSC code format'
        });
      }

      // Validate account number (numeric)
      if (!/^\d+$/.test(accountNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Account number must be numeric'
        });
      }
    }

    // Validate UPI ID format
    if (paymentMethod === 'upi') {
      const upiRegex = /^[\w.-]+@[\w.-]+$/;
      if (!upiRegex.test(upiId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid UPI ID format'
        });
      }
    }

    // Get employee details
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Get billing period from payment date
    const paymentDateObj = new Date(paymentDate);
    const month = paymentDateObj.getMonth() + 1;
    const year = paymentDateObj.getFullYear();

    // Check for duplicate payment
    const existingPayment = await EmployeePayment.findOne({
      employee: employeeId,
      'billingPeriod.month': month,
      'billingPeriod.year': year
    });

    if (existingPayment) {
      return res.status(409).json({
        success: false,
        message: 'Payment already exists for this employee and billing period'
      });
    }

    // Create payment record
    const payment = new EmployeePayment({
      employee: employeeId,
      employeeName: employee.username,
      employeeUniqueId: employee.uniqueId,
      employeeMobile: employee.mobile,
      billingPeriod: {
        dateFrom: new Date(year, month - 1, 1),
        dateTo: new Date(year, month, 0),
        month,
        year
      },
      paymentType: 'monthly',
      baseSalary: amount,
      grossSalary: amount,
      netPay: amount,
      paymentMethod,
      paymentDate: paymentDateObj,
      status: 'completed',
      completedAt: new Date(),
      processedBy: req.user._id,
      notes
    });

    // Add payment method specific details
    if (paymentMethod === 'upi') {
      payment.upiId = upiId;
      payment.upiTransactionId = `UPI${Date.now()}${Math.floor(Math.random() * 1000)}`;
    } else if (paymentMethod === 'bank_transfer') {
      payment.bankDetails = {
        accountNumber,
        ifscCode,
        bankName
      };
    }

    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

// Get all employee payments with filters
export const getEmployeePayments = async (req, res) => {
  try {
    const { status, employeeId, month, year } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (employeeId) {
      filter.employee = employeeId;
    }
    if (month) {
      filter['billingPeriod.month'] = parseInt(month);
    }
    if (year) {
      filter['billingPeriod.year'] = parseInt(year);
    }

    const payments = await EmployeePayment.find(filter)
      .populate('employee', 'username uniqueId mobile')
      .sort({ paymentDate: -1 });

    // Filter out payments with null employee references
    const validPayments = payments.filter(p => p.employee);

    // Calculate summary
    const totalPayroll = validPayments.reduce((sum, p) => sum + p.netPay, 0);
    const paidAmount = validPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.netPay, 0);
    const pendingAmount = validPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.netPay, 0);
    const employeeCount = new Set(validPayments.map(p => p.employee._id.toString())).size;

    res.json({
      success: true,
      data: {
        payments: validPayments,
        summary: {
          totalPayroll,
          paidAmount,
          pendingAmount,
          employeeCount
        }
      }
    });
  } catch (error) {
    console.error('Get employee payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee payments',
      error: error.message
    });
  }
};

// Get payment history for a specific employee
export const getEmployeePaymentHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const payments = await EmployeePayment.find({ employee: employeeId })
      .sort({ paymentDate: -1 });

    // Calculate current month payment
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentMonthPayment = payments.find(
      p => p.billingPeriod.month === currentMonth && p.billingPeriod.year === currentYear
    );

    // Calculate totals
    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.netPay, 0);
    
    const pendingAmount = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.netPay, 0);

    // Get monthly comparison data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      
      const monthPayment = payments.find(
        p => p.billingPeriod.month === month && p.billingPeriod.year === year
      );

      monthlyData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year,
        amount: monthPayment ? monthPayment.netPay : 0
      });
    }

    res.json({
      success: true,
      data: {
        currentMonthPayment: currentMonthPayment ? currentMonthPayment.netPay : 0,
        totalPaid,
        pendingAmount,
        payments,
        monthlyData
      }
    });
  } catch (error) {
    console.error('Get employee payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// Get all employees for dropdown
export const getEmployeesForPayment = async (req, res) => {
  try {
    // Fetch active employees with role 'employee'
    const employees = await User.find({
      role: 'employee',
      isActive: true // Only fetch active employees
    })
      .select('username uniqueId mobile salary role employeeRole')
      .sort({ username: 1 });

    console.log(`Found ${employees.length} active employees for payment dropdown`);
    
    if (employees.length === 0) {
      console.log('No active employees found. Check if employees are marked as active in the database.');
    }

    res.json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// Get payment details by ID
export const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await EmployeePayment.findById(paymentId)
      .populate('employee', 'username uniqueId mobile');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Employee self-service: get own salary/payment history
export const getMyPaymentHistory = async (req, res) => {
  try {
    const employeeId = req.user.id || req.user._id;

    console.log('getMyPaymentHistory called for employee:', employeeId?.toString(), 'role:', req.user.role);

    // Fetch payments and assigned salary structure in parallel
    const [payments, salaryStructure, employeeUser] = await Promise.all([
      EmployeePayment.find({ employee: employeeId }).sort({ paymentDate: -1 }),
      SalaryStructure.findOne({ employee: employeeId, isActive: true }, null, { sort: { effectiveFrom: -1 } }),
      User.findById(employeeId).select('salary employeeRole username')
    ]);

    console.log('Payments found:', payments.length, '| SalaryStructure:', !!salaryStructure, '| User salary:', employeeUser?.salary);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const currentMonthPayment = payments.find(
      p => p.billingPeriod.month === currentMonth && p.billingPeriod.year === currentYear
    );

    const totalPaid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.netPay, 0);

    // Last 6 months trend
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const found = payments.find(p => p.billingPeriod.month === m && p.billingPeriod.year === y);
      monthlyData.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: y,
        amount: found ? found.netPay : 0
      });
    }

    // Build assigned salary info from SalaryStructure or fallback to user.salary
    let assignedSalary = null;
    if (salaryStructure) {
      const totalAllowances = salaryStructure.allowances
        .filter(a => a.isActive)
        .reduce((sum, a) => {
          if (a.calculationMethod === 'percentage') {
            return sum + (salaryStructure.baseSalary * a.percentage) / 100;
          }
          return sum + a.amount;
        }, 0);

      const totalDeductions = salaryStructure.deductions
        .filter(d => d.isActive)
        .reduce((sum, d) => {
          if (d.calculationMethod === 'percentage') {
            return sum + (salaryStructure.baseSalary * d.percentage) / 100;
          }
          return sum + d.amount;
        }, 0);

      assignedSalary = {
        baseSalary: salaryStructure.baseSalary,
        paymentType: salaryStructure.paymentType,
        allowances: salaryStructure.allowances.filter(a => a.isActive),
        deductions: salaryStructure.deductions.filter(d => d.isActive),
        totalAllowances,
        totalDeductions,
        grossSalary: salaryStructure.baseSalary + totalAllowances,
        netSalary: salaryStructure.baseSalary + totalAllowances - totalDeductions,
        effectiveFrom: salaryStructure.effectiveFrom
      };
    } else if (employeeUser?.salary) {
      // Fallback: salary stored directly on user record
      assignedSalary = {
        baseSalary: employeeUser.salary,
        paymentType: 'monthly',
        allowances: [],
        deductions: [],
        totalAllowances: 0,
        totalDeductions: 0,
        grossSalary: employeeUser.salary,
        netSalary: employeeUser.salary,
        effectiveFrom: null
      };
    } else if (payments.length > 0) {
      // Last resort: infer from most recent payment
      const latestPayment = payments[0];
      assignedSalary = {
        baseSalary: latestPayment.baseSalary || latestPayment.netPay,
        paymentType: latestPayment.paymentType || 'monthly',
        allowances: [],
        deductions: [],
        totalAllowances: 0,
        totalDeductions: 0,
        grossSalary: latestPayment.grossSalary || latestPayment.netPay,
        netSalary: latestPayment.netPay,
        effectiveFrom: null
      };
    }

    res.json({
      success: true,
      data: {
        assignedSalary,
        currentMonthPayment: currentMonthPayment ? currentMonthPayment.netPay : 0,
        currentMonthStatus: currentMonthPayment ? currentMonthPayment.status : 'not_paid',
        totalPaid,
        payments: payments.slice(0, 12),
        monthlyData
      }
    });
  } catch (error) {
    console.error('Get my payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salary details',
      error: error.message
    });
  }
};
