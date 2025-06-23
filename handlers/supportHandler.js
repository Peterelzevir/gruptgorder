const { Markup } = require('telegraf');
const User = require('../database/models/user');

/**
 * Handle support command
 * Initiates a support session
 */
async function handleSupport(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    ctx.session.supportChatActive = true;
    ctx.session.supportChatStartedAt = new Date();
    
    return ctx.reply(ctx.i18n.t('support_initiated'), {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback(ctx.i18n.t('end_support'), 'end_support')]
      ])
    });
  } catch (error) {
    console.error('Error in support handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle support message
 */
async function handleSupportMessage(ctx) {
  try {
    if (!ctx.session.supportChatActive) {
      return ctx.reply(ctx.i18n.t('no_active_support'));
    }
    
    // Logic to handle support messages
    // This could involve saving the message to a database or notifying an admin
    
    return ctx.reply(ctx.i18n.t('support_message_received'));
  } catch (error) {
    console.error('Error handling support message:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * End support session
 */
async function endSupportSession(ctx) {
  ctx.session.supportChatActive = false;
  return ctx.reply(ctx.i18n.t('support_session_ended'));
}

// Export handlers
module.exports = {
  handleSupport,
  handleSupportMessage,
  endSupportSession
};
