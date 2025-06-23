const User = require('../database/models/user');
const config = require('../config');

/**
 * Middleware to check if user is authorized
 * This ensures users are registered in the database
 */
function authMiddleware() {
  return async (ctx, next) => {
    try {
      // Skip for specific commands that don't require auth
      if (ctx.updateType === 'callback_query') {
        if (['en', 'id', 'zh', 'uz', 'ru', 'check_membership', 'start'].includes(ctx.callbackQuery.data)) {
          return next();
        }
      }
      
      if (ctx.updateType === 'message' && ctx.message?.text?.startsWith('/start')) {
        return next();
      }
      
      // Get user from database
      const telegramId = ctx.from?.id;
      
      if (!telegramId) {
        console.error('No telegram ID found in context');
        return;
      }
      
      const user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        return ctx.reply(ctx.i18n?.t('not_registered') || 'You are not registered. Please use /start to register.');
      }
      
      // Set user data in context for later use
      ctx.state.user = user;
      
      // Check if user is blocked
      if (user.isBlocked) {
        return ctx.reply(ctx.i18n?.t('user_blocked') || 'Your account has been blocked. Please contact support.');
      }
      
      // Check if user is admin for admin commands
      if (ctx.message?.text?.startsWith('/admin')) {
        if (!user.isAdmin) {
          return ctx.reply(ctx.i18n?.t('not_authorized') || 'You are not authorized to use admin commands.');
        }
      }
      
      // Update last activity
      user.lastActivity = new Date();
      await user.save();
      
      return next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return ctx.reply(ctx.i18n?.t('error_occurred') || 'An error occurred. Please try again later.');
    }
  };
}

module.exports = authMiddleware;