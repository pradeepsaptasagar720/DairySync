import mongoose from 'mongoose';

const billingPeriodSchema = new mongoose.Schema({
  dateFrom: {
    type: Date,
    required: true
  },
  dateTo: {
    type: Date,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  }
}, { _id: false });

const allowanceItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const deductionItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const bonusItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
  accountNumber: String,
  ifscCode: String,
  bankName: String
}, { _id: false });

const employeePaymentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  employeeName: {
    type: String,
    required: true
  },
  employeeUniqueId: {
    type: String,
    required: true
  },
  employeeMobile: {
    type: String
  },
  
  // Payment period
  billingPeriod: {
    type: billingPeriodSchema,
    required: true
  },
  
  // Salary calculation
  salaryStructure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryStructure'
  },
  paymentType: {
    type: String,
    enum: ['monthly', 'daily', 'hourly'],
    required: true
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Attendance data (for daily/hourly)
  daysWorked: {
    type: Number,
    min: 0
  },
  hoursWorked: {
    type: Number,
    min: 0
  },
  overtimeHours: {
    type: Number,
    min: 0,
    default: 0
  },
  unpaidLeaveDays: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Allowances breakdown
  allowances: [allowanceItemSchema],
  totalAllowances: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Deductions breakdown
  deductions: [deductionItemSchema],
  totalDeductions: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Advance/Loan deductions
  advanceDeduction: {
    type: Number,
    default: 0,
    min: 0
  },
  loanDeduction: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Bonus/Incentive
  bonuses: [bonusItemSchema],
  totalBonuses: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Calculated amounts
  grossSalary: {
    type: Number,
    required: true,
    min: 0
  },
  netPay: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment details
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'upi', 'cheque'],
    required: true
  },
  paymentDate: {
    type: Date,
    index: true
  },
  paymentReference: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Bank details (for bank transfer)
  bankDetails: bankDetailsSchema,
  
  // Cheque details
  chequeNumber: String,
  chequeDate: Date,
  
  // UPI details
  upiId: String,
  upiTransactionId: String,
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'pending_approval'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  completedAt: Date,
  failureReason: String,
  
  // Salary slip
  salarySlipGenerated: {
    type: Boolean,
    default: false
  },
  salarySlipPath: String,
  salarySlipSentAt: Date,
  
  // Processing details
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  
  // Audit
  isPartialPayment: {
    type: Boolean,
    default: false
  },
  partialPaymentReason: String
}, {
  timestamps: true
});

// Unique index on employee + billing period to prevent duplicates
employeePaymentSchema.index({ employee: 1, 'billingPeriod.month': 1, 'billingPeriod.year': 1 }, { unique: true });

// Additional indexes for queries
employeePaymentSchema.index({ status: 1, paymentDate: -1 });
employeePaymentSchema.index({ employee: 1, paymentDate: -1 });
employeePaymentSchema.index({ paymentReference: 1 });

// Pre-save hook to generate payment reference
employeePaymentSchema.pre('save', function(next) {
  if (this.isNew && !this.paymentReference) {
    const date = this.paymentDate || new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.paymentReference = `EP${dateStr}${randomNum}`;
  }
  next();
});

const EmployeePayment = mongoose.model('EmployeePayment', employeePaymentSchema);

export default EmployeePayment;
