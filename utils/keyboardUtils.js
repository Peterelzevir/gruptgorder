/**
 * Utility functions for handling keyboards
 */
const { Markup } = require('telegraf');

/**
 * Generate a keyboard with items in multiple columns
 * @param {Array} items - Array of items to put in keyboard
 * @param {number} columns - Number of columns
 * @param {Function} buttonTextFn - Function to get button text
 * @param {Function} buttonDataFn - Function to get button callback data
 * @returns {Array} - Keyboard array
 */
function generateGridKeyboard(items, columns, buttonTextFn, buttonDataFn) {
  const keyboard = [];
  let row = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    row.push(Markup.button.callback(buttonTextFn(item), buttonDataFn(item)));
    
    if ((i + 1) % columns === 0 || i === items.length - 1) {
      keyboard.push(row);
      row = [];
    }
  }
  
  return keyboard;
}

/**
 * Generate a paginated keyboard
 * @param {Array} items - Array of items to paginate
 * @param {number} page - Current page (0-based)
 * @param {number} itemsPerPage - Items per page
 * @param {Function} buttonTextFn - Function to get button text
 * @param {Function} buttonDataFn - Function to get button callback data
 * @param {string} prevPageData - Callback data for previous page
 * @param {string} nextPageData - Callback data for next page
 * @param {string} backData - Callback data for back button
 * @returns {Object} - Markup keyboard
 */
function generatePaginatedKeyboard(
  items,
  page,
  itemsPerPage,
  buttonTextFn,
  buttonDataFn,
  prevPageData,
  nextPageData,
  backData
) {
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIdx = page * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, items.length);
  const pageItems = items.slice(startIdx, endIdx);
  
  // Generate buttons for current page items
  const itemButtons = generateGridKeyboard(pageItems, 1, buttonTextFn, buttonDataFn);
  
  // Add navigation buttons
  const navigationRow = [];
  
  if (page > 0) {
    navigationRow.push(Markup.button.callback('⬅️', `${prevPageData}_${page - 1}`));
  }
  
  navigationRow.push(Markup.button.callback(`${page + 1}/${totalPages}`, 'noop'));
  
  if (page < totalPages - 1) {
    navigationRow.push(Markup.button.callback('➡️', `${nextPageData}_${page + 1}`));
  }
  
  itemButtons.push(navigationRow);
  
  // Add back button
  itemButtons.push([Markup.button.callback('↩️ Back', backData)]);
  
  return Markup.inlineKeyboard(itemButtons);
}

/**
 * Generate confirmation keyboard with custom buttons
 * @param {string} confirmText - Text for confirm button
 * @param {string} confirmData - Callback data for confirm button
 * @param {string} cancelText - Text for cancel button
 * @param {string} cancelData - Callback data for cancel button
 * @returns {Object} - Markup keyboard
 */
function generateConfirmKeyboard(confirmText, confirmData, cancelText, cancelData) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(confirmText, confirmData),
      Markup.button.callback(cancelText, cancelData)
    ]
  ]);
}

/**
 * Create a dynamic menu keyboard
 * @param {Array} options - Array of menu options
 * @param {string} backText - Text for back button
 * @param {string} backData - Callback data for back button
 * @returns {Object} - Markup keyboard
 */
function createMenuKeyboard(options, backText, backData) {
  const keyboard = options.map(option => {
    return [Markup.button.callback(option.text, option.data)];
  });
  
  keyboard.push([Markup.button.callback(backText, backData)]);
  
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Create a numbered list keyboard
 * @param {Array} items - Array of items
 * @param {string} callbackPrefix - Prefix for callback data
 * @param {string} backText - Text for back button
 * @param {string} backData - Callback data for back button
 * @returns {Object} - Markup keyboard
 */
function createNumberedListKeyboard(items, callbackPrefix, backText, backData) {
  const keyboard = items.map((item, index) => {
    return [Markup.button.callback(`${index + 1}. ${item.text}`, `${callbackPrefix}_${item.id || index}`)];
  });
  
  keyboard.push([Markup.button.callback(backText, backData)]);
  
  return Markup.inlineKeyboard(keyboard);
}

/**
 * Create a keyboard with URL buttons
 * @param {Array} items - Array of {text, url} objects
 * @param {string} backText - Text for back button
 * @param {string} backData - Callback data for back button
 * @returns {Object} - Markup keyboard
 */
function createUrlButtonsKeyboard(items, backText, backData) {
  const keyboard = items.map(item => {
    return [Markup.button.url(item.text, item.url)];
  });
  
  if (backText && backData) {
    keyboard.push([Markup.button.callback(backText, backData)]);
  }
  
  return Markup.inlineKeyboard(keyboard);
}

module.exports = {
  generateGridKeyboard,
  generatePaginatedKeyboard,
  generateConfirmKeyboard,
  createMenuKeyboard,
  createNumberedListKeyboard,
  createUrlButtonsKeyboard
};