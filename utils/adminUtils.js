/**
 * Utility functions for admin operations
 */
const User = require('../database/models/user');
const Order = require('../database/models/order');
const Transaction = require('../database/models/transaction');
const Stock = require('../database/models/stock');
const Pricing = require('../database/models/pricing');
const config = require('../config');
const fs = require('fs');
const path = require('path');

/**
 * Check if user is an admin
 * @param {number} telegramId - Telegram ID of the user
 * @returns {boolean} - True if user is admin
 */
async function isAdmin(telegramId) {
  return config.ADMIN_IDS.includes(telegramId);
}

/**
 * Send notification to all admins
 * @param {Object} bot - Telegram bot instance
 * @param {string} message - Message to send
 * @param {Object} extra - Extra parameters for message
 */
async function notifyAdmins(bot, message, extra = {}) {
  for (const adminId of config.ADMIN_IDS) {
    try {
      await bot.telegram.sendMessage(adminId, message, extra);
    } catch (error) {
      console.error(`Error notifying admin ${adminId}:`, error);
    }
  }
}

/**
 * Log admin action to file
 * @param {number} adminId - Admin's Telegram ID
 * @param {string} action - Action performed
 * @param {Object} details - Additional details
 */
function logAdminAction(adminId, action, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    adminId,
    action,
    details
  };
  
  const logDir = path.join(__dirname, '../logs');
  const logFile = path.join(logDir, 'admin_actions.log');
  
  // Create log directory if it doesn't exist
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const logLine = JSON.stringify(logEntry) + '\n';
  
  fs .appendFileSync(logFile, logLine, 'utf8');
}

/**
 * Get all users from the database
 * @returns {Promise<Array>} - List of users
 */
async function getAllUsers() {
  return await User.find({});
}

/**
 * Get all orders from the database
 * @returns {Promise<Array>} - List of orders
 */
async function getAllOrders() {
  return await Order.find({});
}

/**
 * Get all transactions from the database
 * @returns {Promise<Array>} - List of transactions
 */
async function getAllTransactions() {
  return await Transaction.find({});
}

/**
 * Get stock information from the database
 * @returns {Promise<Array>} - List of stock items
 */
async function getStockInfo() {
  return await Stock.find({});
}

/**
 * Update pricing information in the database
 * @param {string} productId - ID of the product
 * @param {number} newPrice - New price to set
 * @returns {Promise<void>}
 */
async function updatePricing(productId, newPrice) {
  await Pricing.updateOne({ productId }, { price: newPrice });
}

module.exports = {
  isAdmin,
  notifyAdmins,
  logAdminAction,
  getAllUsers,
  getAllOrders,
  getAllTransactions,
  getStockInfo,
  updatePricing
};