const { Markup } = require('telegraf');
const User = require('../database/models/user');
const Order = require('../database/models/order');

/**
 * Handle statistics command
 * Displays statistics for the admin
 */
async function handleStatistics(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user || !user.isAdmin) {
      return ctx.reply(ctx.i18n.t('not_authorized'));
    }
    
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    
    const totalRevenueAmount = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const message = ctx.i18n.t('statistics_info', {
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenueAmount
    });
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('back_to_admin'), 'back_to_admin')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in statistics handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

// Export handlers
module.exports = {
  handleStatistics
};
