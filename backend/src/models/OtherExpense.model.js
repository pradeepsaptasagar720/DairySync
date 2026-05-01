import mongoose from 'mongoose';

const otherExpenseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['utilities', 'maintenance', 'supplies', 'transport', 'equipment', 'other'],
    default: 'other'
  },
  vendor: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  invoiceNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient date-range queries
otherExpenseSchema.index({ paymentDate: 1 });
otherExpenseSchema.index({ dueDate: 1 });
otherExpenseSchema.index({ status: 1 });
otherExpenseSchema.index({ createdAt: 1 });

const OtherExpense = mongoose.model('OtherExpense', otherExpenseSchema);

export default OtherExpense;
