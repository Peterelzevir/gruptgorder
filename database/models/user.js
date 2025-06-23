const mongoose = require('mongoose');
const config = require('../../config');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true
  },
  username: {
    type: String,
    sparse: true
  },
  firstName: String,
  lastName: String,
  language: {
    type: String,
    enum: Object.keys(config.LANGUAGES),
    default: config.DEFAULT_LANGUAGE
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    totalDeposited: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    }
  },
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'purchase', 'refund', 'admin_adjustment'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rejected'],
      default: 'pending'
    },
    relatedOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    reference: String // Transaction reference or admin notes
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  joinedChannels: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  supportChat: {
    active: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    lastMessageAt: Date
  }
}, {
  timestamps: true
});

// Methods

// Update user's wallet balance
userSchema.methods.updateBalance = async function(amount, type, description = '', reference = '', orderId = null) {
  // Add transaction record
  this.transactions.push({
    type,
    amount,
    description,
    status: 'completed',
    relatedOrderId: orderId,
    reference
  });

  // Update balance and totals
  if (type === 'deposit') {
    this.wallet.balance += amount;
    this.wallet.totalDeposited += amount;
  } else if (type === 'purchase') {
    this.wallet.balance -= amount;
    this.wallet.totalSpent += amount;
  } else if (type === 'refund') {
    this.wallet.balance += amount;
    this.wallet.totalSpent -= amount;
  } else if (type === 'admin_adjustment') {
    this.wallet.balance += amount; // Can be positive or negative
  }

  // Save and return the updated user
  return this.save();
};

// Check if user has enough balance for a purchase
userSchema.methods.hasEnoughBalance = function(amount) {
  return this.wallet.balance >= amount;
};

// Create a pending deposit transaction
userSchema.methods.createPendingDeposit = async function(amount, description = '') {
  this.transactions.push({
    type: 'deposit',
    amount,
    description,
    status: 'pending'
  });
  
  return this.save();
};

// Approve a pending deposit
userSchema.methods.approveDeposit = async function(transactionId) {
  const transaction = this.transactions.id(transactionId);
  
  if (!transaction || transaction.type !== 'deposit' || transaction.status !== 'pending') {
    throw new Error('Invalid transaction or transaction already processed');
  }
  
  transaction.status = 'completed';
  this.wallet.balance += transaction.amount;
  this.wallet.totalDeposited += transaction.amount;
  
  return this.save();
};

// Reject a pending deposit
userSchema.methods.rejectDeposit = async function(transactionId, reason = '') {
  const transaction = this.transactions.id(transactionId);
  
  if (!transaction || transaction.type !== 'deposit' || transaction.status !== 'pending') {
    throw new Error('Invalid transaction or transaction already processed');
  }
  
  transaction.status = 'rejected';
  transaction.description += ` | Rejected: ${reason}`;
  
  return this.save();
};

// Find user by Telegram ID
userSchema.statics.findByTelegramId = function(telegramId) {
  return this.findOne({ telegramId });
};

// Find or create user
userSchema.statics.findOrCreate = async function(userData) {
  let user = await this.findOne({ telegramId: userData.telegramId });
  
  if (!user) {
    // Check if this is an admin
    const isAdmin = config.ADMIN_IDS.includes(userData.telegramId);
    
    user = new this({
      ...userData,
      isAdmin
    });
    
    await user.save();
  }
  
  return user;
};

// Create model
const User = mongoose.model('User', userSchema);

module.exports = User;