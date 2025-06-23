const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  telegramId: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'purchase', 'refund', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: String,
  reference: String, // Transaction reference or admin notes
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });

// Methods

// Create a new transaction
transactionSchema.statics.createTransaction = async function(userId, telegramId, type, amount, balanceBefore, balanceAfter, orderId = null, description = '', reference = '') {
  const transaction = new this({
    userId,
    telegramId,
    type,
    amount,
    balanceBefore,
    balanceAfter,
    orderId,
    description,
    reference
  });
  
  return transaction.save();
};

// Get user's transactions
transactionSchema.statics.getUserTransactions = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

// Get recent transactions
transactionSchema.statics.getRecentTransactions = function(limit = 10) {
  return this.find().sort({ createdAt: -1 }).limit(limit).populate('userId', 'telegramId username');
};

// Create model
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
