const mongoose = require('mongoose');
const config = require('../../config');

const pricingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group', 'channel'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: String,
    enum: config.SHOP.MONTHS,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  setBy: {
    type: Number, // Admin's Telegram ID
    required: true
  },
  setAt: {
    type: Date,
    default: Date.now
  },
  lastUpdatedBy: {
    type: Number // Admin's Telegram ID
  },
  lastUpdatedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for faster queries
pricingSchema.index({ type: 1, year: 1, month: 1 }, { unique: true });

// Methods

// Get price
pricingSchema.statics.getPrice = async function(type, year, month) {
  const pricing = await this.findOne({ type, year, month, isActive: true });
  
  if (pricing) {
    return pricing.price;
  } else {
    // Return default price if no specific pricing is set
    return type === 'group' ? config.SHOP.DEFAULT_PRICING.GROUP : config.SHOP.DEFAULT_PRICING.CHANNEL;
  }
};

// Get all active pricing
pricingSchema.statics.getAllActivePricing = function() {
  return this.find({ isActive: true }).sort({ year: -1, month: 1 });
};

// Get active pricing by type
pricingSchema.statics.getActivePricingByType = function(type) {
  return this.find({ type, isActive: true }).sort({ year: -1, month: 1 });
};

// Set price
pricingSchema.statics.setPrice = async function(type, year, month, price, adminId, notes = '') {
  const pricing = await this.findOne({ type, year, month });
  
  if (pricing) {
    // Update existing pricing
    pricing.price = price;
    pricing.isActive = true;
    pricing.lastUpdatedBy = adminId;
    pricing.lastUpdatedAt = new Date();
    
    if (notes) {
      pricing.notes = pricing.notes 
        ? `${pricing.notes}\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }
    
    return pricing.save();
  } else {
    // Create new pricing
    const newPricing = new this({
      type,
      year,
      month,
      price,
      setBy: adminId,
      lastUpdatedBy: adminId,
      lastUpdatedAt: new Date(),
      notes
    });
    
    return newPricing.save();
  }
};

// Deactivate pricing
pricingSchema.statics.deactivatePrice = async function(type, year, month, adminId) {
  const pricing = await this.findOne({ type, year, month });
  
  if (!pricing) {
    throw new Error('Pricing not found');
  }
  
  pricing.isActive = false;
  pricing.lastUpdatedBy = adminId;
  pricing.lastUpdatedAt = new Date();
  
  return pricing.save();
};

// Create model
const Pricing = mongoose.model('Pricing', pricingSchema);

module.exports = Pricing;