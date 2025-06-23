/**
 * Generate the main keyboard
 * This keyboard appears below the text input field
 */
function getMainKeyboard(ctx) {
  const keyboard = [
    [ctx.i18n.t('wallet_button'), ctx.i18n.t('shop_button')],
    [ctx.i18n.t('orders_button'), ctx.i18n.t('statistics_button')],
    [ctx.i18n.t('ready_accounts_button')],
    [ctx.i18n.t('support_button'), ctx.i18n.t('settings_button')]
  ];
  
  // Add admin row if user is admin
  if (ctx.state.user && ctx.state.user.isAdmin) {
    keyboard.push([ctx.i18n.t('admin_button')]);
  }
  
  return keyboard;
}

/**
 * Generate a keyboard with just the cancel button
 */
function getCancelKeyboard(ctx) {
  return [
    [ctx.i18n.t('cancel_button')]
  ];
}

/**
 * Generate a keyboard for support chat
 */
function getSupportKeyboard(ctx) {
  return [
    [ctx.i18n.t('cancel_button')]
  ];
}

/**
 * Generate a keyboard for shop navigation
 */
function getShopKeyboard(ctx) {
  return [
    [ctx.i18n.t('group_button'), ctx.i18n.t('channel_button')],
    [ctx.i18n.t('cancel_button')]
  ];
}

/**
 * Generate a keyboard for admin functions
 */
function getAdminKeyboard(ctx) {
  return [
    [ctx.i18n.t('add_stock_button'), ctx.i18n.t('add_catalog_button')],
    [ctx.i18n.t('change_price_button'), ctx.i18n.t('transactions_button')],
    [ctx.i18n.t('all_orders_button'), ctx.i18n.t('stats_button')],
    [ctx.i18n.t('cancel_button')]
  ];
}

/**
 * Generate a keyboard with months
 */
function getMonthsKeyboard(ctx) {
  const keyboard = [];
  const months = [
    'January', 'February', 'March',
    'April', 'May', 'June',
    'July', 'August', 'September',
    'October', 'November', 'December'
  ];
  
  // Create rows with 3 months each
  for (let i = 0; i < months.length; i += 3) {
    const row = [];
    for (let j = i; j < i + 3 && j < months.length; j++) {
      row.push(ctx.i18n.t(`month_${months[j].toLowerCase()}`));
    }
    keyboard.push(row);
  }
  
  // Add cancel button
  keyboard.push([ctx.i18n.t('cancel_button')]);
  
  return keyboard;
}

/**
 * Generate a keyboard with years
 */
function getYearsKeyboard(ctx, years) {
  const keyboard = [];
  
  // Create rows with 2 years each
  for (let i = 0; i < years.length; i += 2) {
    const row = [];
    for (let j = i; j < i + 2 && j < years.length; j++) {
      row.push(years[j].toString());
    }
    keyboard.push(row);
  }
  
  // Add cancel button
  keyboard.push([ctx.i18n.t('cancel_button')]);
  
  return keyboard;
}

module.exports = {
  getMainKeyboard,
  getCancelKeyboard,
  getSupportKeyboard,
  getShopKeyboard,
  getAdminKeyboard,
  getMonthsKeyboard,
  getYearsKeyboard
};