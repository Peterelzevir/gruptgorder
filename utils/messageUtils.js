/**
 * Utility functions for handling messages
 */
const config = require('../config');

/**
 * Format a price with currency symbol
 * @param {number} price - The price to format
 * @param {string} currency - The currency (default: USDT)
 * @returns {string} - Formatted price string
 */
function formatPrice(price, currency = 'USDT') {
  return `${price} ${currency}`;
}

/**
 * Format a date in a readable format
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Truncate text to a certain length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format order status for display
 * @param {string} status - The order status
 * @param {object} ctx - Telegram context
 * @returns {string} - Formatted status string
 */
function formatOrderStatus(status, ctx) {
  switch (status) {
    case 'pending':
      return ctx.i18n.t('status_pending');
    case 'processing':
      return ctx.i18n.t('status_processing');
    case 'completed':
      return ctx.i18n.t('status_completed');
    case 'cancelled':
      return ctx.i18n.t('status_cancelled');
    case 'refunded':
      return ctx.i18n.t('status_refunded');
    default:
      return status;
  }
}

/**
 * Format transaction type for display
 * @param {string} type - The transaction type
 * @param {object} ctx - Telegram context
 * @returns {string} - Formatted type string
 */
function formatTransactionType(type, ctx) {
  switch (type) {
    case 'deposit':
      return ctx.i18n.t('transaction_deposit');
    case 'purchase':
      return ctx.i18n.t('transaction_purchase');
    case 'refund':
      return ctx.i18n.t('transaction_refund');
    case 'admin_adjustment':
      return ctx.i18n.t('transaction_adjustment');
    default:
      return type;
  }
}

/**
 * Format transaction status for display
 * @param {string} status - The transaction status
 * @param {object} ctx - Telegram context
 * @returns {string} - Formatted status string
 */
function formatTransactionStatus(status, ctx) {
  switch (status) {
    case 'pending':
      return ctx.i18n.t('transaction_pending');
    case 'completed':
      return ctx.i18n.t('transaction_completed');
    case 'cancelled':
      return ctx.i18n.t('transaction_cancelled');
    case 'rejected':
      return ctx.i18n.t('transaction_rejected');
    default:
      return status;
  }
}

/**
 * Get product type display text
 * @param {string} type - The product type (group/channel)
 * @param {object} ctx - Telegram context
 * @returns {string} - Formatted product type
 */
function getProductTypeText(type, ctx) {
  return type === 'group' ? ctx.i18n.t('group') : ctx.i18n.t('channel');
}

/**
 * Get month name in user's language
 * @param {string} month - Month name in English
 * @param {object} ctx - Telegram context
 * @returns {string} - Translated month name
 */
function getMonthName(month, ctx) {
  return ctx.i18n.t(`month_${month.toLowerCase()}`);
}

/**
 * Escape markdown characters in text
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeMarkdown(text) {
  if (!text) return '';
  
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\$/g, '\\$')
    .replace(/\$/g, '\\$')
    .replace(/\$/g, '\\$')
    .replace(/\$/g, '\\$')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Format error message for logging
 * @param {Error} error - The error object
 * @param {string} context - Context where the error occurred
 * @returns {string} - Formatted error message
 */
function formatErrorMessage(error, context = '') {
  return `Error ${context ? 'in ' + context : ''}: ${error.message}\nStack: ${error.stack}`;
}

/**
 * Split long message into multiple messages
 * @param {string} text - Long text to split
 * @param {number} maxLength - Maximum message length
 * @returns {Array<string>} - Array of message parts
 */
function splitLongMessage(text, maxLength = 4000) {
  if (!text || text.length <= maxLength) {
    return [text];
  }
  
  const parts = [];
  let currentPart = '';
  
  // Split by newlines first to preserve formatting
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentPart.length + line.length + 1 <= maxLength) {
      currentPart += (currentPart ? '\n' : '') + line;
    } else {
      parts.push(currentPart);
      currentPart = line;
    }
  }
  
  if (currentPart) {
    parts.push(currentPart);
  }
  
  return parts;
}

module.exports = {
  formatPrice,
  formatDate,
  truncateText,
  formatOrderStatus,
  formatTransactionType,
  formatTransactionStatus,
  getProductTypeText,
  getMonthName,
  escapeMarkdown,
  formatErrorMessage,
  splitLongMessage
};