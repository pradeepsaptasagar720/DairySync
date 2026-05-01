import mongoose from 'mongoose';

const repaymentHistorySchema = new mongoose.Schema({
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeePayment'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  }
}, { _id: false });

const advanceRecordSchema = new mongoose.Schema({
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
  
  advanceAmount: {
    type: Number,
    required: true,
    min: 0
  },
  advanceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  
  // Repayment terms
  repaymentType: {
    type: String,
    enum: ['lump_sum', 'installments'],
    required: true
  },
  installmentAmount: {
    type: Number,
    min: 0
  },
  numberOfInstallments: {
    type: Number,
    min: 1
  },
  installmentsRemaining: {
    type: Number,
    min: 0
  },
  
  // Tracking
  amountRepaid: {
    type: Number,
    default: 0,
    min: 0
  },
  outstandingBalance: {
    type: Number,
    required: true,
    min: 0
  },
  
  status: {
    type: String,
    enum: ['active', 'fully_repaid', 'written_off'],
    default: 'active',
    index: true
  },
  
  // Linked payments
  repaymentHistory: [repaymentHistorySchema],
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for employee lookup and status queries
advanceRecordSchema.index({ employee: 1, status: 1 });
advanceRecordSchema.index({ employee: 1, advanceDate: -1 });

// Pre-save hook to initialize outstanding balance
advanceRecordSchema.pre('save', function(next) {
  if (this.isNew) {
    this.outstandingBalance = this.advanceAmount;
    
    // Set installments remaining for installment type
    if (this.repaymentType === 'installments' && this.numberOfInstallments) {
      this.installmentsRemaining = this.numberOfInstallments;
    }
  }
  
  // Validate installment fields
  if (this.repaymentType === 'installments') {
    if (!this.installmentAmount || !this.numberOfInstallments) {
      return next(new Error('Installment amount and number of installments are required for installment repayment type'));
    }
  }
  
  next();
});

const AdvanceRecord = mongoose.model('AdvanceRecord', advanceRecordSchema);

export default AdvanceRecord;
