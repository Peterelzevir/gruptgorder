const mongoose = require('mongoose');
const config = require('../../config');

const catalogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['group', 'channel'],
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availableMonths: [{
    month: {
      type: String,
      enum: config.SHOP.MONTHS
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
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
  lastUpdatedAt: Date
}, {
  timestamps: true
});

// Indexes for faster queries
catalogSchema.index({ type: 1, year: 1 }, { unique: true });

// Methods

// Get all active catalogs
catalogSchema.statics.getActiveCatalogs = function() {
  return this.find({ isActive: true }).sort({ year: -1 });
};

// Get active catalogs by type
catalogSchema.statics.getActiveCatalogsByType = function(type) {
  return this.find({ type, isActive: true }).sort({ year: -1 });
};

// Get available years for a type
catalogSchema.statics.getAvailableYears = async function(type) {
  const catalogs = await this.find({ type, isActive: true }).sort({ year: -1 });
  return catalogs.map(catalog => catalog.year);
};

// Get available months for a type and year
catalogSchema.statics.getAvailableMonths = async function(type, year) {
  const catalog = await this.findOne({ type, year, isActive: true });
  if (!catalog) return [];
  
  return catalog.availableMonths
    .filter(m => m.isActive)
    .map(m => m.month);
};

// Add a new catalog
catalogSchema.statics.addCatalog = async function(type, year, months, adminId) {
  const availableMonths = months.map(month => ({ month, isActive: true }));
  
  const catalog = new this({
    type,
    year,
    availableMonths,
    addedBy: adminId,
    lastUpdatedBy: adminId,
    lastUpdatedAt: new Date()
  });
  
  return catalog.save();
};

// Update a catalog
catalogSchema.statics.updateCatalog = async function(type, year, months, adminId) {
  const catalog = await this.findOne({ type, year });
  
  if (!catalog) {
    throw new Error('Catalog not found');
  }
  
  // Update available months
  if (months && months.length > 0) {
    // Create a map of existing months for quick lookup
    const existingMonths = {};
    catalog.availableMonths.forEach(m => {
      existingMonths[m.month] = m;
    });
    
    // Update months
    const updatedMonths = [];
    months.forEach(month => {
      if (existingMonths[month]) {
        // If month exists, keep it and ensure it's active
        existingMonths[month].isActive = true;
        updatedMonths.push(existingMonths[month]);
      } else {
        // If month doesn't exist, add it
        updatedMonths.push({ month, isActive: true });
      }
    });
    
    // Add any remaining months as inactive
    Object.values(existingMonths).forEach(m => {
      if (!months.includes(m.month)) {
        m.isActive = false;
        updatedMonths.push(m);
      }
    });
    
    catalog.availableMonths = updatedMonths;
  }
  
  catalog.lastUpdatedBy = adminId;
  catalog.lastUpdatedAt = new Date();
  
  return catalog.save();
};

// Deactivate a catalog
catalogSchema.statics.deactivateCatalog = async function(type, year, adminId) {
  const catalog = await this.findOne({ type, year });
  
  if (!catalog) {
    throw new Error('Catalog not found');
  }
  
  catalog.isActive = false;
  catalog.lastUpdatedBy = adminId;
  catalog.lastUpdatedAt = new Date();
  
  return catalog.save();
};

// Create model
const Catalog = mongoose.model('Catalog', catalogSchema);

module.exports = Catalog;