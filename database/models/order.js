const mongoose = require('mongoose');
const config = require('../../config');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  telegramId: {
    type: Number,
    required: true
  },
  orderType: {
    type: String,
    enum: ['group', 'channel'],
    required: true
  },
  month: {
    type: String,
    enum: config.SHOP.MONTHS,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  targetUsername: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'refunded', 'partially_refunded'],
    default: 'paid'
  },
  adminNotes: String,
  completedAt: Date,
  cancelledAt: Date,
  refundedAt: Date,
  refundAmount: Number,
  refundReason: String
}, {
  timestamps: true
});

// Methods

// Update order status
orderSchema.methods.updateStatus = async function(newStatus, notes = '') {
  this.status = newStatus;
  
  if (notes) {
    this.adminNotes = this.adminNotes 
      ? `${this.adminNotes}\n[${new Date().toISOString()}] ${notes}`
      : `[${new Date().toISOString()}] ${notes}`;
  }
  
  // Update timestamps based on status
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  } else if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
  } else if (newStatus === 'refunded') {
    this.refundedAt = new Date();
  }
  
  return this.save();
};

// Process refund
orderSchema.methods.processRefund = async function(amount, reason = '') {
  // Check if amount is valid
  if (amount <= 0 || amount > this.totalPrice) {
    throw new Error('Invalid refund amount');
  }
  
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  
  // Update payment status
  if (amount === this.totalPrice) {
    this.paymentStatus = 'refunded';
    this.status = 'refunded';
  } else {
    this.paymentStatus = 'partially_refunded';
  }
  
  return this.save();
};

// Get user's orders
orderSchema.statics.getUserOrders = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Get recent orders
orderSchema.statics.getRecentOrders = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'telegramId username');
};

// Get orders count by type
orderSchema.statics.getOrdersCountByType = async function() {
  const result = await this.aggregate([
    { $group: { _id: '$orderType', count: { $sum: 1 } } }
  ]);
  
  // Convert to easier format
  const counts = { group: 0, channel: 0 };
  result.forEach(item => {
    counts[item._id] = item.count;
  });
  
  return counts;
};

// Get orders count by month and year
orderSchema.statics.getOrdersCountByMonthYear = async function() {
  return this.aggregate([
    { 
      $group: { 
        _id: { month: '$month', year: '$year', type: '$orderType' }, 
        count: { $sum: 1 },
        quantity: { $sum: '$quantity' }
      } 
    },
    { $sort: { '_id.year': -1, '_id.month': 1 } }
  ]);
};

// Create a new order
orderSchema.statics.createOrder = async function(orderData) {
  const totalPrice = orderData.pricePerUnit * orderData.quantity;
  
  const order = new this({
    ...orderData,
    totalPrice
  });
  
  return order.save();
};

// Create model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;