const mongoose = require('mongoose');

const salarySlipSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmployeePayment',
    required: true,
    index: true
  },
  
  slipNumber: {
    type: String,
    unique: true,
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
  },
  
  filePath: {
    type: String,
    required: true
  },
  fileUrl: String,
  
  generatedAt: {
    type: Date,
    default: Date.now
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  emailTo: String,
  
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastDownloadedAt: Date
}, {
  timestamps: true
});

// Indexes for employee and payment lookup
salarySlipSchema.index({ employee: 1, month: 1, year: 1 });
salarySlipSchema.index({ payment: 1 });

// Pre-save hook to generate slip number
salarySlipSchema.pre('save', function(next) {
  if (this.isNew && !this.slipNumber) {
    const yearStr = this.year.toString();
    const monthStr = this.month.toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.slipNumber = `SS${yearStr}${monthStr}${randomNum}`;
  }
  next();
});

const SalarySlip = mongoose.model('SalarySlip', salarySlipSchema);

module.exports = SalarySlip;
