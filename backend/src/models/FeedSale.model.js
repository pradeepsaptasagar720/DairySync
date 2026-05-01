import mongoose from 'mongoose';

const feedSaleSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmerName: {
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
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'upi', 'credit', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'partial'],
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient date-range queries
feedSaleSchema.index({ saleDate: 1 });
feedSaleSchema.index({ farmer: 1 });
feedSaleSchema.index({ paymentStatus: 1 });
feedSaleSchema.index({ createdAt: 1 });

const FeedSale = mongoose.model('FeedSale', feedSaleSchema);

export default FeedSale;
