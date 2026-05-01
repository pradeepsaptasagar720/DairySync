const mongoose = require('mongoose');

const tdsSlabSchema = new mongoose.Schema({
  minIncome: {
    type: Number,
    required: true,
    min: 0
  },
  maxIncome: {
    type: Number,
    required: true
  },
  taxRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  fixedAmount: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const professionalTaxSlabSchema = new mongoose.Schema({
  minSalary: {
    type: Number,
    required: true,
    min: 0
  },
  maxSalary: {
    type: Number,
    required: true
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const taxConfigSchema = new mongoose.Schema({
  configName: {
    type: String,
    required: true
  },
  financialYear: {
    type: String,
    required: true
  },
  
  // TDS slabs
  tdsSlabs: [tdsSlabSchema],
  
  // Statutory rates
  pfRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 12
  },
  esiRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0.75
  },
  esiThreshold: {
    type: Number,
    required: true,
    min: 0,
    default: 21000
  },
  professionalTaxSlabs: [professionalTaxSlabSchema],
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  effectiveFrom: {
    type: Date,
    required: true
  },
  effectiveTo: Date,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for active configuration lookup
taxConfigSchema.index({ isActive: 1, effectiveFrom: -1 });

// Pre-save validation hook
taxConfigSchema.pre('save', function(next) {
  // Validate TDS slabs
  for (let i = 0; i < this.tdsSlabs.length; i++) {
    const slab = this.tdsSlabs[i];
    if (slab.minIncome >= slab.maxIncome) {
      return next(new Error(`TDS slab ${i + 1}: minIncome must be less than maxIncome`));
    }
  }
  
  // Validate Professional Tax slabs
  for (let i = 0; i < this.professionalTaxSlabs.length; i++) {
    const slab = this.professionalTaxSlabs[i];
    if (slab.minSalary >= slab.maxSalary) {
      return next(new Error(`Professional Tax slab ${i + 1}: minSalary must be less than maxSalary`));
    }
  }
  
  // Validate date range
  if (this.effectiveTo && this.effectiveFrom > this.effectiveTo) {
    return next(new Error('Effective from date must be before effective to date'));
  }
  
  next();
});

const TaxConfig = mongoose.model('TaxConfig', taxConfigSchema);

module.exports = TaxConfig;
