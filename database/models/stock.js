const mongoose = require('mongoose');
const config = require('../../config');

const stockSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  initialQuantity: {
    type: Number,
    default: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  reserved: {
    type: Number,
    default: 0
  },
  addedBy: {
    type: Number, // Admin's Telegram ID
    required: true
  },
  addedAt: {
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
stockSchema.index({ type: 1, year: 1, month: 1 }, { unique: true });

// Methods

// Get available stock
stockSchema.statics.getAvailableStock = function(type, year, month) {
  return this.findOne({ type, year, month });
};

// Get all stock
stockSchema.statics.getAllStock = function() {
  return this.find().sort({ year: -1, month: 1 });
};

// Get stock by type
stockSchema.statics.getStockByType = function(type) {
  return this.find({ type }).sort({ year: -1, month: 1 });
};

// Get stock stats
stockSchema.statics.getStockStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: '$type',
        totalQuantity: { $sum: '$quantity' },
        totalSold: { $sum: '$sold' },
        totalReserved: { $sum: '$reserved' }
      }
    }
  ]);
};

// Add stock
stockSchema.statics.addStock = async function(type, year, month, quantity, adminId, notes = '') {
  const stock = await this.findOne({ type, year, month });
  
  if (stock) {
    // Update existing stock
    stock.quantity += quantity;
    stock.initialQuantity += quantity;
    stock.lastUpdatedBy = adminId;
    stock.lastUpdatedAt = new Date();
    
    if (notes) {
      stock.notes = stock.notes 
        ? `${stock.notes}\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }
    
    return stock.save();
  } else {
    // Create new stock
    const newStock = new this({
      type,
      year,
      month,
      quantity,
      initialQuantity: quantity,
      addedBy: adminId,
      lastUpdatedBy: adminId,
      lastUpdatedAt: new Date(),
      notes
    });
    
    return newStock.save();
  }
};

// Update stock
stockSchema.statics.updateStock = async function(type, year, month, quantity, adminId, notes = '') {
  const stock = await this.findOne({ type, year, month });
  
  if (!stock) {
    throw new Error('Stock not found');
  }
  
  // Calculate the difference to update initialQuantity
  const difference = quantity - stock.quantity;
  
  stock.quantity = quantity;
  stock.initialQuantity += (difference > 0 ? difference : 0);
  stock.lastUpdatedBy = adminId;
  stock.lastUpdatedAt = new Date();
  
  if (notes) {
    stock.notes = stock.notes 
      ? `${stock.notes}\n[${new Date().toISOString()}] ${notes}`
      : `[${new Date().toISOString()}] ${notes}`;
  }
  
  return stock.save();
};

// Reserve stock
stockSchema.statics.reserveStock = async function(type, year, month, quantity) {
  const stock = await this.findOne({ type, year, month });
  
  if (!stock) {
    throw new Error('Stock not found');
  }
  
  if (stock.quantity < quantity) {
    throw new Error('Not enough stock');
  }
  
  stock.quantity -= quantity;
  stock.reserved += quantity;
  
  return stock.save();
};

// Confirm reserved stock (mark as sold)
stockSchema.statics.confirmReservedStock = async function(type, year, month, quantity) {
  const stock = await this.findOne({ type, year, month });
  
  if (!stock) {
    throw new Error('Stock not found');
  }
  
  if (stock.reserved < quantity) {
    throw new Error('Not enough reserved stock');
  }
  
  stock.reserved -= quantity;
  stock.sold += quantity;
  
  return stock.save();
};

// Return reserved stock
stockSchema.statics.returnReservedStock = async function(type, year, month, quantity) {
  const stock = await this.findOne({ type, year, month });
  
  if (!stock) {
    throw new Error('Stock not found');
  }
  
  if (stock.reserved < quantity) {
    throw new Error('Not enough reserved stock');
  }
  
  stock.reserved -= quantity;
  stock.quantity += quantity;
  
  return stock.save();
};

// Create model
const Stock = mongoose.model('Stock', stockSchema);

module.exports = Stock;