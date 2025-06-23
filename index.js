const { Telegraf, session, Scenes } = require('telegraf');
const { message } = require('telegraf/filters');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./database/db');

// Import middlewares
const authMiddleware = require('./middlewares/authMiddleware');
const channelMiddleware = require('./middlewares/channelMiddleware');
const languageMiddleware = require('./middlewares/languageMiddleware');

// Import handlers
const startHandler = require('./handlers/startHandler');
const walletHandler = require('./handlers/walletHandler');
const shopHandler = require('./handlers/shopHandler');
const ordersHandler = require('./handlers/ordersHandler');
const statisticsHandler = require('./handlers/statisticsHandler');
const supportHandler = require('./handlers/supportHandler');
const settingsHandler = require('./handlers/settingsHandler');
const adminHandler = require('./handlers/adminHandler');

// Import keyboards
const { getMainKeyboard } = require('./keyboards/replyKeyboards');

// Import locales
const locales = {
  en: require('./locales/en.json'),
  id: require('./locales/id.json'),
  zh: require('./locales/zh.json'),
  uz: require('./locales/uz.json'),
  ru: require('./locales/ru.json')
};

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Initialize session middleware
bot.use(session());

// Set up session defaults
bot.use((ctx, next) => {
  if (!ctx.session) {
    ctx.session = {};
  }
  if (!ctx.session.language) {
    ctx.session.language = 'en'; // Default language
  }
  return next();
});

// Set up middlewares
bot.use(languageMiddleware(locales));
bot.use(authMiddleware());

// Setup command handling
bot.command('start', startHandler.handleStart);
bot.command('help', async (ctx) => {
  const locale = ctx.i18n.locale();
  await ctx.reply(ctx.i18n.t('help_message'), { parse_mode: 'Markdown' });
});

// Set up scene handling for complex workflows
const stage = new Scenes.Stage([
  ...walletHandler.scenes,
  ...shopHandler.scenes,
  ...supportHandler.scenes,
  ...adminHandler.scenes
]);
bot.use(stage.middleware());

// Handle text messages
bot.on(message('text'), async (ctx) => {
  const { text } = ctx.message;
  const locale = ctx.i18n.locale();
  
  // Ignore messages from non-registered users (except /start command)
  if (!ctx.session.registered && !text.startsWith('/start')) {
    return ctx.reply(ctx.i18n.t('not_registered'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: ctx.i18n.t('start_bot'), callback_data: 'start' }]
        ]
      }
    });
  }
  
  // Check if user has joined required channels before allowing any commands
  if (ctx.session.registered && !ctx.session.hasJoinedChannels) {
    const result = await channelMiddleware.checkMembership(ctx);
    if (!result) {
      return; // Message about joining channels was already sent by middleware
    }
  }
  
  // Handle main menu buttons
  switch (text) {
    case ctx.i18n.t('wallet_button'):
      return walletHandler.handleWallet(ctx);
    
    case ctx.i18n.t('shop_button'):
      return shopHandler.handleShop(ctx);
    
    case ctx.i18n.t('orders_button'):
      return ordersHandler.handleOrders(ctx);
    
    case ctx.i18n.t('statistics_button'):
      return statisticsHandler.handleStatistics(ctx);
    
    case ctx.i18n.t('ready_accounts_button'):
      return ctx.reply(ctx.i18n.t('contact_admin_message'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: ctx.i18n.t('contact_admin'), url: `https://t.me/${config.ADMIN_USERNAME}` }]
          ]
        }
      });
    
    case ctx.i18n.t('support_button'):
      return supportHandler.startSupportSession(ctx);
    
    case ctx.i18n.t('settings_button'):
      return settingsHandler.handleSettings(ctx);
    
    case ctx.i18n.t('cancel_button'):
      // Cancel current operation and return to main menu
      if (ctx.session.currentOperation) {
        ctx.session.currentOperation = null;
        return ctx.reply(ctx.i18n.t('operation_cancelled'), {
          reply_markup: { keyboard: getMainKeyboard(ctx), resize_keyboard: true }
        });
      }
      return ctx.reply(ctx.i18n.t('main_menu_message'), {
        reply_markup: { keyboard: getMainKeyboard(ctx), resize_keyboard: true }
      });
    
    // Admin commands are prefixed with "admin_"
    default:
      if (text.startsWith('admin_') && ctx.session.isAdmin) {
        return adminHandler.handleAdminCommands(ctx, text);
      }
      
      // Handle support chat if active
      if (ctx.session.supportChatActive) {
        return supportHandler.handleSupportMessage(ctx);
      }
      
      // Default response for unknown commands
      return ctx.reply(ctx.i18n.t('unknown_command'), {
        reply_markup: { keyboard: getMainKeyboard(ctx), resize_keyboard: true }
      });
  }
});

// Handle callback queries from inline buttons
bot.on('callback_query', async (ctx) => {
  const callbackData = ctx.callbackQuery.data;
  
  // Handle language selection
  if (['en', 'id', 'zh', 'uz', 'ru'].includes(callbackData)) {
    return settingsHandler.handleLanguageChange(ctx, callbackData);
  }
  
  // Handle start callback
  if (callbackData === 'start') {
    return startHandler.handleStart(ctx);
  }
  
  // Handle wallet callbacks
  if (callbackData.startsWith('wallet_')) {
    return walletHandler.handleWalletCallbacks(ctx, callbackData);
  }
  
  // Handle shop callbacks
  if (callbackData.startsWith('shop_')) {
    return shopHandler.handleShopCallbacks(ctx, callbackData);
  }
  
  // Handle admin callbacks
  if (callbackData.startsWith('admin_')) {
    return adminHandler.handleAdminCallbacks(ctx, callbackData);
  }
  
  // Handle other callbacks
  switch (callbackData) {
    case 'cancel':
      await ctx.deleteMessage();
      return ctx.reply(ctx.i18n.t('operation_cancelled'), {
        reply_markup: { keyboard: getMainKeyboard(ctx), resize_keyboard: true }
      });
    
    default:
      await ctx.answerCbQuery(ctx.i18n.t('invalid_action'));
  }
});

// Handle photo messages (for deposit confirmations)
bot.on(message('photo'), async (ctx) => {
  if (ctx.session.awaitingDepositConfirmation) {
    return walletHandler.handleDepositProof(ctx);
  }
  
  // Handle support chat photos
  if (ctx.session.supportChatActive) {
    return supportHandler.handleSupportPhoto(ctx);
  }
});

// Set bot commands for all languages
const setCommands = async () => {
  // English commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'help', description: 'Get help on how to use the bot' }
  ], { language_code: 'en' });
  
  // Indonesian commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Mulai bot' },
    { command: 'help', description: 'Dapatkan bantuan cara menggunakan bot' }
  ], { language_code: 'id' });
  
  // Chinese commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: '启动机器人' },
    { command: 'help', description: '获取如何使用机器人的帮助' }
  ], { language_code: 'zh' });
  
  // Uzbek commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Botni ishga tushirish' },
    { command: 'help', description: 'Botdan foydalanish bo\'yicha yordam olish' }
  ], { language_code: 'uz' });
  
  // Russian commands
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Запустить бота' },
    { command: 'help', description: 'Получить помощь по использованию бота' }
  ], { language_code: 'ru' });
};

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  
  // Log the error to a file
  const errorLog = `${new Date().toISOString()} - Error in ${ctx.updateType}: ${err.message}\n${err.stack}\n\n`;
  fs.appendFileSync(path.join(__dirname, 'error.log'), errorLog);
  
  // Notify admin about the error
  if (config.ADMIN_ID) {
    bot.telegram.sendMessage(config.ADMIN_ID, 
      `Error in bot: ${err.message}\nType: ${ctx.updateType}\nUser: ${ctx.from ? ctx.from.id : 'Unknown'}`
    ).catch(console.error);
  }
  
  // Send generic error message to user
  if (ctx.chat) {
    ctx.reply(ctx.i18n ? ctx.i18n.t('error_occurred') : 'An error occurred. Please try again later.')
      .catch(console.error);
  }
});

// Connect to database and launch the bot
(async () => {
  try {
    // Connect to database
    await db.connect();
    console.log('Connected to database');
    
    // Set bot commands
    await setCommands();
    console.log('Bot commands set');
    
    // Launch the bot
    await bot.launch();
    console.log('Bot started');
  } catch (error) {
    console.error('Failed to start the bot:', error);
  }
})();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
