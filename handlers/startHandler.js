const { Markup } = require('telegraf');
const User = require('../database/models/user');
const { getMainKeyboard } = require('../keyboards/replyKeyboards');
const channelMiddleware = require('../middlewares/channelMiddleware');
const config = require('../config');

/**
 * Handle the /start command
 * This is the entry point for users
 */
async function handleStart(ctx) {
  const telegramId = ctx.from.id;
  const userData = {
    telegramId,
    username: ctx.from.username,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name
  };

  try {
    // Find or create user
    const user = await User.findOrCreate(userData);
    ctx.session.userId = user._id;
    ctx.session.registered = true;
    
    // If user has already selected a language, use that
    if (user.language) {
      ctx.session.language = user.language;
    }
    
    // Check if user has a language preference
    if (!user.language) {
      // Show language selection keyboard
      return showLanguageSelection(ctx);
    }
    
    // Check if user has joined required channels
    const hasJoinedChannels = await channelMiddleware.checkMembership(ctx);
    ctx.session.hasJoinedChannels = hasJoinedChannels;
    
    if (!hasJoinedChannels) {
      // Show channel joining instructions
      return showChannelJoinInstructions(ctx);
    }
    
    // User has already joined channels, show main menu
    return showMainMenu(ctx, user);
    
  } catch (error) {
    console.error('Error in start handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Show language selection keyboard
 */
async function showLanguageSelection(ctx) {
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('English 🇬🇧', 'en'),
      Markup.button.callback('Indonesia 🇮🇩', 'id')
    ],
    [
      Markup.button.callback('中文 🇨🇳', 'zh'),
      Markup.button.callback('O\'zbek 🇺🇿', 'uz')
    ],
    [
      Markup.button.callback('Русский 🇷🇺', 'ru')
    ]
  ]);
  
  return ctx.reply('Please select your language / Silakan pilih bahasa Anda / 请选择您的语言 / Tilni tanlang / Выберите ваш язык:', keyboard);
}

/**
 * Handle language selection callback
 */
async function handleLanguageSelection(ctx, language) {
  try {
    // Update user's language preference
    const user = await User.findByTelegramId(ctx.from.id);
    user.language = language;
    await user.save();
    
    // Update session language
    ctx.session.language = language;
    
    // Delete the language selection message
    await ctx.deleteMessage();
    
    // Check if user has joined required channels
    const hasJoinedChannels = await channelMiddleware.checkMembership(ctx);
    ctx.session.hasJoinedChannels = hasJoinedChannels;
    
    if (!hasJoinedChannels) {
      // Show channel joining instructions
      return showChannelJoinInstructions(ctx);
    }
    
    // User has already joined channels, show main menu
    return showMainMenu(ctx, user);
    
  } catch (error) {
    console.error('Error in language selection handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * Show channel joining instructions
 */
async function showChannelJoinInstructions(ctx) {
  const channelButtons = config.REQUIRED_CHANNELS.map(channel => {
    return [Markup.button.url(channel.title, channel.inviteLink)];
  });
  
  // Add a check button to verify membership
  channelButtons.push([Markup.button.callback(ctx.i18n.t('check_membership'), 'check_membership')]);
  
  const keyboard = Markup.inlineKeyboard(channelButtons);
  
  return ctx.reply(ctx.i18n.t('join_channels_message'), keyboard);
}

/**
 * Show main menu
 */
async function showMainMenu(ctx, user) {
  // Mark user as having joined channels
  ctx.session.hasJoinedChannels = true;
  
  // Welcome message with main keyboard
  return ctx.reply(
    ctx.i18n.t('welcome_message', { name: user.firstName || user.username || 'there' }),
    {
      parse_mode: 'Markdown',
      reply_markup: { keyboard: getMainKeyboard(ctx), resize_keyboard: true }
    }
  );
}

/**
 * Handle check membership callback
 */
async function handleCheckMembership(ctx) {
  try {
    const hasJoinedChannels = await channelMiddleware.checkMembership(ctx);
    
    if (hasJoinedChannels) {
      // Update user and session
      ctx.session.hasJoinedChannels = true;
      const user = await User.findByTelegramId(ctx.from.id);
      user.joinedChannels = true;
      await user.save();
      
      // Delete the check message
      await ctx.deleteMessage();
      
      // Show main menu
      return showMainMenu(ctx, user);
    } else {
      return ctx.answerCbQuery(ctx.i18n.t('not_joined_all_channels'), { show_alert: true });
    }
  } catch (error) {
    console.error('Error checking membership:', error);
    return ctx.answerCbQuery(ctx.i18n.t('error_occurred'), { show_alert: true });
  }
}

module.exports = {
  handleStart,
  handleLanguageSelection,
  handleCheckMembership,
  showMainMenu
};