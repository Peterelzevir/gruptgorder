const { Markup } = require('telegraf');
const User = require('../database/models/user');
const Order = require('../database/models/order');

/**
 * Handle admin command
 * Displays admin options
 */
async function handleAdmin(ctx) {
  try {
    const user = await User.findByTelegramId(ctx.from.id);
    
    if (!user || !user.isAdmin) {
      return ctx.reply(ctx.i18n.t('not_authorized'));
    }
    
    const message = ctx.i18n.t('admin_menu');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('view_all_orders'), 'view_all_orders')],
      [Markup.button.callback(ctx.i18n.t('back_to_main'), 'back_to_main')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error in admin handler:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

/**
 * View all orders
 */
async function viewAllOrders(ctx) {
  try {
    const orders = await Order.find().populate('userId');
    
    if (orders.length === 0) {
      return ctx.reply(ctx.i18n.t('no_orders_found'));
    }
    
    const message = ctx.i18n.t('all_orders') + '\n\n' +
      orders.map(order => {
        return `Order ID: ${order._id}\n:User  ${order.userId.username}\nStatus: ${order.status}\nTotal Price: ${order.totalPrice} USDT`;
      }).join('\n\n');
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(ctx.i18n.t('back_to_admin'), 'back_to_admin')]
    ]);
    
    return ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } catch (error) {
    console.error('Error viewing all orders:', error);
    return ctx.reply(ctx.i18n.t('error_occurred'));
  }
}

// Export handlers
module.exports = {
  handleAdmin,
  viewAllOrders
};
