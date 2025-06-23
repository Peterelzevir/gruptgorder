const User = require('../database/models/user');
const config = require('../config');

/**
 * Middleware to check if user has joined required channels
 */
function channelMiddleware() {
  return async (ctx, next) => {
    try {
      // Skip for specific commands
      if (ctx.updateType === 'callback_query') {
        if (['en', 'id', 'zh', 'uz', 'ru', 'check_membership', 'start'].includes(ctx.callbackQuery.data)) {
          return next();
        }
      }
      
      if (ctx.updateType === 'message' && ctx.message?.text?.startsWith('/start')) {
        return next();
      }
      
      // Get user from session
      const telegramId = ctx.from?.id;
      
      if (!telegramId) {
        console.error('No telegram ID found in context');
        return;
      }
      
      const user = await User.findByTelegramId(telegramId);
      
      if (!user) {
        return ctx.reply(ctx.i18n?.t('not_registered') || 'You are not registered. Please use /start to register.');
      }
      
      // If user has already joined channels, proceed
      if (user.joinedChannels) {
        return next();
      }
      
      // Check if user has joined all required channels
      const hasJoinedChannels = await checkMembership(ctx);
      
      if (!hasJoinedChannels) {
        return showChannelJoinInstructions(ctx);
      }
      
      // Update user and proceed
      user.joinedChannels = true;
      await user.save();
      
      return next();
    } catch (error) {
      console.error('Channel middleware error:', error);
      return ctx.reply(ctx.i18n?.t('error_occurred') || 'An error occurred. Please try again later.');
    }
  };
}

/**
 * Check if user has joined all required channels
 */
async function checkMembership(ctx) {
  try {
    const telegramId = ctx.from.id;
    
    for (const channel of config.REQUIRED_CHANNELS) {
      try {
        const member = await ctx.telegram.getChatMember(channel.id, telegramId);
        
        if (member.status === 'left' || member.status === 'kicked' || member.status === 'banned') {
          return false;
        }
      } catch (error) {
        console.error(`Error checking membership for ${channel.id}:`, error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
}

/**
 * Show instructions to join channels
 */
async function showChannelJoinInstructions(ctx) {
  try {
    const channelButtons = config.REQUIRED_CHANNELS.map(channel => {
      return [{ text: channel.title, url: channel.inviteLink }];
    });
    
    // Add a check button to verify membership
    channelButtons.push([{ text: ctx.i18n?.t('check_membership') || 'Check Membership', callback_data: 'check_membership' }]);
    
    return ctx.reply(
      ctx.i18n?.t('join_channels_message') || 'Please join our channels to use this bot:',
      {
        reply_markup: {
          inline_keyboard: channelButtons
        }
      }
    );
  } catch (error) {
    console.error('Error showing channel instructions:', error);
    return ctx.reply(ctx.i18n?.t('error_occurred') || 'An error occurred. Please try again later.');
  }
}

module.exports = {
  channelMiddleware,
  checkMembership,
  showChannelJoinInstructions
};