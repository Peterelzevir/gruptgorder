const { Markup } = require('telegraf');
const User = require('../database/models/user');

/**
 * Handle settings command
 * Displays user settings options
 */
async function handleSettings(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    const message = ctx.i18n.t('settings_menu');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('change_language'), 'change_language')],
      [Markup.button.callback(ctx.i18n.t('back_to_main'), 'back_to_main')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in settings handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Handle language change
 */
async function handleLanguageChange(ctx, language) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user) {
      return ctx.reply(ctx.i18n.t('user_not_found'));
    }
    
    user.language = language;
    await user.save();
    
    ctx.session.language = language; // Update session language
    
    return ctx.reply(ctx.i18n.t('language_changed', { language }));
  } catch (error) {
    console.error('Error changing language:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

// Export handlers
module.exports = {
  handleSettings,
  handleLanguageChange
};
