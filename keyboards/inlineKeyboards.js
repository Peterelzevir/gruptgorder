const { Markup } = require('telegraf');
const config = require('../config');

/**
 * Generate language selection keyboard
 */
function getLanguageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('English 🇬🇧', 'language_en'),
      Markup.button.callback('Indonesia 🇮🇩', 'language_id')
    ],
    [
      Markup.button.callback('中文 🇨🇳', 'language_zh'),
      Markup.button.callback('O\'zbek 🇺🇿', 'language_uz')
    ],
    [
      Markup.button.callback('Русский 🇷🇺', 'language_ru')
    ]
  ]);
}

/**
 * Generate wallet options keyboard
 */
function getWalletKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('topup_usdt'), 'wallet_topup')],
    [Markup.button.callback(ctx.i18n.t('transaction_history'), 'wallet_history')]
  ]);
}

/**
 * Generate deposit amount keyboard
 */
function getDepositAmountKeyboard(ctx) {
  return Markup.inlineKeyboard([
    ...config.WALLET.PREDEFINED_AMOUNTS.map(amount => {
      return [Markup.button.callback(`${amount} USDT`, `wallet_amount_${amount}`)];
    }),
    [Markup.button.callback(ctx.i18n.t('custom_amount'), 'wallet_custom_amount')],
    [Markup.button.callback(ctx.i18n.t('cancel'), 'wallet_cancel')]
  ]);
}

/**
 * Generate deposit confirmation keyboard
 */
function getDepositConfirmKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('confirm'), 'wallet_confirm_deposit')],
    [Markup.button.callback(ctx.i18n.t('cancel'), 'wallet_cancel_deposit')]
  ]);
}

/**
 * Generate admin deposit approval keyboard
 */
function getAdminDepositApprovalKeyboard(ctx, transactionId) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('approve'), `admin_approve_deposit_${transactionId}`)],
    [Markup.button.callback(ctx.i18n.t('reject'), `admin_reject_deposit_${transactionId}`)]
  ]);
}

/**
 * Generate shop type selection keyboard
 */
function getShopTypeKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(ctx.i18n.t('group'), 'shop_type_group'),
      Markup.button.callback(ctx.i18n.t('channel'), 'shop_type_channel')
    ],
    [Markup.button.callback(ctx.i18n.t('cancel'), 'shop_cancel')]
  ]);
}

/**
 * Generate year selection keyboard
 */
function getYearSelectionKeyboard(ctx, years) {
  const buttons = years.map(year => {
    return [Markup.button.callback(`${year}`, `shop_year_${year}`)];
  });
  
  buttons.push([Markup.button.callback(ctx.i18n.t('cancel'), 'shop_cancel')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Generate month selection keyboard
 */
function getMonthSelectionKeyboard(ctx, months) {
  const buttons = [];
  
  // Create rows with 3 months each
  for (let i = 0; i < months.length; i += 3) {
    const row = [];
    for (let j = i; j < i + 3 && j < months.length; j++) {
      row.push(Markup.button.callback(ctx.i18n.t(`month_${months[j].toLowerCase()}`), `shop_month_${months[j]}`));
    }
    buttons.push(row);
  }
  
  buttons.push([Markup.button.callback(ctx.i18n.t('cancel'), 'shop_cancel')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Generate order confirmation keyboard
 */
function getOrderConfirmKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('confirm'), 'shop_confirm_order')],
    [Markup.button.callback(ctx.i18n.t('cancel'), 'shop_cancel_order')]
  ]);
}

/**
 * Generate username confirmation keyboard
 */
function getUsernameConfirmKeyboard(ctx, username) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('confirm'), `shop_confirm_username_${username}`)],
    [Markup.button.callback(ctx.i18n.t('cancel'), 'shop_cancel_username')]
  ]);
}

/**
 * Generate order completed keyboard
 */
function getOrderCompletedKeyboard(ctx, adminUsername) {
  return Markup.inlineKeyboard([
    [Markup.button.url(ctx.i18n.t('contact_admin'), `https://t.me/${adminUsername}`)]
  ]);
}

/**
 * Generate statistics update keyboard
 */
function getStatisticsUpdateKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('update'), 'statistics_update')]
  ]);
}

/**
 * Generate admin order management keyboard
 */
function getAdminOrderKeyboard(ctx, orderId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(ctx.i18n.t('approve'), `admin_approve_order_${orderId}`),
      Markup.button.callback(ctx.i18n.t('reject'), `admin_reject_order_${orderId}`)
    ],
    [Markup.button.callback(ctx.i18n.t('back'), 'admin_back_to_orders')]
  ]);
}

/**
 * Generate channel join keyboard
 */
function getChannelJoinKeyboard(ctx) {
  const buttons = config.REQUIRED_CHANNELS.map(channel => {
    return [Markup.button.url(channel.title, channel.inviteLink)];
  });
  
  buttons.push([Markup.button.callback(ctx.i18n.t('check_membership'), 'check_membership')]);
  
  return Markup.inlineKeyboard(buttons);
}

/**
 * Generate guide keyboard
 */
function getGuideKeyboard(ctx) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(ctx.i18n.t('how_to_use'), 'guide_how_to_use')],
    [Markup.button.callback(ctx.i18n.t('faq'), 'guide_faq')],
    [Markup.button.callback(ctx.i18n.t('back'), 'guide_back')]
  ]);
}

module.exports = {
  getLanguageKeyboard,
  getWalletKeyboard,
  getDepositAmountKeyboard,
  getDepositConfirmKeyboard,
  getAdminDepositApprovalKeyboard,
  getShopTypeKeyboard,
  getYearSelectionKeyboard,
  getMonthSelectionKeyboard,
  getOrderConfirmKeyboard,
  getUsernameConfirmKeyboard,
  getOrderCompletedKeyboard,
  getStatisticsUpdateKeyboard,
  getAdminOrderKeyboard,
  getChannelJoinKeyboard,
  getGuideKeyboard
};