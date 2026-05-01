import mongoose from "mongoose";

const loanHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  transactionType: {
    type: String,
    enum: ["loan_approved", "partial_payment", "full_payment", "loan_cleared", "loan_closed"],
    required: true
  },
  previousDue: {
    type: Number,
    required: true,
    min: 0
  },
  transactionAmount: {
    type: Number,
    required: true
  },
  currentDue: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMode: {
    type: String,
    enum: ["cash", "bank_transfer", "cheque", "upi", "other"],
    required: function() {
      return this.transactionType === "partial_payment" || this.transactionType === "full_payment";
    }
  },
  notes: {
    type: String,
    trim: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { _id: true });

const loanSchema = new mongoose.Schema(
  {
    // Farmer identification (primary)
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Loan request details (from farmer)
    requestedAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    purpose: {
      type: String,
      required: true,
      trim: true,
    },

    requestDate: {
      type: Date,
      default: Date.now,
      required: true
    },

    // Loan approval details (by employee)
    approvedAmount: {
      type: Number,
      min: 0,
      default: null
    },

    approvalDate: {
      type: Date,
      default: null
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Loan lifecycle status
    status: {
      type: String,
      enum: ["requested", "approved", "partially_paid", "fully_cleared", "closed"],
      default: "requested",
      required: true
    },

    // Payment tracking
    totalReturned: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Clearance details
    clearanceDate: {
      type: Date,
      default: null
    },

    clearedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Closure details
    closureDate: {
      type: Date,
      default: null
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // Transaction history (audit trail)
    history: [loanHistorySchema],

    // General notes
    notes: {
      type: String,
      trim: true,
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if loan can be cleared
loanSchema.virtual('canBeClearedNow').get(function() {
  return this.status === 'fully_cleared' && this.totalDue === 0;
});

// Virtual for checking if loan is active
loanSchema.virtual('isActive').get(function() {
  return ['approved', 'partially_paid'].includes(this.status);
});

// Indexes for efficient queries
loanSchema.index({ farmer: 1, status: 1 });
loanSchema.index({ approvedBy: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ requestDate: -1 });
loanSchema.index({ approvalDate: -1 });
loanSchema.index({ "farmer": 1, "requestDate": -1 });

// Pre-save middleware for business logic
loanSchema.pre('save', function(next) {
  // Calculate total due when approved amount or total returned changes
  if (this.isModified('approvedAmount') || this.isModified('totalReturned')) {
    if (this.approvedAmount !== null) {
      this.totalDue = Math.max(0, this.approvedAmount - this.totalReturned);
    }
  }

  // Auto-update status based on payment
  if (this.isModified('totalDue') && this.status !== 'closed') {
    if (this.totalDue === 0 && this.approvedAmount > 0 && this.totalReturned >= this.approvedAmount) {
      this.status = 'fully_cleared';
    } else if (this.totalDue > 0 && this.totalReturned > 0 && this.status !== 'partially_paid') {
      this.status = 'partially_paid';
    }
  }

  next();
});

// Static methods for business operations
loanSchema.statics.approveLoan = async function(loanId, approvedAmount, approvedBy) {
  const loan = await this.findById(loanId);
  if (!loan || loan.status !== 'requested') {
    throw new Error('Loan cannot be approved');
  }

  loan.approvedAmount = approvedAmount;
  loan.approvalDate = new Date();
  loan.approvedBy = approvedBy;
  loan.status = 'approved';
  loan.totalDue = approvedAmount;

  // Add history entry
  loan.history.push({
    transactionType: 'loan_approved',
    previousDue: 0,
    transactionAmount: approvedAmount,
    currentDue: approvedAmount,
    processedBy: approvedBy,
    notes: `Loan approved for ₹${approvedAmount.toLocaleString()}`
  });

  return await loan.save();
};

loanSchema.statics.addPayment = async function(loanId, paymentAmount, paymentMode, processedBy, notes = '') {
  const loan = await this.findById(loanId);
  if (!loan || !['approved', 'partially_paid'].includes(loan.status)) {
    throw new Error('Payment cannot be added to this loan');
  }

  if (paymentAmount <= 0 || paymentAmount > loan.totalDue) {
    throw new Error('Invalid payment amount');
  }

  const previousDue = loan.totalDue;
  loan.totalReturned += paymentAmount;
  loan.totalDue = Math.max(0, loan.approvedAmount - loan.totalReturned);

  const transactionType = loan.totalDue === 0 ? 'full_payment' : 'partial_payment';

  // Add history entry
  loan.history.push({
    transactionType,
    previousDue,
    transactionAmount: -paymentAmount, // Negative for payment
    currentDue: loan.totalDue,
    paymentMode,
    processedBy,
    notes: notes || `Payment of ₹${paymentAmount.toLocaleString()} received`
  });

  return await loan.save();
};

loanSchema.statics.clearLoan = async function(loanId, clearedBy) {
  const loan = await this.findById(loanId);
  if (!loan || loan.status !== 'fully_cleared' || loan.totalDue !== 0) {
    throw new Error('Loan cannot be cleared');
  }

  loan.clearanceDate = new Date();
  loan.clearedBy = clearedBy;

  // Add history entry
  loan.history.push({
    transactionType: 'loan_cleared',
    previousDue: 0,
    transactionAmount: 0,
    currentDue: 0,
    processedBy: clearedBy,
    notes: 'Loan cleared - all payments completed'
  });

  return await loan.save();
};

export default mongoose.model("Loan", loanSchema);