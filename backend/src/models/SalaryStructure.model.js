import mongoose from 'mongoose';

const allowanceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['HRA', 'DA', 'TA', 'Medical', 'Custom'],
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
  },
  calculationMethod: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PF', 'ESI', 'TDS', 'Professional_Tax', 'Custom'],
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
  },
  calculationMethod: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const salaryStructureSchema = new mongoose.Schema({
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
  
  // For daily/hourly workers
  dailyRate: {
    type: Number,
    min: 0
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  overtimeRate: {
    type: Number,
    min: 0
  },
  
  // Allowances
  allowances: [allowanceSchema],
  
  // Deductions
  deductions: [deductionSchema],
  
  effectiveFrom: {
    type: Date,
    required: true,
    index: true
  },
  effectiveTo: {
    type: Date,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for employee lookup with date range queries
salaryStructureSchema.index({ employee: 1, effectiveFrom: -1 });
salaryStructureSchema.index({ employee: 1, isActive: 1 });

// Pre-save validation hook
salaryStructureSchema.pre('save', function(next) {
  // Validate payment type specific fields
  if (this.paymentType === 'daily' && !this.dailyRate) {
    return next(new Error('Daily rate is required for daily payment type'));
  }
  
  if (this.paymentType === 'hourly' && !this.hourlyRate) {
    return next(new Error('Hourly rate is required for hourly payment type'));
  }
  
  // Validate allowances
  for (const allowance of this.allowances) {
    if (allowance.calculationMethod === 'percentage' && !allowance.percentage) {
      return next(new Error(`Percentage is required for ${allowance.name} allowance`));
    }
    if (allowance.calculationMethod === 'fixed' && allowance.amount <= 0) {
      return next(new Error(`Amount must be greater than 0 for ${allowance.name} allowance`));
    }
  }
  
  // Validate deductions
  for (const deduction of this.deductions) {
    if (deduction.calculationMethod === 'percentage' && !deduction.percentage) {
      return next(new Error(`Percentage is required for ${deduction.name} deduction`));
    }
    if (deduction.calculationMethod === 'fixed' && deduction.amount <= 0) {
      return next(new Error(`Amount must be greater than 0 for ${deduction.name} deduction`));
    }
  }
  
  // Validate date range
  if (this.effectiveTo && this.effectiveFrom > this.effectiveTo) {
    return next(new Error('Effective from date must be before effective to date'));
  }
  
  next();
});

const SalaryStructure = mongoose.model('SalaryStructure', salaryStructureSchema);

export default SalaryStructure;
