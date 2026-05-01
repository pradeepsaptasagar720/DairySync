const mongoose = require('mongoose');

const paymentAuditSchema = new mongoose.Schema({
  operationType: {
    type: String,
    enum: ['create', 'update', 'delete', 'approve', 'reject', 'complete', 'fail'],
    required: true,
    index: true
  },
  entityType: {
    type: String,
    enum: ['payment', 'salary_structure', 'advance', 'bulk_payment'],
    required: true,
    index: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  performedByName: {
    type: String,
    required: true
  },
  performedByRole: {
    type: String,
    required: true
  },
  
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  previousState: {
    type: mongoose.Schema.Types.Mixed
  },
  newState: {
    type: mongoose.Schema.Types.Mixed
  },
  
  ipAddress: String,
  userAgent: String,
  
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
paymentAuditSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
paymentAuditSchema.index({ performedBy: 1, timestamp: -1 });
paymentAuditSchema.index({ operationType: 1, timestamp: -1 });

const PaymentAudit = mongoose.model('PaymentAudit', paymentAuditSchema);

module.exports = PaymentAudit;
