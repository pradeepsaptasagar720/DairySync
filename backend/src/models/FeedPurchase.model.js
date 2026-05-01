import mongoose from 'mongoose';

const feedPurchaseSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeName: {
    type: String,
    required: true,
    trim: true
  },
  vendor: {
    type: String,
    required: true,
    trim: true
  },
  feedType: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
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
feedPurchaseSchema.index({ purchaseDate: 1 });
feedPurchaseSchema.index({ employee: 1 });
feedPurchaseSchema.index({ paymentStatus: 1 });
feedPurchaseSchema.index({ createdAt: 1 });

const FeedPurchase = mongoose.model('FeedPurchase', feedPurchaseSchema);

export default FeedPurchase;
